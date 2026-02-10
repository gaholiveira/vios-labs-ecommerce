"use server";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sendOrderConfirmationEmail } from "@/lib/email";
import {
  pagarme,
  type PagarmeOrderItem,
  type PagarmePayment,
} from "@/lib/payments";
import type { ReserveInventoryResponse } from "@/types/database";
import {
  FREE_SHIPPING_THRESHOLD,
  PIX_DISCOUNT_PERCENT,
  PIX_EXPIRATION_SECONDS,
} from "@/lib/checkout-config";

// ============================================================================
// CONSTANTES
// ============================================================================

const MIN_SUBTOTAL = 10;
const MAX_SUBTOTAL = 100000;
const MIN_QUANTITY = 1;
const MAX_QUANTITY_PER_ITEM = 10;
const MAX_ITEMS_PER_CART = 20;
const MAX_TOTAL_QUANTITY = 50;

// ============================================================================
// VALIDAÇÃO ZOD — CPF, E-mail, CEP
// ============================================================================

const onlyDigits = (s: string) => s.replace(/\D/g, "");

/** CPF: 11 dígitos (apenas números) */
const cpfSchema = z
  .string()
  .min(1, "CPF é obrigatório")
  .transform(onlyDigits)
  .refine((v) => v.length === 11, "CPF deve ter 11 dígitos");

/** E-mail válido */
const emailSchema = z
  .string()
  .min(1, "E-mail é obrigatório")
  .email("E-mail inválido")
  .transform((v) => v.trim().toLowerCase());

/** CEP: 8 dígitos (apenas números) */
const cepSchema = z
  .string()
  .min(1, "CEP é obrigatório")
  .transform(onlyDigits)
  .refine((v) => v.length === 8, "CEP deve ter 8 dígitos");

const addressSchema = z.object({
  cep: cepSchema,
  street: z.string().min(1, "Logradouro é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório").max(2),
});

const cartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive().finite(),
  quantity: z.number().int().min(MIN_QUANTITY).max(MAX_QUANTITY_PER_ITEM),
  image: z.string().optional(),
  kitProducts: z.array(z.string()).optional(),
  isKit: z.boolean().optional(),
});

const checkoutFormSchema = z.object({
  email: emailSchema,
  cpf: cpfSchema,
  phone: z.string().min(1, "Telefone é obrigatório"),
  fullName: z.string().min(3, "Nome completo é obrigatório"),
  name: z.string().optional(),
  address: addressSchema,
});

