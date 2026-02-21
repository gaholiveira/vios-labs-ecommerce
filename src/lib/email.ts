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
