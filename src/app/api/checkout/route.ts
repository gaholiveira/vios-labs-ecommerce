import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { ReserveInventoryResponse } from "@/types/database";

// ============================================================================
// CONSTANTES DE NEGÓCIO
// ============================================================================
const FREE_SHIPPING_THRESHOLD = 289.9;
const FIXED_SHIPPING_PRICE = 2500; // R$ 25,00 em centavos
const IS_PRESALE = true; // Mudar para false após 16/02
const DEFAULT_ORIGIN_PROD = "https://vioslabs.com.br";
const DEFAULT_ORIGIN_DEV = "http://localhost:3000";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CheckoutRequestBody {
  items: CartItem[];
  userId?: string;
  customerEmail?: string;
}

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

function getStripeClient(): Stripe {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
    maxNetworkRetries: 2,
    timeout: 30000,
  });
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function normalizeImageUrl(
  imageUrl: string | undefined,
  origin: string,
): string | undefined {
  if (!imageUrl) return undefined;

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return imageUrl.startsWith("/")
    ? `${origin}${imageUrl}`
    : `${origin}/${imageUrl}`;
}

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

function qualifiesForFreeShipping(subtotal: number): boolean {
  return subtotal >= FREE_SHIPPING_THRESHOLD;
}

function createShippingOptions(
  isFreeShipping: boolean,
): Stripe.Checkout.SessionCreateParams.ShippingOption[] {
  const displayName = IS_PRESALE
    ? "Reserva Lote 0 (Envio 16/02)"
    : "Entrega Standard (Brasil)";

  const shippingRateData: Stripe.Checkout.SessionCreateParams.ShippingOption["shipping_rate_data"] =
    {
      type: "fixed_amount" as const,
      fixed_amount: {
        amount: isFreeShipping ? 0 : FIXED_SHIPPING_PRICE,
        currency: "brl",
      },
      display_name: displayName,
    };

  // Adicionar delivery_estimate apenas se não for pré-venda
  if (!IS_PRESALE) {
    shippingRateData.delivery_estimate = {
      minimum: { unit: "business_day" as const, value: 3 },
      maximum: { unit: "business_day" as const, value: 14 },
    };
  }

  return [{ shipping_rate_data: shippingRateData }];
}

// ============================================================================
// ROTA PRINCIPAL - POST /api/checkout
// ============================================================================

function getOrigin(req: Request): string {
  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.NODE_ENV === "production"
      ? DEFAULT_ORIGIN_PROD
      : DEFAULT_ORIGIN_DEV);

  if (
    !origin ||
    (!origin.startsWith("http://") && !origin.startsWith("https://"))
  ) {
    throw new Error("Invalid origin URL");
  }

  return origin;
}

export async function POST(req: Request) {
  try {
    const stripe = getStripeClient();
    const body: CheckoutRequestBody = await req.json();
    const { items, userId, customerEmail } = body;

    if (!items?.length || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Carrinho vazio ou inválido" },
        { status: 400 },
      );
    }

    const origin = getOrigin(req);

    const subtotal = calculateSubtotal(items);
    const isFreeShipping = qualifiesForFreeShipping(subtotal);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item) => {
        const imageUrl = normalizeImageUrl(item.image, origin);

        return {
          price_data: {
            currency: "brl",
            product_data: {
              name: item.name,
              images: imageUrl ? [imageUrl] : [],
              metadata: { product_id: item.id },
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        };
      },
    );

    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      payment_method_types: ["card", "boleto"],
      allow_promotion_codes: true,
      customer_email: customerEmail || undefined,
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["BR"] },
      phone_number_collection: { enabled: true },
      tax_id_collection: { enabled: true },
      payment_method_options: {
        boleto: { expires_after_days: 3 },
      },
      shipping_options: createShippingOptions(isFreeShipping),
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId || "null",
        customerEmail: customerEmail || "null",
        isGuest: (!userId).toString(),
        subtotal: subtotal.toFixed(2),
        freeShipping: isFreeShipping.toString(),
      },
    });

    const supabaseAdmin = getSupabaseAdmin();

    try {
      for (const item of items) {
        const { data, error } = await supabaseAdmin.rpc("reserve_inventory", {
          p_product_id: item.id,
          p_quantity: item.quantity,
          p_stripe_session_id: session.id,
          p_customer_email: customerEmail || null,
          p_user_id: userId || null,
        });

        if (error) {
          console.error("[CHECKOUT ERROR] Erro ao reservar estoque:", error);
          continue;
        }

        const reserveResult = data as ReserveInventoryResponse;

        if (!reserveResult.success) {
          console.error("[CHECKOUT ERROR] Estoque insuficiente:", {
            product_id: item.id,
            requested: item.quantity,
            available: reserveResult.available,
          });

          try {
            await stripe.checkout.sessions.expire(session.id);
          } catch (expireError) {
            console.error(
              "[CHECKOUT ERROR] Erro ao expirar sessão:",
              expireError,
            );
          }

          return NextResponse.json(
            {
              error: `Estoque insuficiente para ${item.name}`,
              product: item.name,
              requested: item.quantity,
              available: reserveResult.available || 0,
            },
            { status: 409 },
          );
        }
      }
    } catch (inventoryError: any) {
      console.error(
        "[CHECKOUT ERROR] Erro no sistema de inventário:",
        inventoryError,
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[CHECKOUT ERROR] Erro no Checkout:", err);

    let errorMessage = "Erro interno no servidor. Tente novamente.";

    if (
      err.message?.includes("Not a valid URL") ||
      err.message?.includes("Invalid origin")
    ) {
      errorMessage =
        "Erro na configuração de URLs. Verifique as variáveis de ambiente.";
    } else if (err.message?.includes("Invalid")) {
      errorMessage =
        "Dados inválidos fornecidos. Verifique os itens do carrinho.";
    } else if (err.message) {
      errorMessage = err.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
