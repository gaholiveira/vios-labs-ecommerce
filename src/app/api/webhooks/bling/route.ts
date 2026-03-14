/**
 * Webhook Bling — pedido.atualizado
 *
 * Fluxo:
 *  1. Bling emite POST quando o pedido muda de status.
 *  2. Se o novo status indicar "enviado" (ex.: 9 = "Em Transporte") e houver
 *     dados de rastreio no payload, atualiza o pedido no Supabase e dispara
 *     o e-mail de rastreio para o cliente.
 *
 * Autenticação: Bling permite configurar um "token de webhook" fixo que é
 * enviado no header `X-Bling-Token`. Valide via BLING_WEBHOOK_SECRET no .env.
 * Se a variável não estiver configurada, o webhook é aceito sem validação
 * (útil em dev). Em produção, sempre configure BLING_WEBHOOK_SECRET.
 *
 * Referência: https://developer.bling.com.br/webhooks
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase/admin";
import { sendTrackingEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Tipos do payload Bling ────────────────────────────────────────────────────

interface BlingWebhookPayload {
  /** Nome do evento: "pedido.atualizado", "pedido.criado", etc. */
  event?: string;
  /** Timestamp ISO */
  date?: string;
  data?: {
    id?: number;
    /** Número do pedido no Bling (ex.: "VIOS-ABC12345") */
    numero?: string;
    /** Código de situação. 9 = Em Transporte, 12 = Entregue */
    situacao?: {
      id?: number;
      valor?: string;
    };
    /** Transportadora */
    transportador?: {
      nome?: string;
      codigoRastreamento?: string;
      urlRastreamento?: string;
    };
    /** Código de rastreio pode aparecer na raiz também */
    codigoRastreamento?: string;
  };
}

// Bling status IDs que indicam "em transporte / enviado"
const SHIPPED_SITUACAO_IDS = new Set([
  9,  // Em Transporte
  10, // Em Rota de Entrega (algumas configurações)
]);

// Bling status IDs que indicam "entregue"
const DELIVERED_SITUACAO_IDS = new Set([12]);

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Validação de assinatura (opcional, mas recomendada em prod)
  const secret = process.env.BLING_WEBHOOK_SECRET?.trim();
  if (secret) {
    const tokenHeader = req.headers.get("x-bling-token") ?? "";
    if (tokenHeader !== secret) {
      console.warn("[BLING WEBHOOK] Token inválido:", tokenHeader.slice(0, 8));
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // 2. Parse do payload
  let payload: BlingWebhookPayload;
  try {
    payload = (await req.json()) as BlingWebhookPayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const event = payload.event ?? "";
  const data = payload.data;

  // Só processa eventos de atualização de pedido
  if (!event.includes("pedido") || !data) {
    return NextResponse.json({ received: true });
  }

  const situacaoId = data.situacao?.id ?? 0;
  const isShipped = SHIPPED_SITUACAO_IDS.has(situacaoId);
  const isDelivered = DELIVERED_SITUACAO_IDS.has(situacaoId);

  if (!isShipped && !isDelivered) {
    // Mudança de status que não nos interessa (ex: "Em aberto" → "Aprovado")
    return NextResponse.json({ received: true });
  }

  // 3. Extrair rastreio
  const trackingCode =
    data.transportador?.codigoRastreamento?.trim() ||
    data.codigoRastreamento?.trim() ||
    null;

  const trackingUrl = data.transportador?.urlRastreamento?.trim() || null;
  const trackingCarrier = data.transportador?.nome?.trim() || null;

  // 4. Encontrar o pedido correspondente no Supabase via número do Bling
  // O número segue o padrão "VIOS-{pagarmeOrderId.slice(-8)}" definido em bling.ts
  const blingNumero = data.numero ?? "";

  const supabase = getSupabaseAdmin();

  // Busca pelo payment_order_id terminado com os últimos 8 chars do número Bling
  // Exemplo: numero="VIOS-AB12CD34" → procura payment_order_id terminando em "AB12CD34"
  const suffix = blingNumero.startsWith("VIOS-")
    ? blingNumero.slice(5)
    : blingNumero;

  if (!suffix) {
    console.warn("[BLING WEBHOOK] Número do pedido não identificado:", blingNumero);
    return NextResponse.json({ received: true });
  }

  const { data: order, error: findError } = await supabase
    .from("orders")
    .select("id, customer_email, customer_name, status, tracking_code")
    .ilike("payment_order_id", `%${suffix}`)
    .maybeSingle();

  if (findError) {
    console.error("[BLING WEBHOOK] Erro ao buscar pedido:", findError);
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  if (!order) {
    console.warn("[BLING WEBHOOK] Pedido não encontrado para número:", blingNumero);
    // Retorna 200 mesmo assim para o Bling não ficar reenviando
    return NextResponse.json({ received: true });
  }

  // 5. Atualizar status e rastreio no Supabase
  const newStatus: "shipped" | "delivered" = isDelivered ? "delivered" : "shipped";
  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (trackingCode) updatePayload.tracking_code = trackingCode;
  if (trackingUrl) updatePayload.tracking_url = trackingUrl;
  if (trackingCarrier) updatePayload.tracking_carrier = trackingCarrier;
  if (isShipped && !order.tracking_code) {
    updatePayload.shipped_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", order.id);

  if (updateError) {
    console.error("[BLING WEBHOOK] Erro ao atualizar pedido:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  console.warn(
    `[BLING WEBHOOK] Pedido ${order.id.slice(0, 8)} atualizado → ${newStatus}` +
      (trackingCode ? ` (rastreio: ${trackingCode})` : " (sem rastreio)"),
  );

  // 6. Disparar e-mail de rastreio (apenas quando enviado e com código)
  if (isShipped && trackingCode && order.customer_email) {
    // Não reenvia se já tínhamos um código (idempotência)
    if (!order.tracking_code) {
      try {
        const emailResult = await sendTrackingEmail({
          customerEmail: order.customer_email,
          customerName: (order as { customer_name?: string | null }).customer_name ?? null,
          orderId: order.id,
          trackingCode,
          trackingUrl,
          trackingCarrier,
        });
        if (!emailResult.success) {
          console.error("[BLING WEBHOOK] Falha ao enviar e-mail de rastreio:", emailResult.error);
        } else {
          console.warn("[BLING WEBHOOK] E-mail de rastreio enviado:", emailResult.messageId);
        }
      } catch (emailErr) {
        console.error("[BLING WEBHOOK] Exceção ao enviar e-mail:", emailErr);
      }
    } else {
      console.warn("[BLING WEBHOOK] E-mail já enviado anteriormente para:", order.id.slice(0, 8));
    }
  }

  return NextResponse.json({ received: true });
}
