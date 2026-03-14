/**
 * Envio de e-mails transacionais — VIOS Labs
 * Usa Resend. Remetente: VIOS Labs <atendimento@vioslabs.com.br>
 * Template: fundo #F9F7F2, texto #1B2B22 (Pharmaceutical Luxury).
 */

import { Resend } from "resend";

const FROM_EMAIL = "atendimento@vioslabs.com.br";
const FROM_NAME = "VIOS Labs";
const BACKGROUND = "#F9F7F2";
const TEXT = "#1B2B22";
const BORDER = "rgba(27,43,34,0.12)";
const GOLD = "#C9A961";

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("RESEND_API_KEY não configurada. Configure no .env para enviar e-mails.");
  }
  return new Resend(key);
}

/** Formata valor em reais (R$ 299,00). Valores devem ser em reais, não centavos. */
const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatPrice(valueInReais: number): string {
  return BRL_FORMATTER.format(valueInReais);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export interface SendOrderConfirmationParams {
  customerEmail: string;
  customerName: string | null;
  orderId: string;
  orderDate: string;
  /** Total do pedido em reais (ex.: 299 para R$ 299,00). Não enviar em centavos. */
  totalAmount: number;
  status: "Pago" | "Processando";
  items: Array<{
    product_name: string;
    quantity: number;
    /** Preço unitário em reais (ex.: 99.9 para R$ 99,90). Não enviar em centavos. */
    price: number;
    product_image?: string | null;
  }>;
  pixCopyPaste?: string | null;
  pixInstructions?: string | null;
  orderUrl?: string;
  siteUrl?: string;
}

function generateOrderConfirmationHtml(params: SendOrderConfirmationParams): string {
  const shortId = params.orderId.slice(0, 8).toUpperCase();
  const orderUrl =
    params.orderUrl ??
    `${process.env.NEXT_PUBLIC_SITE_URL || "https://vioslabs.com.br"}/checkout/success?order_id=${encodeURIComponent(params.orderId)}`;
  const siteUrl = params.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://vioslabs.com.br";
  const isPixPending =
    params.status === "Processando" && (params.pixCopyPaste || params.pixInstructions);
  const pixInstructions =
    params.pixInstructions ??
    (params.status === "Processando" && params.pixCopyPaste
      ? "Escaneie o QR Code no app do seu banco ou copie o código abaixo para pagar via PIX."
      : null);

  const itemsRows = params.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid ${BORDER};">
        <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: ${TEXT};">
          ${escapeHtml(item.product_name)}
        </p>
        <p style="margin: 0; font-size: 13px; color: ${TEXT}; opacity: 0.8;">
          Quantidade: ${item.quantity} × ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}
        </p>
      </td>
    </tr>`,
    )
    .join("");

  const pixBlock =
    isPixPending && (params.pixCopyPaste || pixInstructions)
      ? `
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid ${BORDER};">
      <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: ${TEXT};">Pagamento PIX</p>
      ${pixInstructions ? `<p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: ${TEXT};">${escapeHtml(pixInstructions)}</p>` : ""}
      ${
        params.pixCopyPaste
          ? `
      <div style="background: rgba(27,43,34,0.04); border: 0.5px solid ${BORDER}; border-radius: 4px; padding: 16px; margin-top: 12px;">
        <p style="margin: 0 0 8px 0; font-size: 11px; color: ${TEXT}; opacity: 0.8;">Código PIX (copie e cole no app do seu banco):</p>
        <p style="margin: 0; font-size: 11px; font-family: monospace; color: ${TEXT}; word-break: break-all;">${escapeHtml(params.pixCopyPaste)}</p>
      </div>`
          : ""
      }
    </div>`
      : "";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.status === "Pago" ? "Pagamento confirmado" : "Pedido recebido"} — VIOS Labs</title>
</head>
<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: ${BACKGROUND}; color: ${TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BACKGROUND}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${BACKGROUND}; border-radius: 4px; border: 1px solid ${BORDER}; overflow: hidden;">
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-bottom: 1px solid ${BORDER};">
              <h1 style="margin: 0; font-size: 22px; font-weight: 300; letter-spacing: 0.1em; text-transform: uppercase; color: ${TEXT};">VIOS LABS</h1>
              <p style="margin: 12px 0 0 0; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: ${TEXT}; opacity: 0.7;">
                ${params.status === "Pago" ? "Pagamento confirmado" : "Pedido recebido"}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: ${TEXT};">
                Olá ${escapeHtml(params.customerName || "cliente")},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: ${TEXT};">
                ${
                  params.status === "Pago"
                    ? "Seu pagamento foi confirmado e seu pedido está sendo preparado."
                    : "Seu pedido foi registrado. Complete o pagamento PIX abaixo para confirmar."
                }
              </p>
              <div style="background: rgba(27,43,34,0.04); border-radius: 4px; padding: 20px; margin-bottom: 24px; border: 0.5px solid ${BORDER};">
                <p style="margin: 0 0 8px 0; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: ${TEXT}; opacity: 0.7;">Detalhes do pedido</p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: ${TEXT};"><strong>Nº do pedido:</strong> #${shortId}</p>
                <p style="margin: 0; font-size: 14px; color: ${TEXT};"><strong>Data:</strong> ${formatDate(params.orderDate)}</p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: ${TEXT};"><strong>Status:</strong> ${params.status}</p>
              </div>
              <p style="margin: 0 0 12px 0; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: ${TEXT}; opacity: 0.7;">Produtos</p>
              <table width="100%" cellpadding="0" cellspacing="0">${itemsRows}</table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid ${BORDER};">
                <tr><td style="text-align: right;"><p style="margin: 0; font-size: 14px; color: ${TEXT};"><strong>Total:</strong> ${formatPrice(params.totalAmount)}</p></td></tr>
              </table>
              ${pixBlock}
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                <tr><td align="center">
                  <a href="${escapeHtml(orderUrl)}" style="display: inline-block; padding: 14px 28px; background-color: ${TEXT}; color: ${BACKGROUND}; text-decoration: none; font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 4px;">
                    ${params.status === "Pago" ? "Acompanhar pedido" : "Ver pedido"}
                  </a>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${BORDER};">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: ${TEXT}; opacity: 0.7;">VIOS LABS</p>
              <p style="margin: 0; font-size: 11px; color: ${TEXT}; opacity: 0.6;">Dúvidas? Acesse <a href="${escapeHtml(siteUrl)}" style="color: ${TEXT}; text-decoration: underline;">${escapeHtml(siteUrl)}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Envia e-mail de confirmação de pedido via Resend.
 * - Cartão (imediato): status "Pago".
 * - PIX (imediato): status "Processando" + instruções e código copia e cola.
 * - PIX (webhook): status "Pago" (Pagamento Confirmado).
 */
export async function sendOrderConfirmationEmail(
  params: SendOrderConfirmationParams,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn("[EMAIL] RESEND_API_KEY não configurada. E-mail não enviado.");
    return { success: false, error: "RESEND_API_KEY não configurada." };
  }

  try {
    const html = generateOrderConfirmationHtml(params);
    const resend = getResendClient();
    const shortId = params.orderId.slice(0, 8).toUpperCase();
    const subject =
      params.status === "Pago"
        ? `Pagamento confirmado — Pedido #${shortId} | VIOS Labs`
        : `Pedido #${shortId} — Pague com PIX | VIOS Labs`;

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.customerEmail,
      subject,
      html,
    });

    if (error) {
      console.error("[EMAIL] Resend error:", error);
      return { success: false, error: String(error.message ?? error) };
    }
    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[EMAIL] sendOrderConfirmation error:", err);
    return { success: false, error: message };
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

