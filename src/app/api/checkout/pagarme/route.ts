import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createOrder,
  getCharge,
  extractPixFromCharge,
  isPagarmeConfigured,
  buildPagarmeCustomer,
  buildPagarmeAddress,
  type PagarmeOrderItem,
  type PagarmePayment,
} from "@/lib/pagarme";
import {
  PIX_EXPIRATION_SECONDS,
  COUPON_CODE_TESTE90,
  COUPON_TESTE90_DISCOUNT_PERCENT,
} from "@/lib/checkout-config";
import type { ReserveInventoryResponse } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ============================================================================
// CONSTANTES DE NEGÓCIO
// ============================================================================
const FREE_SHIPPING_THRESHOLD = 289.9;
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
  fullName: string;
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
  /** Token do cartão; aceita camelCase ou snake_case */
  cardToken?: string | null;
  card_token?: string | null;
  checkoutData: CheckoutFormData;
  /** Cupom de teste: TESTE90 = 90% de desconto no subtotal */
  couponCode?: string | null;
  /** Valor do frete em reais (Melhor Envio). Se omitido e subtotal < threshold, erro. */
  shippingReais?: number | null;
  /** Opção de frete selecionada (metadata do pedido) */
  selectedShippingOption?: { id: string; name: string; type: string } | null;
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
    return { valid: false, error: "Sacola vazia" };
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
  sessionId: string
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

async function releaseAllReservations(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  sessionIds: string[]
) {
  await Promise.all(
    sessionIds.map((id) => releaseReservations(supabase, id))
  );
}

