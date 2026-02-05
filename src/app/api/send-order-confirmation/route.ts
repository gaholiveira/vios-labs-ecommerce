import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/email";

interface OrderConfirmationBody {
  customerEmail: string;
  customerName?: string | null;
  orderId: string;
  orderDate: string;
  totalAmount: number;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
    product_image?: string | null;
  }>;
  status?: "Pago" | "Processando";
  pixCopyPaste?: string | null;
  pixInstructions?: string | null;
  orderUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const data: OrderConfirmationBody = await req.json();

    if (!data.customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 },
      );
    }

    if (!data.orderId || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: "Order ID and items are required" },
        { status: 400 },
      );
    }

    const result = await sendOrderConfirmationEmail({
      customerEmail: data.customerEmail,
      customerName: data.customerName ?? null,
      orderId: data.orderId,
      orderDate: data.orderDate,
      totalAmount: data.totalAmount,
      status: data.status ?? "Pago",
      items: data.items,
      pixCopyPaste: data.pixCopyPaste ?? null,
      pixInstructions: data.pixInstructions ?? null,
      orderUrl: data.orderUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[send-order-confirmation] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
