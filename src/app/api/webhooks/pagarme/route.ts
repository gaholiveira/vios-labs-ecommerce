import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { isPagarmeConfigured } from "@/lib/pagarme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase configuration.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

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

export async function POST(req: NextRequest) {
  if (!isPagarmeConfigured()) {
    return NextResponse.json(
      { error: "Pagar.me not configured" },
      { status: 503 },
    );
  }

  try {
    const payload = (await req.json()) as PagarmeWebhookPayload;

    if (payload.type !== "order.paid" || !payload.data?.id) {
      return NextResponse.json({ received: true });
    }

    const orderId = payload.data.id;
    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_session_id", orderId)
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

    const customerName = payload.data.customer?.name ?? null;
    const customerCpf = payload.data.customer?.document
      ? payload.data.customer.document.replace(/\D/g, "")
      : null;
    const addr = payload.data.shipping?.address;
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
      stripe_session_id: orderId,
      customer_cpf: customerCpf ?? undefined,
      customer_name: customerName ?? undefined,
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
      console.error("[PAGARME WEBHOOK] Error creating order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 },
      );
    }

    const items = payload.data.items ?? [];
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
      orderItems.push({
        order_id: createdOrder.id,
        product_id: productId,
        product_name: item.description ?? "Produto",
        quantity: item.quantity,
        price: unitPrice,
        product_image: null,
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
        p_stripe_session_id: orderId,
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
    } catch (emailErr) {
      console.error("[PAGARME WEBHOOK] sendOrderConfirmation error:", emailErr);
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
