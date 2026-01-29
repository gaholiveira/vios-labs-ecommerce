import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import {
  getMercadoPagoClient,
  isMercadoPagoConfigured,
} from "@/lib/mercadopago";
import { Payment, MerchantOrder, Preference } from "mercadopago";
import type { ReserveInventoryResponse } from "@/types/database";

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

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Webhooks only accept POST." },
    { status: 405 },
  );
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

    const mpConfig = getMercadoPagoClient();
    const paymentClient = new Payment(mpConfig);
    const merchantOrderClient = new MerchantOrder(mpConfig);
    const preferenceClient = new Preference(mpConfig);

    const paymentId = String(dataId);
    const payment = await paymentClient.get({ id: paymentId });

    if (!payment || payment.status !== "approved") {
      return NextResponse.json({ received: true });
    }

    let preferenceId: string | undefined;

    if (payment.order?.id != null) {
      try {
        const merchantOrder = await merchantOrderClient.get({
          merchantOrderId: String(payment.order.id),
        });
        preferenceId = merchantOrder.preference_id;
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[MERCADOPAGO WEBHOOK] MerchantOrder get failed:", e);
        }
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
        if (process.env.NODE_ENV === "development") {
          console.warn("[MERCADOPAGO WEBHOOK] MerchantOrder search failed:", e);
        }
      }
    }

    if (!preferenceId) {
      console.error(
        "[MERCADOPAGO WEBHOOK] Could not resolve preference_id for payment:",
        paymentId,
      );
      return NextResponse.json(
        { error: "Could not resolve preference" },
        { status: 200 },
      );
    }

    const preference = await preferenceClient.get({ preferenceId });
    if (!preference || !preference.metadata) {
      console.error(
        "[MERCADOPAGO WEBHOOK] Preference not found or no metadata:",
        preferenceId,
      );
      return NextResponse.json({ received: true });
    }

    const metadata = preference.metadata as Record<string, string>;
    const userId = metadata.user_id === "null" ? null : metadata.user_id;
    const customerEmail = metadata.customer_email;
    if (!customerEmail || customerEmail === "null") {
      console.error(
        "[MERCADOPAGO WEBHOOK] Missing customer_email in preference metadata",
      );
      return NextResponse.json({ received: true });
    }

    const totalAmount =
      Number(preference.metadata?.total) ?? payment.transaction_amount ?? 0;
    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingOrder } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("stripe_session_id", preferenceId)
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json({ received: true });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId || null,
        customer_email: customerEmail,
        status: "paid",
        total_amount: totalAmount,
        stripe_session_id: preferenceId,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("[MERCADOPAGO WEBHOOK] Error creating order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 },
      );
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
        return NextResponse.json(
          { error: "Failed to create order items" },
          { status: 500 },
        );
      }
    }

    try {
      const { data: confirmResult, error: confirmError } =
        await supabaseAdmin.rpc("confirm_reservation", {
          p_stripe_session_id: preferenceId,
          p_order_id: order.id,
        });
      if (confirmError) {
        console.error(
          "[MERCADOPAGO WEBHOOK] Error confirming reservation:",
          confirmError,
        );
      } else if (
        confirmResult &&
        !(confirmResult as ReserveInventoryResponse).success
      ) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[MERCADOPAGO WEBHOOK] Reservation not found or already processed",
          );
        }
      }
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

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[MERCADOPAGO WEBHOOK] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook error" },
      { status: 500 },
    );
  }
}
