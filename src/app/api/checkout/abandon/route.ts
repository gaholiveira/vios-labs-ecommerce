import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/checkout/abandon
 *
 * Registra (upsert por e-mail) um abandono de checkout.
 * Chamado no onBlur do campo de e-mail e do campo de telefone do checkout.
 *
 * Body: { email, phone?, cart_items? }
 *
 * Comportamento:
 * - Se já existe um registro pendente para o e-mail, atualiza (phone, cart_items, send_at).
 * - Se o pedido já foi concluído (status = converted), não faz nada.
 * - send_at = agora + 1h (o cron envia após esse intervalo).
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; phone?: string; cart_items?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  const phone = body.phone?.replace(/\D/g, "").slice(0, 11) || null;
  const cartItems = body.cart_items ?? null;
  const now = new Date();
  const sendAt = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora

  const supabase = getSupabaseAdmin();

  // Verificar se já existe registro convertido — não sobrescrever
  const { data: existing } = await supabase
    .from("checkout_abandons")
    .select("id, status")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.status === "converted") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (existing && existing.status === "pending") {
    // Atualizar registro existente (ex.: telefone preenchido depois do e-mail)
    const { error } = await supabase
      .from("checkout_abandons")
      .update({
        ...(phone ? { phone } : {}),
        ...(cartItems ? { cart_items: cartItems } : {}),
        send_at: sendAt.toISOString(),
        captured_at: now.toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      console.error("[ABANDON] update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, updated: true });
  }

  // Inserir novo registro
  const { error } = await supabase.from("checkout_abandons").insert({
    email,
    phone,
    cart_items: cartItems,
    captured_at: now.toISOString(),
    send_at: sendAt.toISOString(),
    status: "pending",
  });

  if (error) {
    console.error("[ABANDON] insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, created: true });
}
