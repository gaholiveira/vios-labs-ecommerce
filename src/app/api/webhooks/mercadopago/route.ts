import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import {
  getMercadoPagoClient,
  isMercadoPagoConfigured,
} from "@/lib/mercadopago";
import { Payment, MerchantOrder, Preference } from "mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration.");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Payload da notificação MP (POST body) */
interface MercadoPagoWebhookPayload {
  type?: string;
  action?: string;
  data?: { id: string };
  api_version?: string;
  date_created?: string;
  id?: string;
  live_mode?: boolean;
  user_id?: number;
}

/**
 * Valida x-signature do webhook (HMAC SHA256).
 * Se MERCADOPAGO_WEBHOOK_SECRET não estiver definido, não valida.
 */
function validateSignature(
  payload: MercadoPagoWebhookPayload,
  xSignature: string | null,
  xRequestId: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !xSignature || !payload.data?.id) return !secret;
  const parts = xSignature.split(",");
  let ts: string | null = null;
  let hash: string | null = null;
  for (const part of parts) {
    const [key, value] = part.split("=").map((s) => s.trim());
    if (key === "ts") ts = value;
    else if (key === "v1") hash = value;
  }
  if (!ts || !hash) return false;
  const manifest = `id:${payload.data.id};request-id:${xRequestId || ""};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");
  return expected === hash;
}

/**
 * Processa notificação de pagamento aprovado: cria order, order_items, confirma reserva e envia e-mail.
 * Usado por POST (body) e GET (query topic=payment&id=...).
 */
async function processPaymentNotification(paymentId: string): Promise<void> {
  const mpConfig = getMercadoPagoClient();
  const paymentClient = new Payment(mpConfig);
  const merchantOrderClient = new MerchantOrder(mpConfig);
  const preferenceClient = new Preference(mpConfig);

  const payment = await paymentClient.get({ id: paymentId });

  if (!payment || payment.status !== "approved") {
    return;
  }

  let preferenceId: string | undefined;

  if (payment.order?.id != null) {
    try {
      const merchantOrder = await merchantOrderClient.get({
        merchantOrderId: String(payment.order.id),
      });
      preferenceId = merchantOrder.preference_id;
    } catch (e) {
      console.warn("[MERCADOPAGO WEBHOOK] MerchantOrder get failed:", e);
    }
  }

  if (!preferenceId && payment.external_reference) {
    try {
      const searchResult = await merchantOrderClient.search({
        options: { external_reference: payment.external_reference },
      });
      const first = searchResult.elements?.[0];
      if (first?.preference_id) preferenceId = first.preference_id;
    } catch (e) {
      console.warn("[MERCADOPAGO WEBHOOK] MerchantOrder search failed:", e);
    }
  }

  // Fallback: MP pode enviar preference_id no metadata do payment
  if (
    !preferenceId &&
    payment.metadata &&
    typeof payment.metadata === "object"
  ) {
    const meta = payment.metadata as Record<string, unknown>;
    if (typeof meta.preference_id === "string")
      preferenceId = meta.preference_id;
  }

  if (!preferenceId) {
    console.error(
      "[MERCADOPAGO WEBHOOK] Could not resolve preference_id for payment:",
      paymentId,
      "| payment.order:",
      payment.order,
      "| external_reference:",
      payment.external_reference,
    );
    return;
  }

  const preference = await preferenceClient.get({ preferenceId });
  if (!preference) {
    console.error("[MERCADOPAGO WEBHOOK] Preference not found:", preferenceId);
    return;
  }

  let metadata: Record<string, string> = {};
  if (preference.metadata != null) {
    if (typeof preference.metadata === "string") {
      try {
        metadata = JSON.parse(preference.metadata) as Record<string, string>;
      } catch {
        console.warn(
          "[MERCADOPAGO WEBHOOK] metadata is string but not valid JSON",
        );
      }
    } else if (typeof preference.metadata === "object") {
      metadata = preference.metadata as Record<string, string>;
    }
  }

  if (!metadata || Object.keys(metadata).length === 0) {
    console.error(
      "[MERCADOPAGO WEBHOOK] Preference has no metadata:",
      preferenceId,
    );
    return;
  }

  const userId = metadata.user_id === "null" ? null : metadata.user_id;
  let customerEmail: string | null =
    metadata.customer_email && metadata.customer_email !== "null"
      ? metadata.customer_email
      : null;
  if (!customerEmail) {
    customerEmail =
      (payment.payer as { email?: string })?.email ??
      preference.payer?.email ??
      null;
  }
  const fallbackEmail =
    process.env.FALLBACK_ORDER_EMAIL ?? "pedido-sem-email@vioslabs.com.br";
  if (!customerEmail || !customerEmail.trim()) {
    console.warn(
      "[MERCADOPAGO WEBHOOK] Missing customer_email in preference metadata and payer. Using fallback so order is not lost. Preference:",
      preferenceId,
      "Metadata keys:",
      Object.keys(metadata).join(", "),
    );
    customerEmail = fallbackEmail;
  } else {
    customerEmail = customerEmail.trim();
  }

  const totalAmount = Number(metadata.total) ?? payment.transaction_amount ?? 0;
  const customerName =
    metadata.customer_name && metadata.customer_name !== "null"
      ? metadata.customer_name
      : preference.payer?.name
        ? [preference.payer.name, preference.payer.surname]
            .filter(Boolean)
            .join(" ") || null
        : null;
  const customerCpf =
    metadata.customer_cpf && metadata.customer_cpf !== "null"
      ? metadata.customer_cpf
      : null;
  const customerPhone =
    metadata.customer_phone && metadata.customer_phone !== "null"
      ? metadata.customer_phone
      : null;
  const shippingCep =
    metadata.shipping_cep && metadata.shipping_cep !== "null"
      ? metadata.shipping_cep
      : null;
  const shippingStreet =
    metadata.shipping_street && metadata.shipping_street !== "null"
      ? metadata.shipping_street
      : null;
  const shippingNumber =
    metadata.shipping_number && metadata.shipping_number !== "null"
      ? metadata.shipping_number
      : null;
  const shippingComplement =
    metadata.shipping_complement && metadata.shipping_complement !== "null"
      ? metadata.shipping_complement
      : null;
  const shippingNeighborhood =
    metadata.shipping_neighborhood && metadata.shipping_neighborhood !== "null"
      ? metadata.shipping_neighborhood
      : null;
  const shippingCity =
    metadata.shipping_city && metadata.shipping_city !== "null"
      ? metadata.shipping_city
      : null;
  const shippingState =
    metadata.shipping_state && metadata.shipping_state !== "null"
      ? metadata.shipping_state
      : null;

  const supabaseAdmin = getSupabaseAdmin();

  const { data: existingOrder } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("stripe_session_id", preferenceId)
    .maybeSingle();

  if (existingOrder) {
    return;
  }

  const orderInsert: Record<string, unknown> = {
    user_id: userId || null,
    customer_email: customerEmail,
    status: "paid",
    total_amount: totalAmount,
    stripe_session_id: preferenceId,
  };
  if (customerCpf != null) orderInsert.customer_cpf = customerCpf;
  if (customerName != null) orderInsert.customer_name = customerName;
  if (customerPhone != null) orderInsert.customer_phone = customerPhone;
  if (shippingCep != null) orderInsert.shipping_cep = shippingCep;
  if (shippingStreet != null) orderInsert.shipping_street = shippingStreet;
  if (shippingNumber != null) orderInsert.shipping_number = shippingNumber;
  if (shippingComplement != null)
    orderInsert.shipping_complement = shippingComplement;
  if (shippingNeighborhood != null)
    orderInsert.shipping_neighborhood = shippingNeighborhood;
  if (shippingCity != null) orderInsert.shipping_city = shippingCity;
  if (shippingState != null) orderInsert.shipping_state = shippingState;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert(orderInsert)
    .select()
    .single();

  if (orderError || !order) {
    console.error("[MERCADOPAGO WEBHOOK] Error creating order:", orderError);
    throw new Error("Failed to create order");
  }

  const items = preference.items ?? [];
  const orderItems: Array<{
    order_id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    product_image: string | null;
  }> = [];

  for (const item of items) {
    if (
      !item.id ||
      !item.title ||
      item.quantity == null ||
      item.unit_price == null
    )
      continue;
    if (item.id === "pix-discount") continue;
    orderItems.push({
      order_id: order.id,
      product_id: item.id,
      product_name: item.title,
      quantity: item.quantity,
      price: Number(item.unit_price),
      product_image: item.picture_url ?? null,
    });
  }

  if (orderItems.length > 0) {
    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);
    if (itemsError) {
      console.error(
        "[MERCADOPAGO WEBHOOK] Error creating order_items:",
        itemsError,
      );
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error("Failed to create order items");
    }
  }

  try {
    await supabaseAdmin.rpc("confirm_reservation", {
      p_stripe_session_id: preferenceId,
      p_order_id: order.id,
    });
  } catch (invErr) {
    console.error(
      "[MERCADOPAGO WEBHOOK] confirm_reservation exception:",
      invErr,
    );
  }

  try {
    await sendOrderConfirmationEmail({
      order,
      orderItems,
      customerEmail,
      customerName: preference.payer?.name
        ? [preference.payer.name, preference.payer.surname]
            .filter(Boolean)
            .join(" ") || null
        : null,
    });
  } catch (emailErr) {
    console.error(
      "[MERCADOPAGO WEBHOOK] Error sending confirmation email:",
      emailErr,
    );
  }
}

/**
 * Envia email de confirmação (mesma API usada pelo webhook Stripe).
 */
async function sendOrderConfirmationEmail({
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
  if (!process.env.RESEND_API_KEY) return;
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  const response = await fetch(`${baseUrl}/api/send-order-confirmation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerEmail,
      customerName,
      orderId: order.id,
      orderDate: order.created_at,
      totalAmount: order.total_amount,
      items: orderItems.map((item) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        product_image: item.product_image,
      })),
      orderUrl: `${baseUrl}/orders`,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown" }));
    throw new Error(
      (err as { error?: string }).error || "Failed to send email",
    );
  }
}