// ============================================================================
// POST /api/checkout/pagarme
// ============================================================================
export async function POST(req: Request) {
  if (!isPagarmeConfigured()) {
    return NextResponse.json(
      { error: "Pagar.me não está configurado. Configure PAGARME_SECRET_KEY." },
      { status: 503 }
    );
  }

  let body: PagarmeCheckoutRequestBody;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json(
        { error: "Corpo da requisição inválido (JSON esperado)." },
        { status: 400 }
      );
    }
    body = parsed as PagarmeCheckoutRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido ou não é JSON." },
      { status: 400 }
    );
  }

  try {
    /** Token: aceita cardToken (camelCase) ou card_token (snake_case) do front/tokenizer */
    const cardToken = body.cardToken ?? body.card_token ?? null;
    const {
      items,
      userId,
      customerEmail: bodyEmail,
      paymentMethod,
      installmentOption,
      checkoutData,
      shippingReais: bodyShippingReais,
      selectedShippingOption,
    } = body;

    const cartValidation = validateCartItems(items);
    if (!cartValidation.valid) {
      return NextResponse.json(
        { error: cartValidation.error || "Sacola inválida" },
        { status: 400 }
      );
    }

    if (!checkoutData || typeof checkoutData !== "object") {
      return NextResponse.json(
        { error: "Dados do checkout são obrigatórios (checkoutData)." },
        { status: 400 }
      );
    }

    const email =
      checkoutData.email?.trim()?.toLowerCase() ||
      bodyEmail?.trim()?.toLowerCase() ||
      "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "E-mail válido é obrigatório para o checkout." },
        { status: 400 }
      );
    }

    const addr = checkoutData.address;
    if (!addr || typeof addr !== "object") {
      return NextResponse.json(
        { error: "Endereço é obrigatório (checkoutData.address)." },
        { status: 400 }
      );
    }
    const requiredAddressFields = [
      "cep",
      "street",
      "number",
      "neighborhood",
      "city",
      "state",
    ] as const;
    const missingAddress = requiredAddressFields.filter(
      (f) => !addr[f] || String(addr[f]).trim() === ""
    );
    if (missingAddress.length > 0) {
      return NextResponse.json(
        {
          error: `Endereço incompleto. Preencha: ${missingAddress.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    if (!checkoutData?.cpf || onlyDigits(checkoutData.cpf).length !== 11) {
      return NextResponse.json(
        { error: "CPF válido (11 dígitos) é obrigatório." },
        { status: 400 }
      );
    }

    if (paymentMethod === "card") {
      if (!cardToken) {
        return NextResponse.json(
          { error: "Token do cartão é obrigatório para pagamento com cartão." },
          { status: 400 }
        );
      }
    }

    const subtotal = calculateSubtotal(items);
    const subtotalValidation = validateSubtotal(subtotal);
    if (!subtotalValidation.valid) {
      return NextResponse.json(
        { error: subtotalValidation.error || "Subtotal inválido" },
        { status: 400 }
      );
    }

    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingReais = isFreeShipping
      ? 0
      : typeof bodyShippingReais === "number" &&
        Number.isFinite(bodyShippingReais) &&
        bodyShippingReais >= 0
      ? bodyShippingReais
      : 0;
    const isLocalFreeDelivery =
      selectedShippingOption?.type === "local" && shippingReais === 0;
    if (
      !isFreeShipping &&
      shippingReais <= 0 &&
      !isLocalFreeDelivery
    ) {
      return NextResponse.json(
        {
          error: "Informe o CEP e selecione uma opção de frete para continuar.",
        },
        { status: 400 }
      );
    }
    const pixDiscount =
      paymentMethod === "pix" ? subtotal * PIX_DISCOUNT_PERCENT : 0;
    const couponDiscount =
      body.couponCode?.trim() === COUPON_CODE_TESTE90
        ? subtotal * COUPON_TESTE90_DISCOUNT_PERCENT
        : 0;
    const totalReais = subtotal + shippingReais - pixDiscount - couponDiscount;
    const totalCents = Math.round(totalReais * 100);

    const supabase = getSupabaseAdmin();
    const tempSessionId = `temp_pagarme_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    type ReserveTask = {
      uniqueId: string;
      itemName: string;
      promise: ReturnType<typeof supabase.rpc>;
    };
    const reserveTasks: ReserveTask[] = [];

    for (const item of items) {
      if (item.isKit && item.kitProducts && item.kitProducts.length > 0) {
        for (const productId of item.kitProducts) {
          const uniqueId = `${tempSessionId}_${productId}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;
          reserveTasks.push({
            uniqueId,
            itemName: item.name,
            promise: supabase.rpc("reserve_inventory", {
              p_product_id: productId,
              p_quantity: item.quantity,
              p_stripe_session_id: uniqueId,
              p_customer_email: email,
              p_user_id: userId || null,
            }),
          });
        }
      } else {
        const uniqueId = `${tempSessionId}_${
          item.id
        }_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        reserveTasks.push({
          uniqueId,
          itemName: item.name,
          promise: supabase.rpc("reserve_inventory", {
            p_product_id: item.id,
            p_quantity: item.quantity,
            p_stripe_session_id: uniqueId,
            p_customer_email: email,
            p_user_id: userId || null,
          }),
        });
      }
    }

    const reservationIds = reserveTasks.map((t) => t.uniqueId);

    try {
      const results = await Promise.all(
        reserveTasks.map(async (t) => {
          const { data, error } = await t.promise;
          return { ...t, data: data as ReserveInventoryResponse | null, error };
        })
      );

      const firstError = results.find((r) => r.error);
      if (firstError) {
        await releaseAllReservations(supabase, reservationIds);
        return NextResponse.json(
          {
            error: `Erro ao reservar estoque para ${firstError.itemName}. Tente novamente.`,
          },
          { status: 500 }
        );
      }

      const firstFailed = results.find((r) => !r.data?.success);
      if (firstFailed) {
        await releaseAllReservations(supabase, reservationIds);
        const msg =
          firstFailed.data?.error === "Product not found in inventory"
            ? "Produto do kit não encontrado no estoque."
            : `Estoque insuficiente para ${firstFailed.itemName}.`;
        return NextResponse.json({ error: msg }, { status: 409 });
      }

      // Todos os preços em centavos (inteiros). Desconto PIX + cupom distribuído nos itens (mín. 1 cent/un).
      const pixDiscountCents = Math.round(pixDiscount * 100);
      const couponDiscountCents = Math.round(couponDiscount * 100);
      let remainingDiscountCents = pixDiscountCents + couponDiscountCents;
      const pagarmeItems: PagarmeOrderItem[] = items.map((item) => {
        let amountCents = Math.round(Number(item.price) * 100);
        if (remainingDiscountCents > 0 && item.quantity > 0) {
          const itemTotalCents = amountCents * item.quantity;
          const discountApplied = Math.min(
            remainingDiscountCents,
            itemTotalCents - item.quantity
          );
          remainingDiscountCents -= discountApplied;
          amountCents = Math.max(
            1,
            Math.round((itemTotalCents - discountApplied) / item.quantity)
          );
        }
        return {
          amount: Math.round(amountCents),
          description: item.name,
          quantity: item.quantity,
          code: item.id,
        };
      });

      if (shippingReais > 0) {
        const shippingCents = Math.round(Number(shippingReais) * 100);
        pagarmeItems.push({
          amount: Math.round(shippingCents),
          description: "Frete",
          quantity: 1,
          code: "shipping",
        });
      }

      const address = buildPagarmeAddress(checkoutData.address);
      // customer: document apenas números (buildPagarmeCustomer usa .replace(/\D/g,'')); phones V5: country_code, area_code, number
      const customerInput = {
        ...checkoutData,
        email,
        cpf: onlyDigits(checkoutData.cpf),
      };
      const customer = buildPagarmeCustomer(customerInput, address);

      const payments: PagarmePayment[] =
        paymentMethod === "pix"
          ? [
              {
                payment_method: "pix",
                pix: { expires_in: PIX_EXPIRATION_SECONDS },
              },
            ]
          : [
              {
                payment_method: "credit_card",
                credit_card: {
                  card: {
                    token: cardToken!,
                    billing_address: address,
                  },
                  installments: 3,
                  statement_descriptor: "VIOS LABS",
                },
              },
            ];

      const orderCode = `vios_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const orderPayload = {
        items: pagarmeItems,
        customer,
        payments,
        shipping: {
          amount: Math.round(shippingReais * 100),
          description: isFreeShipping
            ? "Frete Grátis"
            : selectedShippingOption?.name ?? "Frete",
          address,
        },
        code: orderCode,
        currency: "BRL",
        metadata: {
          user_id: userId || "guest",
          customer_email: email,
          customer_name: checkoutData.fullName?.trim() || "",
          customer_phone: checkoutData.phone?.replace(/\D/g, "").slice(0, 11) || "",
          free_shipping: String(isFreeShipping),
          items_count: String(items.length),
          shipping_neighborhood: addr.neighborhood?.trim() || "",
          ...(selectedShippingOption && {
            shipping_option_id: selectedShippingOption.id,
            shipping_option_name: selectedShippingOption.name,
            shipping_option_type: selectedShippingOption.type,
          }),
        },
      };

      const pagarmeOrder = await createOrder(orderPayload);

      if (reservationIds.length > 0) {
        const { error: updateErr } = await supabase
          .from("inventory_reservations")
          .update({ stripe_session_id: pagarmeOrder.id })
          .in("stripe_session_id", reservationIds)
          .eq("status", "active");
        if (updateErr) {
          console.error("[PAGARME CHECKOUT] update reservations error:", updateErr);
          await releaseAllReservations(supabase, reservationIds);
          return NextResponse.json(
            { error: "Erro ao associar reserva ao pedido. Tente novamente." },
            { status: 500 }
          );
        }
      }

      const firstCharge = pagarmeOrder.charges?.[0];
      let pixData = firstCharge
        ? extractPixFromCharge(firstCharge)
        : {
            qr_code: null as string | null,
            qr_code_url: null as string | null,
            pix_copy_paste: null as string | null,
          };

      if (paymentMethod === "pix") {
        if (
          !pixData.qr_code &&
          !pixData.qr_code_url &&
          !pixData.pix_copy_paste &&
          firstCharge?.id
        ) {
          try {
            const charge = await getCharge(firstCharge.id);
            pixData = extractPixFromCharge(charge);
          } catch (e) {
            console.error("[PAGARME CHECKOUT] getCharge error:", e);
          }
        }
        if (
          process.env.NODE_ENV === "development" &&
          !pixData.qr_code &&
          !pixData.qr_code_url &&
          !pixData.pix_copy_paste
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
              2
            )
          );
        }
        return NextResponse.json({
          orderId: pagarmeOrder.id,
          paymentMethod: "pix",
          pix: {
            qr_code: pixData.qr_code,
            qr_code_url: pixData.qr_code_url,
            pix_copy_paste: pixData.pix_copy_paste,
          },
        });
      }

      return NextResponse.json({
        orderId: pagarmeOrder.id,
        paymentMethod: "card",
        status: pagarmeOrder.status,
      });
    } catch (orderError: unknown) {
      await releaseAllReservations(supabase, reservationIds);
      const err = orderError as Error & {
        responseBody?: unknown;
        response?: { body?: unknown };
      };
      const detail = err.responseBody ?? err.response?.body ?? err.message;
      console.error("PAGARME_ERROR_DETAIL:", detail);
      console.error("[PAGARME CHECKOUT] createOrder error:", orderError);
      const msg =
        orderError instanceof Error
          ? orderError.message
          : "Erro ao criar pedido no Pagar.me.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  } catch (err: unknown) {
    const e = err as Error & {
      responseBody?: unknown;
      response?: { body?: unknown };
    };
    const detail = e.responseBody ?? e.response?.body ?? e.message;
    console.error("PAGARME_ERROR_DETAIL:", detail);
    console.error("[PAGARME CHECKOUT] Error:", err);
    const msg = err instanceof Error ? err.message : "Erro interno.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