// ============================================================================
// SEQUENCE PÓS-COMPRA
// ============================================================================

export interface SendSequenceEmailParams {
  customerEmail: string;
  customerName: string | null;
  productNames: string[];
  /** IDs dos produtos (ex.: prod_1) para montar link de avaliação. */
  productIds?: string[];
  orderId: string;
  siteUrl?: string;
}

// ─── D+3: Check-in ───────────────────────────────────────────────────────────

function generateD3Html(params: SendSequenceEmailParams): string {
  const siteUrl = params.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://vioslabs.com.br";
  const firstName = params.customerName?.split(" ")[0] ?? "cliente";
  const productList = params.productNames.length > 0
    ? params.productNames.map((n) => escapeHtml(n)).join(", ")
    : "seu produto VIOS";
  // Link direto para o primeiro produto comprado, seção de avaliações
  const firstProductId = params.productIds?.[0];
  const reviewUrl = firstProductId
    ? `${siteUrl}/produto/${encodeURIComponent(firstProductId)}#avaliacoes`
    : siteUrl;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seus resultados estão começando — VIOS Labs</title>
</head>
<body style="margin:0;padding:0;font-family:sans-serif;background-color:${BACKGROUND};color:${TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BACKGROUND};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:${BACKGROUND};border-radius:4px;border:1px solid ${BORDER};overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="padding:32px 40px;text-align:center;border-bottom:1px solid ${BORDER};">
            <h1 style="margin:0;font-size:22px;font-weight:300;letter-spacing:0.1em;text-transform:uppercase;color:${TEXT};">VIOS LABS</h1>
            <div style="width:28px;height:1px;background:${GOLD};margin:10px auto;"></div>
            <p style="margin:0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${TEXT};opacity:0.7;">Dia 3 da sua jornada</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:${TEXT};">Olá, ${escapeHtml(firstName)}.</p>
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:${TEXT};">
              Já se passaram 3 dias desde que você começou com <strong>${productList}</strong>.
              Os primeiros resultados costumam ser sutis, mas o processo interno já está em andamento.
            </p>
            <p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:${TEXT};">
              Como estão sendo esses primeiros dias? Sua experiência importa — e pode ajudar outras pessoas a fazerem escolhas mais conscientes.
            </p>
            <!-- CTA principal -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;padding:14px 32px;background-color:${TEXT};color:${BACKGROUND};text-decoration:none;font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;border-radius:4px;">
                  Deixar minha avaliação
                </a>
              </td></tr>
            </table>
            <!-- Separador -->
            <div style="border-top:1px solid ${BORDER};margin:28px 0;"></div>
            <p style="margin:0;font-size:13px;line-height:1.6;color:${TEXT};opacity:0.75;">
              Dúvidas? Nossa equipe está disponível pelo
              <a href="https://wa.me/5511952136713" style="color:${TEXT};text-decoration:underline;">WhatsApp</a>
              ou pelo e-mail <a href="mailto:atendimento@vioslabs.com.br" style="color:${TEXT};text-decoration:underline;">atendimento@vioslabs.com.br</a>.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;border-top:1px solid ${BORDER};">
            <p style="margin:0 0 8px 0;font-size:11px;color:${TEXT};opacity:0.7;">VIOS LABS · A Ciência da Longevidade</p>
            <p style="margin:0;font-size:11px;color:${TEXT};opacity:0.6;">
              <a href="${escapeHtml(siteUrl)}/privacidade" style="color:${TEXT};text-decoration:underline;">Privacidade</a>
              &nbsp;·&nbsp;
              <a href="${escapeHtml(siteUrl)}" style="color:${TEXT};text-decoration:underline;">${escapeHtml(siteUrl)}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

/**
 * E-mail D+3: check-in pós-compra + convite para avaliação.
 */
export async function sendD3CheckInEmail(
  params: SendSequenceEmailParams,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn("[EMAIL] RESEND_API_KEY não configurada. D+3 não enviado.");
    return { success: false, error: "RESEND_API_KEY não configurada." };
  }
  try {
    const html = generateD3Html(params);
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.customerEmail,
      subject: "Seus primeiros dias com VIOS — como está sendo?",
      html,
    });
    if (error) {
      console.error("[EMAIL] D+3 error:", error);
      return { success: false, error: String(error.message ?? error) };
    }
    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[EMAIL] sendD3CheckInEmail error:", err);
    return { success: false, error: message };
  }
}

