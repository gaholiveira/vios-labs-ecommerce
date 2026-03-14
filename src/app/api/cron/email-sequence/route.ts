import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase/admin";
import { sendD3CheckInEmail, sendD7ReorderEmail, sendAbandonEmail } from "@/lib/email";

/**
 * Cron: processar fila de e-mails da sequence pós-compra + abandono de checkout.
 *
 * Busca até 50 registros com status "pending" e send_at <= agora,
 * envia via Resend e atualiza o status.
 *
 * vercel.json: { "crons": [{ "path": "/api/cron/email-sequence", "schedule": "0 * * * *" }] }
 * → executa a cada hora (plano Hobby: 2 crons máx.)
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_SIZE = 50;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // ── Sequence pós-compra (D+3 / D+7) ──
  const { data: pending, error: fetchError } = await supabase
    .from("email_sequences")
    .select("id, order_id, customer_email, customer_name, sequence_type, product_names, product_ids")
    .eq("status", "pending")
    .lte("send_at", new Date().toISOString())
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error("[CRON email-sequence] Erro ao buscar pending:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const row of pending ?? []) {
    const params = {
      customerEmail: row.customer_email as string,
      customerName: (row.customer_name as string | null) ?? null,
      productNames: (row.product_names as string[]) ?? [],
      productIds: (row.product_ids as string[]) ?? [],
      orderId: (row.order_id as string) ?? "",
    };

    let result: { success: boolean; error?: string; messageId?: string };

    if (row.sequence_type === "d3_check_in") {
      result = await sendD3CheckInEmail(params);
    } else if (row.sequence_type === "d7_reorder") {
      result = await sendD7ReorderEmail(params);
    } else {
      await supabase
        .from("email_sequences")
        .update({ status: "failed", error_message: `Tipo desconhecido: ${String(row.sequence_type)}`, sent_at: new Date().toISOString() })
        .eq("id", row.id);
      failed++;
      continue;
    }

    if (result.success) {
      await supabase
        .from("email_sequences")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    } else {
      await supabase
        .from("email_sequences")
        .update({ status: "failed", error_message: result.error ?? "Erro desconhecido", sent_at: new Date().toISOString() })
        .eq("id", row.id);
      failed++;
      console.error(`[CRON email-sequence] Falha ao enviar ${String(row.sequence_type)} para ${String(row.customer_email)}:`, result.error);
    }
  }

  // ── Abandono de checkout ──
  const abandon = await processAbandonEmails(supabase);

  console.warn(
    `[CRON email-sequence] Sequence: ${sent} enviados, ${failed} falhas. Abandono: ${abandon.sent} enviados, ${abandon.failed} falhas.`,
  );

  return NextResponse.json({
    processed: (pending?.length ?? 0) + abandon.sent + abandon.failed,
    sent: sent + abandon.sent,
    failed: failed + abandon.failed,
  });
}

// ── Abandono de checkout ─────────────────────────────────────────────────────

async function processAbandonEmails(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const now = new Date().toISOString();

  const { data: abandons, error: fetchErr } = await supabase
    .from("checkout_abandons")
    .select("id, email, cart_items")
    .eq("status", "pending")
    .lte("send_at", now)
    .limit(50);

  if (fetchErr) {
    console.error("[CRON abandon] Erro ao buscar abandons:", fetchErr);
    return { sent: 0, failed: 0 };
  }

  if (!abandons || abandons.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const row of abandons) {
    type CartItem = { name: string; quantity: number; price: number };
    const cartItems = Array.isArray(row.cart_items)
      ? (row.cart_items as CartItem[])
      : null;

    const result = await sendAbandonEmail({
      customerEmail: row.email as string,
      cartItems,
    });

    if (result.success) {
      await supabase
        .from("checkout_abandons")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    } else {
      await supabase
        .from("checkout_abandons")
        .update({
          status: "failed",
          error_message: result.error ?? "Erro desconhecido",
          sent_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      failed++;
      console.error(`[CRON abandon] Falha para ${String(row.email)}:`, result.error);
    }
  }

  return { sent, failed };
}

export async function POST(req: NextRequest) {
  return GET(req);
}
