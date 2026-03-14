import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS } from "@/constants/products";
import { getSupabaseAdmin } from "@/utils/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { isPagarmeConfigured } from "@/lib/pagarme";
import {
  createSaleInBling,
  isBlingConfigured,
} from "@/lib/bling";

const productImageById = new Map(PRODUCTS.map((p) => [p.id, p.image]));

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Payload do webhook Pagar.me (order.paid) */
interface PagarmeWebhookPayload {
  id?: string;
  type?: string;
  data?: {
    id: string;
    code?: string;
    amount: number;
    currency?: string;
    status?: string;
    items?: Array<{
      id: string;
      description?: string;
      amount: number;
      quantity: number;
      code?: string;
    }>;
    customer?: {
      id?: string;
      name?: string;
      email?: string;
      document?: string;
      phones?: Record<string, unknown>;
      address?: {
        zip_code?: string;
        line_1?: string;
        line_2?: string;
        city?: string;
        state?: string;
        country?: string;
      };
    };
    shipping?: {
      address?: {
        zip_code?: string;
        line_1?: string;
        line_2?: string;
        city?: string;
        state?: string;
        country?: string;
      };
    };
    metadata?: Record<string, string>;
  };
}

async function dispatchOrderConfirmationEmail({
  order,
  orderItems,
  customerEmail,
  customerName,
}: {
  order: { id: string; created_at: string; total_amount: number };
  orderItems: Array<{
    product_name: string;
    quantity: number;
    price: number;
    product_image: string | null;
  }>;
  customerEmail: string;
  customerName: string | null;
}) {
  const result = await sendOrderConfirmationEmail({
    customerEmail,
    customerName,
    orderId: order.id,
    orderDate: order.created_at,
    totalAmount: order.total_amount,
    status: "Pago",
    items: orderItems.map((i) => ({
      product_name: i.product_name,
      quantity: i.quantity,
      price: i.price,
      product_image: i.product_image,
    })),
  });
  if (!result.success) {
    throw new Error(result.error ?? "Failed to send email");
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Webhooks Pagar.me aceitam apenas POST." },
    { status: 405 },
  );
}

/**
 * Verifica a assinatura HMAC-SHA256 do webhook Pagar.me.
 * O Pagar.me envia o header x-pagarme-signature com HMAC(secret, body).
 * Retorna true se a assinatura for válida ou se PAGARME_WEBHOOK_SECRET não estiver configurado (dev).
 */
async function verifyPagarmeSignature(
  req: NextRequest,
  rawBody: string,
): Promise<boolean> {
  const secret = process.env.PAGARME_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "[PAGARME WEBHOOK] PAGARME_WEBHOOK_SECRET não configurado — validação HMAC ignorada",
    );
    return true;
  }

  const signature = req.headers.get("x-pagarme-signature");
  if (!signature) {
    console.warn("[PAGARME WEBHOOK] Header x-pagarme-signature ausente");
    return false;
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(rawBody);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Comparação segura usando timingSafeEqual via crypto
  const sigBuffer = encoder.encode(signature);
  const expBuffer = encoder.encode(expectedSignature);
  if (sigBuffer.length !== expBuffer.length) return false;

  let mismatch = 0;
  for (let i = 0; i < sigBuffer.length; i++) {
    mismatch |= sigBuffer[i] ^ expBuffer[i];
  }
  return mismatch === 0;
}