// ─── D+7: Recompra ───────────────────────────────────────────────────────────

function generateD7Html(params: SendSequenceEmailParams): string {
  const siteUrl = params.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://vioslabs.com.br";
  const firstName = params.customerName?.split(" ")[0] ?? "cliente";
  const productList = params.productNames.length > 0
    ? params.productNames.map((n) => escapeHtml(n)).join(" + ")
    : "seu produto VIOS";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Garanta seu próximo ciclo — VIOS Labs</title>
</head>
<body style="margin:0;padding:0;font-family:sans-serif;background-color:${BACKGROUND};color:${TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BACKGROUND};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:${BACKGROUND};border-radius:4px;border:1px solid ${BORDER};overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="padding:32px 40px;text-align:center;border-bottom:1px solid ${BORDER};">
            <h1 style="margin:0;font-size:22px;font-weight:300;letter-spacing:0.1em;text-transform:uppercase;color:${TEXT};">VIOS LABS</h1>
            <div style="width:28px;height:1px;background:${GOLD};margin:10px auto;"></div>
            <p style="margin:0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${TEXT};opacity:0.7;">Dia 7 — Continuidade</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:${TEXT};">Olá, ${escapeHtml(firstName)}.</p>
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:${TEXT};">
              Já são 7 dias com <strong>${productList}</strong>. Nessa fase, os benefícios começam a se consolidar — e a consistência é o que diferencia resultados superficiais de transformações reais.
            </p>
            <!-- Bloco destaque -->
            <div style="background:rgba(27,43,34,0.04);border:0.5px solid ${BORDER};border-radius:4px;padding:20px 24px;margin:0 0 28px 0;">
              <p style="margin:0 0 8px 0;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${TEXT};opacity:0.7;">Por que manter o ciclo sem pausas</p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:${TEXT};">
                A maioria dos micronutrientes atua de forma cumulativa. Interromper o uso redefine o ponto de partida. Para garantir um estoque antes de acabar o atual, o melhor momento é agora.
              </p>
            </div>
            <!-- CTA principal -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${escapeHtml(siteUrl)}" style="display:inline-block;padding:14px 32px;background-color:${TEXT};color:${BACKGROUND};text-decoration:none;font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;border-radius:4px;">
                  Garantir meu próximo ciclo
                </a>
              </td></tr>
            </table>
            <!-- Separador -->
            <div style="border-top:1px solid ${BORDER};margin:28px 0;"></div>
            <p style="margin:0;font-size:13px;line-height:1.6;color:${TEXT};opacity:0.75;">
              Prefere explorar toda a linha VIOS?
              <a href="${escapeHtml(siteUrl)}" style="color:${TEXT};text-decoration:underline;">Acesse nossa loja</a>
              e descubra os protocolos completos.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;border-top:1px solid ${BORDER};">
            <p style="margin:0 0 8px 0;font-size:11px;color:${TEXT};opacity:0.7;">VIOS LABS · A Ciência da Longevidade</p>
            <p style="margin:0;font-size:11px;color:${TEXT};opacity:0.6;">
              <a href="${escapeHtml(siteUrl)}/privacidade" style="color:${TEXT};text-decoration:underline;">Privacidade</a>
              &nbsp;·&nbsp;
              <a href="${escapeHtml(siteUrl)}" style="color:${TEXT};text-decoration:underline;">${escapeHtml(siteUrl)}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

/**
 * E-mail D+7: nudge de recompra — "Garanta seu próximo ciclo".
 */
export async function sendD7ReorderEmail(
  params: SendSequenceEmailParams,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn("[EMAIL] RESEND_API_KEY não configurada. D+7 não enviado.");
    return { success: false, error: "RESEND_API_KEY não configurada." };
  }
  try {
    const html = generateD7Html(params);
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.customerEmail,
      subject: "Seu próximo ciclo VIOS — mantenha os resultados",
      html,
    });
    if (error) {
      console.error("[EMAIL] D+7 error:", error);
      return { success: false, error: String(error.message ?? error) };
    }
    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[EMAIL] sendD7ReorderEmail error:", err);
    return { success: false, error: message };
  }
}