const checkoutInputSchema = z.object({
  form: checkoutFormSchema,
  items: z
    .array(cartItemSchema)
    .min(1, "Sacola vazia")
    .max(MAX_ITEMS_PER_CART),
  paymentMethod: z.enum(["pix", "card"]),
  cardToken: z.string().optional(),
  userId: z.string().nullable().optional(),
  /** Valor do frete em reais (Melhor Envio). Obrigatório quando subtotal < FREE_SHIPPING_THRESHOLD. */
  shippingReais: z.number().min(0).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export type CheckoutResult =
  | { success: true; data: CheckoutSuccessData }
  | { success: false; error: string };

export type CheckoutSuccessData =
  | {
      orderId: string;
      paymentMethod: "pix";
      pix: {
        qr_code: string | null;
        qr_code_url: string | null;
        pix_copy_paste: string | null;
      };
    }
  | { orderId: string; paymentMethod: "card"; status: string };

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

async function releaseReservations(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  sessionId: string,
) {
  try {
    await supabase.rpc("release_reservation", {
      p_stripe_session_id: sessionId,
      p_reason: "Checkout failed - releasing reservation",
    });
  } catch (e) {
    console.error("[CHECKOUT ACTION] releaseReservations error:", e);
  }
}

// ============================================================================
// SERVER ACTION
// ============================================================================

/**
 * Server Action de checkout.
 * - PIX: cria pedido no Pagar.me e retorna QR Code + Código Copia e Cola.
 * - Cartão: cria pedido no Pagar.me com token (credit_card.card.token) e parcelamento fixo 3x sem juros.
 * Valida CPF, e-mail e CEP com Zod.
 */
export async function checkoutAction(input: unknown): Promise<CheckoutResult> {
  if (!pagarme.isConfigured()) {
    return {
      success: false,
      error: "Pagar.me não está configurado. Configure PAGARME_SECRET_KEY.",
    };
  }

  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      Object.values(first).flat().find(Boolean) || parsed.error.message;
    return { success: false, error: msg ?? "Dados inválidos." };
  }

  const { form, items, paymentMethod, cardToken, userId, shippingReais: inputShippingReais } = parsed.data;

  if (paymentMethod === "card" && (!cardToken || !cardToken.trim())) {
    return {
      success: false,
      error: "Token do cartão é obrigatório para pagamento com cartão.",
    };
  }

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);
  if (subtotal < MIN_SUBTOTAL)
    return {
      success: false,
      error: `Subtotal mínimo R$ ${MIN_SUBTOTAL} não atingido.`,
    };
  if (subtotal > MAX_SUBTOTAL)
    return {
      success: false,
      error: "Subtotal excede o valor máximo permitido.",
    };
  if (totalQty > MAX_TOTAL_QUANTITY)
    return {
      success: false,
      error: `Quantidade total máxima excedida (${MAX_TOTAL_QUANTITY}).`,
    };

  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingReais = isFreeShipping
    ? 0
    : typeof inputShippingReais === "number" && inputShippingReais >= 0
      ? inputShippingReais
      : 0;
  if (!isFreeShipping && shippingReais <= 0) {
    return {
      success: false,
      error: "Informe o CEP e selecione uma opção de frete para continuar.",
    };
  }
  const pixDiscount =
    paymentMethod === "pix" ? subtotal * PIX_DISCOUNT_PERCENT : 0;
  const email = form.email;
  const supabase = getSupabaseAdmin();
  const tempSessionId = `temp_pagarme_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const reservationIds: string[] = [];

  try {
    for (const item of items) {
      if (item.isKit && item.kitProducts?.length) {
        for (const productId of item.kitProducts) {
          const uniqueId = `${tempSessionId}_${productId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          reservationIds.push(uniqueId);
          const { data, error } = await supabase.rpc("reserve_inventory", {
            p_product_id: productId,
            p_quantity: item.quantity,
            p_stripe_session_id: uniqueId,
            p_customer_email: email,
            p_user_id: userId ?? null,
          });
          if (error) {
            for (const id of reservationIds)
              await releaseReservations(supabase, id);
            return {
              success: false,
              error: `Erro ao reservar estoque para ${item.name}.`,
            };
          }
          const result = data as ReserveInventoryResponse;
          if (!result?.success) {
            for (const id of reservationIds)
              await releaseReservations(supabase, id);
            return {
              success: false,
              error:
                result?.error === "Product not found in inventory"
                  ? "Produto do kit não encontrado no estoque."
                  : `Estoque insuficiente para ${item.name}.`,
            };
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
          p_user_id: userId ?? null,
        });
        if (error) {
          for (const id of reservationIds)
            await releaseReservations(supabase, id);
          return {
            success: false,
            error: `Erro ao reservar estoque para ${item.name}.`,
          };
        }
        const result = data as ReserveInventoryResponse;
        if (!result?.success) {
          for (const id of reservationIds)
            await releaseReservations(supabase, id);
          return {
            success: false,
            error: `Estoque insuficiente para ${item.name}.`,
          };
        }
      }
    }

    // Todos os preços em centavos (inteiros): Math.round(price * 100) para evitar dízimas.
    const pixDiscountCents = Math.round(pixDiscount * 100);
    const pagarmeItems: PagarmeOrderItem[] = items.map((item, index) => {
      let amountCents = Math.round(Number(item.price) * 100);
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

    const address = pagarme.buildPagarmeAddress(form.address);
    // customer: document apenas números; phones V5: country_code, area_code, number (buildPagarmeCustomer já formata)
    const customerInput = {
      ...form,
      cpf: onlyDigits(form.cpf),
    };
    const customer = pagarme.buildPagarmeCustomer(customerInput, address);

    const payments: PagarmePayment[] =
      paymentMethod === "pix"
        ? [{ payment_method: "pix", pix: { expires_in: PIX_EXPIRATION_SECONDS } }]
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

    const orderCode = `vios_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const orderPayload = {
      items: pagarmeItems,
      customer,
      payments,
      code: orderCode,
      currency: "BRL",
      metadata: {
        user_id: userId ?? "guest",
        customer_email: email,
        free_shipping: String(isFreeShipping),
        items_count: String(items.length),
      },
    };

    const pagarmeOrder = await pagarme.createOrder(orderPayload);

    for (const resId of reservationIds) {
      await supabase
        .from("inventory_reservations")
        .update({ stripe_session_id: pagarmeOrder.id })
        .eq("stripe_session_id", resId)
        .eq("status", "active");
    }

    const totalReais = subtotal + shippingReais - pixDiscount;
    const customerName = (form.fullName ?? form.name)?.trim() || null;
    const emailItems = items.map((i) => ({
      product_name: i.name,
      quantity: i.quantity,
      price: i.price,
      product_image: i.image ?? null,
    }));

    if (paymentMethod === "pix") {
      const firstCharge = pagarmeOrder.charges?.[0];
      let pixData = firstCharge
        ? pagarme.extractPixFromCharge(firstCharge)
        : {
            qr_code: null as string | null,
            qr_code_url: null as string | null,
            pix_copy_paste: null as string | null,
          };
      if (
        !pixData.qr_code &&
        !pixData.qr_code_url &&
        !pixData.pix_copy_paste &&
        firstCharge?.id
      ) {
        try {
          const charge = await pagarme.getCharge(firstCharge.id);
          pixData = pagarme.extractPixFromCharge(charge);
        } catch (e) {
          console.error("[CHECKOUT ACTION] getCharge error:", e);
        }
      }
      try {
        await sendOrderConfirmationEmail({
          customerEmail: email,
          customerName,
          orderId: pagarmeOrder.id,
          orderDate: new Date().toISOString(),
          totalAmount: totalReais,
          status: "Processando",
          items: emailItems,
          pixCopyPaste: pixData.pix_copy_paste,
          pixInstructions:
            "Escaneie o QR Code no app do seu banco ou copie o código abaixo para pagar via PIX.",
        });
      } catch (emailErr) {
        console.error("[CHECKOUT ACTION] sendOrderConfirmation (PIX) error:", emailErr);
      }
      return {
        success: true,
        data: {
          orderId: pagarmeOrder.id,
          paymentMethod: "pix",
          pix: {
            qr_code: pixData.qr_code,
            qr_code_url: pixData.qr_code_url,
            pix_copy_paste: pixData.pix_copy_paste,
          },
        },
      };
    }

    try {
      await sendOrderConfirmationEmail({
        customerEmail: email,
        customerName,
        orderId: pagarmeOrder.id,
        orderDate: new Date().toISOString(),
        totalAmount: totalReais,
        status: "Pago",
        items: emailItems,
      });
    } catch (emailErr) {
      console.error("[CHECKOUT ACTION] sendOrderConfirmation (cartão) error:", emailErr);
    }

    return {
      success: true,
      data: {
        orderId: pagarmeOrder.id,
        paymentMethod: "card",
        status: pagarmeOrder.status,
      },
    };
  } catch (orderError: unknown) {
    for (const id of reservationIds) await releaseReservations(supabase, id);
    const err = orderError as Error & { responseBody?: unknown; response?: { body?: unknown } };
    console.error(
      "PAGARME_ERROR_DETAIL:",
      err.responseBody ?? err.response?.body ?? err.message,
    );
    console.error("[CHECKOUT ACTION] createOrder error:", orderError);
    const msg =
      orderError instanceof Error
        ? orderError.message
        : "Erro ao criar pedido no Pagar.me.";
    return { success: false, error: msg };
  }
}