export async function POST(req: NextRequest) {
  if (!isPagarmeConfigured()) {
    return NextResponse.json(
      { error: "Pagar.me not configured" },
      { status: 503 },
    );
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const isValid = await verifyPagarmeSignature(req, rawBody);
  if (!isValid) {
    console.warn("[PAGARME WEBHOOK] Assinatura HMAC inválida — requisição rejeitada");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as PagarmeWebhookPayload;

    console.warn("[PAGARME WEBHOOK] Recebido:", {
      type: payload.type,
      dataId: payload.data?.id,
      hasData: Boolean(payload.data),
    });

    if (payload.type !== "order.paid" || !payload.data?.id) {
      return NextResponse.json({ received: true });
    }

    const orderId = payload.data.id;
    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("payment_order_id", orderId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true });
    }

    const customerEmail =
      payload.data.customer?.email ||
      payload.data.metadata?.customer_email ||
      "";
    if (!customerEmail) {
      console.error(
        "[PAGARME WEBHOOK] order.paid sem customer email:",
        orderId,
      );
      return NextResponse.json({ received: true });
    }

    const totalAmount = (payload.data.amount ?? 0) / 100;
    const userId =
      payload.data.metadata?.user_id &&
      payload.data.metadata.user_id !== "guest"
        ? payload.data.metadata.user_id
        : null;

    const customerName =
      payload.data.customer?.name ||
      payload.data.metadata?.customer_name ||
      null;
    const customerCpf = payload.data.customer?.document
      ? payload.data.customer.document.replace(/\D/g, "")
      : null;
    const customerPhones = payload.data.customer?.phones as
      | {
          mobile_phone?: { country_code?: string; area_code?: string; number?: string };
          home_phone?: { country_code?: string; area_code?: string; number?: string };
        }
      | undefined;
    const customerPhone =
      customerPhones?.mobile_phone ?? customerPhones?.home_phone;
    const customerPhoneStr =
      customerPhone?.number != null
        ? [
            customerPhone.country_code?.replace(/\D/g, "") || "55",
            customerPhone.area_code?.replace(/\D/g, "") || "",
            customerPhone.number?.replace(/\D/g, "") || "",
          ]
            .filter(Boolean)
            .join("")
            .replace(/^55/, "") || null
        : payload.data.metadata?.customer_phone?.trim() || null;
    const addr =
      payload.data.shipping?.address ?? payload.data.customer?.address;
    const shippingCep = addr?.zip_code ?? null;
    const shippingStreet = addr?.line_1 ?? null;
    const shippingComplement = addr?.line_2 ?? null;
    const shippingCity = addr?.city ?? null;
    const shippingState = addr?.state ?? null;

    const orderInsert: Record<string, unknown> = {
      user_id: userId,
      customer_email: customerEmail,
      status: "paid",
      total_amount: totalAmount,
      payment_order_id: orderId,
      customer_cpf: customerCpf ?? undefined,
      customer_name: customerName ?? undefined,
      customer_phone: customerPhoneStr ?? undefined,
      shipping_cep: shippingCep ?? undefined,
      shipping_street: shippingStreet ?? undefined,
      shipping_complement: shippingComplement ?? undefined,
      shipping_city: shippingCity ?? undefined,
      shipping_state: shippingState ?? undefined,
    };

    const { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert(orderInsert)
      .select()
      .single();

    if (orderError || !createdOrder) {
      // Constraint única violada (23505) = webhook duplicado chegou em paralelo;
      // o primeiro já criou o pedido → retornar 200 para o Pagar.me parar de reenviar.
      if (orderError?.code === "23505") {
        console.warn("[PAGARME WEBHOOK] Pedido duplicado ignorado (idempotência):", orderId);
        return NextResponse.json({ received: true });
      }
      console.error("[PAGARME WEBHOOK] Error creating order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order", details: orderError?.message },
        { status: 500 },
      );
    }

    console.warn("[PAGARME WEBHOOK] Pedido criado no banco:", createdOrder.id);

    const items = payload.data.items ?? [];
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL ||
      "https://www.vioslabs.com.br";
    const orderItems: Array<{
      order_id: string;
      product_id: string;
      product_name: string;
      quantity: number;
      price: number;
      product_image: string | null;
    }> = [];

    for (const item of items) {
      const code = (item as { code?: string }).code;
      if (code === "shipping" || code === "pix_discount") continue;
      const productId = code || item.id;
      const unitPrice =
        item.quantity > 0 ? item.amount / 100 / item.quantity : 0;
      let productImage: string | null = productImageById.get(productId) ?? null;
      if (productImage && productImage.startsWith("/")) {
        productImage = `${baseUrl}${productImage}`;
      }
      orderItems.push({
        order_id: createdOrder.id,
        product_id: productId,
        product_name: item.description ?? "Produto",
        quantity: item.quantity,
        price: unitPrice,
        product_image: productImage,
      });
    }

    if (orderItems.length > 0) {
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itemsError) {
        console.error(
          "[PAGARME WEBHOOK] Error creating order_items:",
          itemsError,
        );
        await supabase.from("orders").delete().eq("id", createdOrder.id);
        return NextResponse.json(
          { error: "Failed to create order items" },
          { status: 500 },
        );
      }
    }

    try {
      await supabase.rpc("confirm_reservation", {
        p_payment_order_id: orderId,
        p_order_id: createdOrder.id,
      });
    } catch (confirmErr) {
      console.error("[PAGARME WEBHOOK] confirm_reservation error:", confirmErr);
    }

    try {
      await dispatchOrderConfirmationEmail({
        order: createdOrder,
        orderItems,
        customerEmail,
        customerName,
      });
      console.warn("[PAGARME WEBHOOK] E-mail enviado para:", customerEmail);
    } catch (emailErr) {
      console.error("[PAGARME WEBHOOK] sendOrderConfirmation error:", emailErr);
    }

    // Agendar sequence pós-compra (D+3 e D+7)
    try {
      const productNames = orderItems.map((i) => i.product_name).filter(Boolean);
      const productIds = orderItems.map((i) => i.product_id).filter(Boolean);
      const now = new Date();
      const d3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const d7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await supabase.from("email_sequences").insert([
        {
          order_id: createdOrder.id,
          customer_email: customerEmail,
          customer_name: customerName ?? null,
          sequence_type: "d3_check_in",
          product_names: productNames,
          product_ids: productIds,
          send_at: d3.toISOString(),
          status: "pending",
        },
        {
          order_id: createdOrder.id,
          customer_email: customerEmail,
          customer_name: customerName ?? null,
          sequence_type: "d7_reorder",
          product_names: productNames,
          product_ids: productIds,
          send_at: d7.toISOString(),
          status: "pending",
        },
      ]);
      console.warn("[PAGARME WEBHOOK] Sequence agendada para:", customerEmail);
    } catch (seqErr) {
      console.error("[PAGARME WEBHOOK] Erro ao agendar sequence:", seqErr);
    }

    // Marcar abandono de checkout como convertido
    try {
      await supabase
        .from("checkout_abandons")
        .update({ status: "converted", converted_at: new Date().toISOString() })
        .eq("email", customerEmail)
        .eq("status", "pending");
    } catch (abandonErr) {
      console.error("[PAGARME WEBHOOK] Erro ao marcar abandono como convertido:", abandonErr);
    }

    // Log estruturado antes de tentar Bling (para diagnóstico)
    const blingReady =
      isBlingConfigured() && addr?.zip_code && addr?.city && addr?.state;
    console.warn("[PAGARME WEBHOOK] Bling:", {
      isConfigured: isBlingConfigured(),
      hasAddr: Boolean(addr),
      zip: addr?.zip_code ?? null,
      city: addr?.city ?? null,
      state: addr?.state ?? null,
      hasCpf: Boolean(customerCpf),
      productIds: orderItems.map((i) => i.product_id),
      willCall: blingReady,
    });

    if (blingReady) {
      try {
        const line1 = addr.line_1 ?? "";
        const [streetPart, numberPart] = line1.includes(",")
          ? [line1.split(",")[0]?.trim() ?? "", line1.split(",").pop()?.trim()]
          : [line1, undefined];
        const cepDigits = (addr?.zip_code ?? "").replace(/\D/g, "").slice(0, 8);
        let shippingNeighborhood =
          payload.data.metadata?.shipping_neighborhood?.trim() || null;
        if (!shippingNeighborhood && cepDigits.length === 8) {
          try {
            const viaCepRes = await fetch(
              `https://viacep.com.br/ws/${cepDigits}/json/`,
            );
            const viaCepData = (await viaCepRes.json()) as {
              bairro?: string;
              erro?: boolean;
            };
            if (!viaCepData.erro && viaCepData.bairro?.trim()) {
              shippingNeighborhood = viaCepData.bairro.trim();
            }
          } catch {
            /* ignorar */
          }
        }
        const blingResult = await createSaleInBling({
          orderId: createdOrder.id,
          pagarmeOrderId: orderId,
          totalAmount: totalAmount,
          items: orderItems.map((i) => ({
            productId: i.product_id,
            productName: i.product_name,
            quantity: i.quantity,
            unitPrice: i.price,
          })),
          customer: {
            name: customerName ?? "Cliente",
            email: customerEmail,
            document: customerCpf ?? undefined,
            phone: customerPhoneStr ?? undefined,
          },
          shipping: {
            zipCode: cepDigits,
            street: streetPart || line1,
            number: numberPart ?? "S/N",
            complement: shippingComplement ?? addr?.line_2 ?? undefined,
            neighborhood: shippingNeighborhood ?? "S/C",
            city: addr?.city ?? "",
            state: (addr?.state ?? "").slice(0, 2).toUpperCase(),
          },
          gerarNotaFiscal: true,
        });
        if (blingResult.success) {
          console.warn("[PAGARME WEBHOOK] Bling: venda criada", {
            blingSaleId: blingResult.blingSaleId,
            orderId: createdOrder.id,
            busqueNoBling: "Vendas > Pedidos de venda (filtrar por Em aberto/Ativo)",
          });
        } else {
          console.warn("[PAGARME WEBHOOK] Bling: falha ao criar venda", {
            orderId: createdOrder.id,
            error: blingResult.error,
          });
        }
      } catch (blingErr) {
        console.error("[PAGARME WEBHOOK] Bling createSale exception:", {
          orderId: createdOrder.id,
          err: blingErr instanceof Error ? blingErr.message : String(blingErr),
          stack: blingErr instanceof Error ? blingErr.stack : undefined,
        });
      }
    } else if (isBlingConfigured() && !blingReady) {
      console.warn("[PAGARME WEBHOOK] Bling configurado mas não chamado — diagnóstico:", {
        orderId: createdOrder.id,
        shipping: payload.data?.shipping
          ? {
              hasAddress: Boolean(payload.data.shipping.address),
              zip_code: payload.data.shipping.address?.zip_code ?? null,
              line_1: payload.data.shipping.address?.line_1 ?? null,
              city: payload.data.shipping.address?.city ?? null,
              state: payload.data.shipping.address?.state ?? null,
              country: payload.data.shipping.address?.country ?? null,
            }
          : null,
        customer: payload.data?.customer
          ? {
              hasDocument: Boolean(payload.data.customer.document),
              documentPrefix: payload.data.customer.document
                ? `${String(payload.data.customer.document).slice(0, 3)}***`
                : null,
            }
          : null,
        customerCpfFromExtract: customerCpf ? "presente" : "ausente",
      });
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("[PAGARME WEBHOOK] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