// ============================================================================
// ABANDONO DE CHECKOUT
// ============================================================================

export interface SendAbandonEmailParams {
  customerEmail: string;
  cartItems?: Array<{ name: string; quantity: number; price: number }> | null;
  siteUrl?: string;
}

function generateAbandonHtml(params: SendAbandonEmailParams): string {
  const siteUrl =
    params.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://vioslabs.com.br";
  const checkoutUrl = `${siteUrl}/checkout`;

  const itemsBlock =
    params.cartItems && params.cartItems.length > 0
      ? `
    <div style="background:rgba(27,43,34,0.04);border:0.5px solid ${BORDER};border-radius:4px;padding:20px 24px;margin:0 0 28px 0;">
      <p style="margin:0 0 12px 0;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${TEXT};opacity:0.7;">Itens no carrinho</p>
      ${params.cartItems
        .map(
          (item) =>
            `<p style="margin:0 0 6px 0;font-size:14px;color:${TEXT};">${escapeHtml(item.name)} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}</p>`,
        )
        .join("")}
    </div>`
      : "";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu carrinho está esperando — VIOS Labs</title>
</head>
<body style="margin:0;padding:0;font-family:sans-serif;background-color:${BACKGROUND};color:${TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BACKGROUND};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:${BACKGROUND};border-radius:4px;border:1px solid ${BORDER};overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="padding:32px 40px;text-align:center;border-bottom:1px solid ${BORDER};">
            <h1 style="margin:0;font-size:22px;font-weight:300;letter-spacing:0.1em;text-transform:uppercase;color:${TEXT};">VIOS LABS</h1>
            <div style="width:28px;height:1px;background:${GOLD};margin:10px auto;"></div>
            <p style="margin:0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${TEXT};opacity:0.7;">Seu carrinho está esperando</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:${TEXT};">
              Você deixou alguns itens no carrinho.
            </p>
            <p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:${TEXT};">
              A ciência da longevidade começa com uma escolha. Seus produtos ainda estão disponíveis — mas o estoque é limitado.
            </p>
            ${itemsBlock}
            <!-- CTA principal -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${escapeHtml(checkoutUrl)}" style="display:inline-block;padding:14px 32px;background-color:${TEXT};color:${BACKGROUND};text-decoration:none;font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;border-radius:4px;">
                  Retomar meu pedido
                </a>
              </td></tr>
            </table>
            <!-- Separador -->
            <div style="border-top:1px solid ${BORDER};margin:28px 0;"></div>
            <p style="margin:0;font-size:13px;line-height:1.6;color:${TEXT};opacity:0.75;">
              Dúvidas sobre os produtos? Fale com nossa equipe pelo
              <a href="https://wa.me/5511952136713" style="color:${TEXT};text-decoration:underline;">WhatsApp</a>
              ou pelo e-mail <a href="mailto:atendimento@vioslabs.com.br" style="color:${TEXT};text-decoration:underline;">atendimento@vioslabs.com.br</a>.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;border-top:1px solid ${BORDER};">
            <p style="margin:0 0 8px 0;font-size:11px;color:${TEXT};opacity:0.7;">VIOS LABS · A Ciência da Longevidade</p>
            <p style="margin:0;font-size:11px;color:${TEXT};opacity:0.6;">
              <a href="${escapeHtml(siteUrl)}/privacidade" style="color:${TEXT};text-decoration:underline;">Privacidade</a>
              &nbsp;·&nbsp;
              <a href="${escapeHtml(siteUrl)}" style="color:${TEXT};text-decoration:underline;">${escapeHtml(siteUrl)}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

