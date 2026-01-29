import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createOrder,
  getCharge,
  extractPixFromTransaction,
  isPagarmeConfigured,
  type PagarmeAddress,
  type PagarmeCustomer,
  type PagarmeOrderItem,
  type PagarmePayment,
} from "@/lib/pagarme";
import type { ReserveInventoryResponse } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ============================================================================
// CONSTANTES DE NEGÓCIO
// ============================================================================
const FREE_SHIPPING_THRESHOLD = 289.9;
const FIXED_SHIPPING_REAIS = 25;
const PIX_DISCOUNT_PERCENT = 0.05;
const MIN_SUBTOTAL = 10;
const MAX_SUBTOTAL = 100000;
const MIN_QUANTITY = 1;
const MAX_QUANTITY_PER_ITEM = 10;
const MAX_ITEMS_PER_CART = 20;
const MAX_TOTAL_QUANTITY = 50;

// ============================================================================
// TIPOS
// ============================================================================
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

interface PagarmeCheckoutRequestBody {
  items: CartItem[];
  userId?: string | null;
  customerEmail?: string | null;
  paymentMethod: "pix" | "card";
  installmentOption?: "1x" | "2x" | "3x";
  cardToken?: string | null;
  checkoutData: CheckoutFormData;
}

// ============================================================================
// SUPABASE
// ============================================================================
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase configuration.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================================================
// VALIDAÇÃO E CÁLCULOS
// ============================================================================
function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

function validateCartItems(items: CartItem[]): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(items) || items.length === 0)
    return { valid: false, error: "Carrinho vazio" };
  if (items.length > MAX_ITEMS_PER_CART)
    return {
      valid: false,
      error: `Máximo de ${MAX_ITEMS_PER_CART} itens diferentes permitidos`,
    };
  const seen = new Set<string>();
  let totalQty = 0;
  for (const item of items) {
    if (
      !item.id ||
      !item.name ||
      typeof item.price !== "number" ||
      typeof item.quantity !== "number"
    )
      return { valid: false, error: "Estrutura de item inválida" };
    if (seen.has(item.id))
      return { valid: false, error: `Item duplicado: ${item.name}` };
    seen.add(item.id);
    if (!Number.isFinite(item.price) || item.price <= 0 || item.price > 100000)
      return { valid: false, error: `Preço inválido para ${item.name}` };
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < MIN_QUANTITY ||
      item.quantity > MAX_QUANTITY_PER_ITEM
    )
      return { valid: false, error: `Quantidade inválida para ${item.name}` };
    totalQty += item.quantity;
    if (totalQty > MAX_TOTAL_QUANTITY)
      return {
        valid: false,
        error: `Quantidade total máxima excedida (${MAX_TOTAL_QUANTITY})`,
      };
    if (
      item.isKit &&
      (!item.kitProducts ||
        !Array.isArray(item.kitProducts) ||
        item.kitProducts.length === 0)
    )
      return { valid: false, error: `Kit ${item.name} sem produtos definidos` };
  }
  return { valid: true };
}

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((acc, i) => acc + i.price * i.quantity, 0);
}

function validateSubtotal(subtotal: number): {
  valid: boolean;
  error?: string;
} {
  if (subtotal < MIN_SUBTOTAL)
    return {
      valid: false,
      error: `Subtotal mínimo R$ ${MIN_SUBTOTAL} não atingido`,
    };
  if (subtotal > MAX_SUBTOTAL)
    return { valid: false, error: "Subtotal excede o valor máximo permitido." };
  if (!Number.isFinite(subtotal))
    return { valid: false, error: "Erro no cálculo do subtotal." };
  return { valid: true };
}

async function releaseReservations(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  sessionId: string,
) {
  try {
    await supabase.rpc("release_reservation", {
      p_stripe_session_id: sessionId,
      p_reason: "Checkout Pagar.me failed - releasing reservation",
    });
  } catch (e) {
    console.error("[PAGARME CHECKOUT] releaseReservations error:", e);
  }
}

