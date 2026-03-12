import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase/admin";

/**
 * API Route para verificar se um pedido foi criado usando order_id (Pagar.me), session_id ou payment_intent.
 * Usa service role para que o lookup funcione para guest: a página de sucesso não tem sessão com o email do pedido.
 */

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sessionId =
      searchParams.get("order_id") ??
      searchParams.get("session_id") ??
      searchParams.get("payment_intent");

    if (!sessionId) {
      return NextResponse.json(
        { error: "order_id, session_id ou payment_intent é obrigatório" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();

    // Buscar pedido por payment_order_id (Pagar.me order id, Stripe session id ou MP preference_id)
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status, created_at, total_amount, customer_email")
      .eq("payment_order_id", sessionId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao verificar pedido:", error);
      return NextResponse.json(
        { error: "Erro ao verificar pedido" },
        { status: 500 },
      );
    }

    if (order) {
      // Buscar itens para analytics (purchase event)
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id, product_name, quantity, price")
        .eq("order_id", order.id);

      return NextResponse.json({
        exists: true,
        orderId: order.id,
        status: order.status,
        createdAt: order.created_at,
        totalAmount: order.total_amount,
        customerEmail: order.customer_email ?? null,
        items:
          items?.map((i) => ({
            id: i.product_id,
            name: i.product_name,
            price: i.price,
            quantity: i.quantity,
          })) ?? [],
      });
    }

    // Pedido ainda não foi criado (webhook pode estar processando)
    return NextResponse.json({
      exists: false,
      message: "Pedido ainda não foi processado",
    });
  } catch (error: unknown) {
    console.error("Erro na verificação de pedido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