/**
 * E-mail de recuperação de carrinho abandonado.
 * Enviado 1h após o cliente preencher o e-mail no checkout sem finalizar o pedido.
 */
export async function sendAbandonEmail(
  params: SendAbandonEmailParams,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn("[EMAIL] RESEND_API_KEY não configurada. Abandono não enviado.");
    return { success: false, error: "RESEND_API_KEY não configurada." };
  }
  try {
    const html = generateAbandonHtml(params);
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.customerEmail,
      subject: "Seu carrinho VIOS está esperando por você",
      html,
    });
    if (error) {
      console.error("[EMAIL] Abandon error:", error);
      return { success: false, error: String(error.message ?? error) };
    }
    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[EMAIL] sendAbandonEmail error:", err);
    return { success: false, error: message };
  }
}

// ============================================================================
// PASSWORD RESET (senha temporária)
// ============================================================================

export interface SendPasswordResetParams {
  to: string;
  tempPassword: string;
}

function generatePasswordResetHtml(params: SendPasswordResetParams): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://vioslabs.com.br";
  const loginUrl = `${siteUrl}/login`;
  const profileUrl = `${siteUrl}/profile`;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Acesso — VIOS Labs</title>
</head>
<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: ${BACKGROUND}; color: ${TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BACKGROUND}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${BACKGROUND}; border-radius: 4px; border: 1px solid ${BORDER}; overflow: hidden;">
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-bottom: 1px solid ${BORDER};">
              <h1 style="margin: 0; font-size: 22px; font-weight: 300; letter-spacing: 0.1em; text-transform: uppercase; color: ${TEXT};">VIOS LABS</h1>
              <p style="margin: 12px 0 0 0; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: ${TEXT}; opacity: 0.7;">
                Recuperação de Acesso
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: ${TEXT};">
                Você solicitou a redefinição de senha. Segue sua senha temporária:
              </p>
              <div style="background: rgba(27,43,34,0.08); border: 1px solid ${BORDER}; border-radius: 4px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: ${TEXT}; opacity: 0.7;">Senha temporária</p>
                <p style="margin: 0; font-size: 18px; font-family: monospace; letter-spacing: 0.1em; color: ${TEXT}; word-break: break-all;">${escapeHtml(params.tempPassword)}</p>
              </div>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: ${TEXT};">
                Faça login com esta senha e altere-a em <strong>Perfil</strong> por uma senha de sua escolha.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                <tr><td align="center">
                  <a href="${escapeHtml(loginUrl)}" style="display: inline-block; padding: 14px 28px; background-color: ${TEXT}; color: ${BACKGROUND}; text-decoration: none; font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 4px;">
                    Fazer Login
                  </a>
                </td></tr>
              </table>
              <p style="margin: 24px 0 0 0; font-size: 12px; color: ${TEXT}; opacity: 0.7;">
                Após o login, acesse <a href="${escapeHtml(profileUrl)}" style="color: ${TEXT}; text-decoration: underline;">Meu Perfil</a> para alterar sua senha.
              </p>
              <p style="margin: 24px 0 0 0; font-size: 11px; color: ${TEXT}; opacity: 0.6;">
                Se você não solicitou esta alteração, ignore este e-mail. Sua conta continua segura.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; text-align: center; border-top: 1px solid ${BORDER};">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: ${TEXT}; opacity: 0.7;">VIOS LABS</p>
              <p style="margin: 0; font-size: 11px; color: ${TEXT}; opacity: 0.6;">Dúvidas? Acesse <a href="${escapeHtml(siteUrl)}" style="color: ${TEXT}; text-decoration: underline;">${escapeHtml(siteUrl)}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Envia e-mail com senha temporária para recuperação de acesso.
 */
export async function sendPasswordResetEmail(
  params: SendPasswordResetParams
): Promise<{ success: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn("[EMAIL] RESEND_API_KEY não configurada.");
    return { success: false, error: "E-mail não configurado." };
  }

  try {
    const html = generatePasswordResetHtml(params);
    const resend = getResendClient();

    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.to,
      subject: "Recuperação de Acesso — VIOS Labs",
      html,
    });

    if (error) {
      console.error("[EMAIL] Password reset error:", error);
      return { success: false, error: String(error.message ?? error) };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[EMAIL] sendPasswordResetEmail error:", err);
    return { success: false, error: message };
  }
}