/**
 * Alguns fluxos do Mercado Pago enviam GET com topic e id na query.
 * Processamos igual ao POST: buscar payment e criar pedido se aprovado.
 */
export async function GET(req: NextRequest) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json(
      { error: "Mercado Pago not configured" },
      { status: 503 },
    );
  }
  const topic = req.nextUrl.searchParams.get("topic");
  const id =
    req.nextUrl.searchParams.get("id") ??
    req.nextUrl.searchParams.get("data.id");
  if (topic === "payment" && id) {
    try {
      await processPaymentNotification(String(id));
    } catch (e) {
      console.error(
        "[MERCADOPAGO WEBHOOK GET] processPaymentNotification error:",
        e,
      );
    }
  }
  return NextResponse.json({ received: true });
}

export async function POST(req: NextRequest) {
  try {
    if (!isMercadoPagoConfigured()) {
      return NextResponse.json(
        { error: "Mercado Pago not configured" },
        { status: 503 },
      );
    }

    const body = (await req.json()) as MercadoPagoWebhookPayload;
    const type = body.type;
    const dataId = body.data?.id;

    if (!type || !dataId) {
      return NextResponse.json(
        { error: "Missing type or data.id" },
        { status: 400 },
      );
    }

    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");
    if (!validateSignature(body, xSignature, xRequestId, webhookSecret)) {
      if (webhookSecret) {
        console.error("[MERCADOPAGO WEBHOOK] Invalid x-signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    }

    if (type !== "payment") {
      return NextResponse.json({ received: true });
    }

    await processPaymentNotification(String(dataId));
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[MERCADOPAGO WEBHOOK] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook error" },
      { status: 500 },
    );
  }
}
