import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { ReserveInventoryResponse } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const FREE_SHIPPING_THRESHOLD = 289.9;
const FIXED_SHIPPING_PRICE = 2500; // R$ 25,00 em centavos
const MIN_SUBTOTAL = 10.0;
const MAX_SUBTOTAL = 100000.0;
const MIN_QUANTITY = 1;
const MAX_QUANTITY_PER_ITEM = 10;
const MAX_ITEMS_PER_CART = 20;
const MAX_TOTAL_QUANTITY = 50;

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  kitProducts?: string[];
  isKit?: boolean;
}

interface CheckoutFormData {
  email: string;
  cpf: string;
  phone: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

interface CreatePaymentIntentBody {
  items: CartItem[];
  userId?: string;
  customerEmail?: string;
  checkoutData?: CheckoutFormData;
}

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
    maxNetworkRetries: 2,
    timeout: 30000,
  });
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase configuration.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function releaseReservation(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  reservationId: string,
) {
  try {
    await supabase.rpc("release_reservation", {
      p_stripe_session_id: reservationId,
      p_reason: "Checkout embed failed",
    });
  } catch (e) {
    console.error("[create-payment-intent] release error:", reservationId, e);
  }
}

function validateCartItems(items: CartItem[]): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(items) || items.length === 0)
    return { valid: false, error: "Carrinho vazio ou inválido" };
  if (items.length > MAX_ITEMS_PER_CART)
    return { valid: false, error: `Máximo de ${MAX_ITEMS_PER_CART} itens` };
  let totalQty = 0;
  const seen = new Set<string>();
  for (const item of items) {
    if (
      !item.id ||
      !item.name ||
      typeof item.price !== "number" ||
      typeof item.quantity !== "number"
    )
      return { valid: false, error: "Item inválido" };
    if (seen.has(item.id))
      return { valid: false, error: `Item duplicado: ${item.name}` };
    seen.add(item.id);
    if (!Number.isFinite(item.price) || item.price <= 0 || item.price > 100000)
      return { valid: false, error: `Preço inválido: ${item.name}` };
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < MIN_QUANTITY ||
      item.quantity > MAX_QUANTITY_PER_ITEM
    )
      return { valid: false, error: `Quantidade inválida: ${item.name}` };
    totalQty += item.quantity;
    if (totalQty > MAX_TOTAL_QUANTITY)
      return {
        valid: false,
        error: `Quantidade total máxima: ${MAX_TOTAL_QUANTITY}`,
      };
    if (
      item.isKit &&
      (!item.kitProducts ||
        !Array.isArray(item.kitProducts) ||
        item.kitProducts.length === 0)
    )
      return { valid: false, error: `Kit sem produtos: ${item.name}` };
  }
  return { valid: true };
}

function validateSubtotal(subtotal: number): {
  valid: boolean;
  error?: string;
} {
  if (subtotal < MIN_SUBTOTAL)
    return {
      valid: false,
      error: `Subtotal mínimo R$ ${MIN_SUBTOTAL.toFixed(2)}`,
    };
  if (subtotal > MAX_SUBTOTAL)
    return { valid: false, error: "Subtotal excede o máximo" };
  if (!Number.isFinite(subtotal))
    return { valid: false, error: "Erro no subtotal" };
  return { valid: true };
}

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((acc, i) => acc + i.price * i.quantity, 0);
}

export async function POST(req: Request) {
  try {
    let body: CreatePaymentIntentBody;
    try {
      const raw = await req.json();
      if (!raw || typeof raw !== "object" || !Array.isArray(raw.items)) {
        return NextResponse.json(
          { error: "Body inválido: items obrigatório" },
          { status: 400 },
        );
      }
      body = raw as CreatePaymentIntentBody;
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    const { items, userId, customerEmail, checkoutData } = body;

    const stripe = getStripeClient();
    const cartValidation = validateCartItems(items);
    if (!cartValidation.valid)
      return NextResponse.json(
        { error: cartValidation.error },
        { status: 400 },
      );

    const subtotal = calculateSubtotal(items);
    const subtotalValidation = validateSubtotal(subtotal);
    if (!subtotalValidation.valid)
      return NextResponse.json(
        { error: subtotalValidation.error },
        { status: 400 },
      );

    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingAmount = isFreeShipping ? 0 : FIXED_SHIPPING_PRICE;
    const totalReais = subtotal + shippingAmount / 100;
    const amountInCents = Math.round(totalReais * 100);

    const emailTrimmed =
      customerEmail && typeof customerEmail === "string"
        ? customerEmail.trim().toLowerCase()
        : "";
    if (!emailTrimmed)
      return NextResponse.json(
        { error: "E-mail é obrigatório para concluir o checkout." },
        { status: 400 },
      );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed))
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();
    const tempSessionId = `temp_pi_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const tempReservationIds: string[] = [];

    for (const item of items) {
      if (item.isKit && item.kitProducts && item.kitProducts.length > 0) {
        for (const productId of item.kitProducts) {
          const uniqueId = `${tempSessionId}_${productId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          tempReservationIds.push(uniqueId);
          const { data, error } = await supabaseAdmin.rpc("reserve_inventory", {
            p_product_id: productId,
            p_quantity: item.quantity,
            p_stripe_session_id: uniqueId,
            p_customer_email: emailTrimmed,
            p_user_id: userId || null,
          });
          if (error) {
            for (const id of tempReservationIds)
              await releaseReservation(supabaseAdmin, id);
            return NextResponse.json(
              {
                error: `Erro ao reservar estoque para ${item.name}. Tente novamente.`,
              },
              { status: 500 },
            );
          }
          const result = data as ReserveInventoryResponse;
          if (!result?.success) {
            for (const id of tempReservationIds)
              await releaseReservation(supabaseAdmin, id);
            return NextResponse.json(
              {
                error:
                  result?.error || `Estoque insuficiente para ${item.name}`,
              },
              { status: 409 },
            );
          }
        }
      } else {
        const uniqueId = `${tempSessionId}_${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        tempReservationIds.push(uniqueId);
        const { data, error } = await supabaseAdmin.rpc("reserve_inventory", {
          p_product_id: item.id,
          p_quantity: item.quantity,
          p_stripe_session_id: uniqueId,
          p_customer_email: emailTrimmed,
          p_user_id: userId || null,
        });
        if (error) {
          for (const id of tempReservationIds)
            await releaseReservation(supabaseAdmin, id);
          return NextResponse.json(
            {
              error: `Erro ao reservar estoque para ${item.name}. Tente novamente.`,
            },
            { status: 500 },
          );
        }
        const result = data as ReserveInventoryResponse;
        if (!result?.success) {
          for (const id of tempReservationIds)
            await releaseReservation(supabaseAdmin, id);
          return NextResponse.json(
            { error: `Estoque insuficiente para ${item.name}` },
            { status: 409 },
          );
        }
      }
    }

    const metadata: Record<string, string> = {
      userId: userId || "null",
      customerEmail: emailTrimmed,
      total: totalReais.toFixed(2),
      items: JSON.stringify(items),
    };
    if (checkoutData) metadata.checkoutData = JSON.stringify(checkoutData);

    // return_url é passado no cliente ao chamar confirmPayment() (Stripe Elements)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "brl",
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    for (const reservationId of tempReservationIds) {
      await supabaseAdmin
        .from("inventory_reservations")
        .update({ stripe_session_id: paymentIntent.id })
        .eq("stripe_session_id", reservationId)
        .eq("status", "active");
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: unknown) {
    console.error("[create-payment-intent]", err);
    const message =
      err instanceof Error ? err.message : "Erro ao criar pagamento.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