// ============================================================================
// POST /api/checkout/pagarme
// ============================================================================
export async function POST(req: Request) {
  if (!isPagarmeConfigured()) {
    return NextResponse.json(
      { error: "Pagar.me não está configurado. Configure PAGARME_SECRET_KEY." },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json()) as PagarmeCheckoutRequestBody;
    const {
      items,
      userId,
      customerEmail: bodyEmail,
      paymentMethod,
      installmentOption,
      cardToken,
      checkoutData,
    } = body;

    const cartValidation = validateCartItems(items);
    if (!cartValidation.valid) {
      return NextResponse.json(
        { error: cartValidation.error || "Carrinho inválido" },
        { status: 400 },
      );
    }

    const email =
      checkoutData?.email?.trim()?.toLowerCase() ||
      bodyEmail?.trim()?.toLowerCase() ||
      "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "E-mail válido é obrigatório para o checkout." },
        { status: 400 },
      );
    }

    if (!checkoutData?.cpf || onlyDigits(checkoutData.cpf).length !== 11) {
      return NextResponse.json(
        { error: "CPF válido (11 dígitos) é obrigatório." },
        { status: 400 },
      );
    }

    if (paymentMethod === "card") {
      const installments =
        installmentOption === "2x" ? 2 : installmentOption === "3x" ? 3 : 1;
      if (installments > 1 && !cardToken) {
        return NextResponse.json(
          { error: "Token do cartão é obrigatório para pagamento com cartão." },
          { status: 400 },
        );
      }
      if (installments === 1 && !cardToken) {
        return NextResponse.json(
          { error: "Token do cartão é obrigatório." },
          { status: 400 },
        );
      }
    }

    const subtotal = calculateSubtotal(items);
    const subtotalValidation = validateSubtotal(subtotal);
    if (!subtotalValidation.valid) {
      return NextResponse.json(
        { error: subtotalValidation.error || "Subtotal inválido" },
        { status: 400 },
      );
    }

    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingReais = isFreeShipping ? 0 : FIXED_SHIPPING_REAIS;
    const pixDiscount =
      paymentMethod === "pix" ? subtotal * PIX_DISCOUNT_PERCENT : 0;
    const totalReais = subtotal + shippingReais - pixDiscount;
    const totalCents = Math.round(totalReais * 100);

    const supabase = getSupabaseAdmin();
    const tempSessionId = `temp_pagarme_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const reservationIds: string[] = [];

    try {
      for (const item of items) {
        if (item.isKit && item.kitProducts && item.kitProducts.length > 0) {
          for (const productId of item.kitProducts) {
            const uniqueId = `${tempSessionId}_${productId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            reservationIds.push(uniqueId);
            const { data, error } = await supabase.rpc("reserve_inventory", {
              p_product_id: productId,
              p_quantity: item.quantity,
              p_stripe_session_id: uniqueId,
              p_customer_email: email,
              p_user_id: userId || null,
            });
            if (error) {
              for (const id of reservationIds)
                await releaseReservations(supabase, id);
              return NextResponse.json(
                {
                  error: `Erro ao reservar estoque para ${item.name}. Tente novamente.`,
                },
                { status: 500 },
              );
            }
            const result = data as ReserveInventoryResponse;
            if (!result?.success) {
              for (const id of reservationIds)
                await releaseReservations(supabase, id);
              return NextResponse.json(
                {
                  error:
                    result?.error === "Product not found in inventory"
                      ? "Produto do kit não encontrado no estoque."
                      : `Estoque insuficiente para ${item.name}.`,
                },
                { status: 409 },
              );
            }
          }
        } else {
          const uniqueId = `${tempSessionId}_${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          reservationIds.push(uniqueId);
          const { data, error } = await supabase.rpc("reserve_inventory", {
            p_product_id: item.id,
            p_quantity: item.quantity,
            p_stripe_session_id: uniqueId,
            p_customer_email: email,
            p_user_id: userId || null,
          });
          if (error) {
            for (const id of reservationIds)
              await releaseReservations(supabase, id);
            return NextResponse.json(
              { error: `Erro ao reservar estoque para ${item.name}.` },
              { status: 500 },
            );
          }
          const result = data as ReserveInventoryResponse;
          if (!result?.success) {
            for (const id of reservationIds)
              await releaseReservations(supabase, id);
            return NextResponse.json(
              { error: `Estoque insuficiente para ${item.name}.` },
              { status: 409 },
            );
          }
        }
      }

      // Pagar.me: amount = preço unitário em centavos (>= 1); quantity = quantidade.
      // Desconto PIX: aplicado no primeiro item (API não aceita amount negativo).
      const pixDiscountCents = Math.round(pixDiscount * 100);
      const pagarmeItems: PagarmeOrderItem[] = items.map((item, index) => {
        let amountCents = Math.round(item.price * 100);
        if (
          index === 0 &&
          paymentMethod === "pix" &&
          pixDiscountCents > 0 &&
          item.quantity > 0
        ) {
          const itemTotalCents = amountCents * item.quantity;
          const discountApplied = Math.min(
            pixDiscountCents,
            itemTotalCents - item.quantity,
          );
          amountCents = Math.max(
            1,
            Math.round((itemTotalCents - discountApplied) / item.quantity),
          );
        }
        return {
          amount: amountCents,
          description: item.name,
          quantity: item.quantity,
          code: item.id,
        };
      });

      if (shippingReais > 0) {
        pagarmeItems.push({
          amount: Math.round(shippingReais * 100),
          description: "Frete",
          quantity: 1,
          code: "shipping",
        });
      }

      const address: PagarmeAddress = {
        line_1: [checkoutData.address.street, checkoutData.address.number]
          .filter(Boolean)
          .join(", "),
        line_2: checkoutData.address.complement || undefined,
        zip_code: onlyDigits(checkoutData.address.cep),
        city: checkoutData.address.city,
        state: checkoutData.address.state,
        country: "BR",
      };

      const phoneDigits = onlyDigits(checkoutData.phone || "");
      const mobile =
        phoneDigits.length >= 10
          ? {
              country_code: "55",
              area_code: phoneDigits.slice(0, 2),
              number: phoneDigits.slice(2),
            }
          : undefined;

      const customer: PagarmeCustomer = {
        name: "Cliente VIOS",
        email,
        document: onlyDigits(checkoutData.cpf),
        type: "individual",
        address,
        phones: mobile ? { mobile_phone: mobile } : undefined,
      };

      const payments: PagarmePayment[] =
        paymentMethod === "pix"
          ? [{ payment_method: "pix", pix: { expires_in: 30 } }]
          : [
              {
                payment_method: "credit_card",
                credit_card: {
                  card_token: cardToken!,
                  installments:
                    installmentOption === "2x"
                      ? 2
                      : installmentOption === "3x"
                        ? 3
                        : 1,
                  statement_descriptor: "VIOS LABS",
                },
              },
            ];

      const orderCode = `vios_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const orderPayload = {
        items: pagarmeItems,
        customer,
        payments,
        code: orderCode,
        currency: "BRL",
        metadata: {
          user_id: userId || "guest",
          customer_email: email,
          free_shipping: String(isFreeShipping),
          items_count: String(items.length),
        },
      };

      const pagarmeOrder = await createOrder(orderPayload);

      for (const resId of reservationIds) {
        await supabase
          .from("inventory_reservations")
          .update({ stripe_session_id: pagarmeOrder.id })
          .eq("stripe_session_id", resId)
          .eq("status", "active");
      }

      const firstCharge = pagarmeOrder.charges?.[0];
      let pixData = firstCharge
        ? extractPixFromTransaction(firstCharge.last_transaction)
        : {
            qr_code: null as string | null,
            qr_code_url: null as string | null,
          };

      if (paymentMethod === "pix") {
        if (!pixData.qr_code && !pixData.qr_code_url && firstCharge?.id) {
          try {
            const charge = await getCharge(firstCharge.id);
            pixData = extractPixFromTransaction(charge.last_transaction);
          } catch (e) {
            console.error("[PAGARME CHECKOUT] getCharge error:", e);
          }
        }
        if (
          process.env.NODE_ENV === "development" &&
          !pixData.qr_code &&
          !pixData.qr_code_url
        ) {
          console.error(
            "[PAGARME CHECKOUT] PIX sem QR: resposta do pedido (charges[0])",
            JSON.stringify(
              {
                orderId: pagarmeOrder.id,
                charges: pagarmeOrder.charges,
                firstCharge: firstCharge
                  ? {
                      id: firstCharge.id,
                      last_transaction: firstCharge.last_transaction,
                    }
                  : null,
              },
              null,
              2,
            ),
          );
        }
        return NextResponse.json({
          orderId: pagarmeOrder.id,
          paymentMethod: "pix",
          pix: {
            qr_code: pixData.qr_code,
            qr_code_url: pixData.qr_code_url,
          },
        });
      }

      return NextResponse.json({
        orderId: pagarmeOrder.id,
        paymentMethod: "card",
        status: pagarmeOrder.status,
      });
    } catch (orderError: unknown) {
      for (const id of reservationIds) await releaseReservations(supabase, id);
      const msg =
        orderError instanceof Error
          ? orderError.message
          : "Erro ao criar pedido no Pagar.me.";
      console.error("[PAGARME CHECKOUT] createOrder error:", orderError);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno.";
    console.error("[PAGARME CHECKOUT] Error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
