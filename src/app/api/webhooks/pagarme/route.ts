import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS } from "@/constants/products";
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

export async function POST(req: NextRequest) {
  if (!isPagarmeConfigured()) {
    return NextResponse.json(
      { error: "Pagar.me not configured" },
      { status: 503 },
    );
  }

  try {
    const payload = (await req.json()) as PagarmeWebhookPayload;

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
      stripe_session_id: orderId,
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
      console.warn("[PAGARME WEBHOOK] E-mail enviado para:", customerEmail);
    } catch (emailErr) {
      console.error("[PAGARME WEBHOOK] sendOrderConfirmation error:", emailErr);
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
