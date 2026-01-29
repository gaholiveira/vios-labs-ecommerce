import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * API Route para verificar se um pedido foi criado usando order_id (Pagar.me), session_id ou payment_intent.
 * Usa service role para que o lookup funcione para guest: a página de sucesso não tem sessão com o email do pedido.
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase config");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

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

    // Buscar pedido por stripe_session_id (Pagar.me order id, Stripe session id ou MP preference_id)
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status, created_at")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao verificar pedido:", error);
      return NextResponse.json(
        { error: "Erro ao verificar pedido" },
        { status: 500 },
      );
    }

    if (order) {
      return NextResponse.json({
        exists: true,
        orderId: order.id,
        status: order.status,
        createdAt: order.created_at,
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
