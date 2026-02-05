/**
 * Configuração compartilhada de checkout — VIOS Labs
 * Frete, desconto PIX e limites (usado na página de checkout e na API).
 */

export const FREE_SHIPPING_THRESHOLD = 289.9;
export const PIX_DISCOUNT_PERCENT = 0.05; // 5% no PIX
export const MAX_INSTALLMENTS = 3;

/** Cupom de teste (produção): 100% de desconto no subtotal. Uso apenas para testes. */
export const COUPON_CODE_TESTE90 = "TESTE90";
export const COUPON_TESTE90_DISCOUNT_PERCENT = 1;

/** Fuso horário para expiração e exibição do PIX (Brasil) */
export const PIX_TIMEZONE = "America/Sao_Paulo";

/** Validade do QR Code PIX em segundos (1 hora) */
export const PIX_EXPIRATION_SECONDS = 3600;

/**
 * Retorna o Unix timestamp (segundos) de expiração do PIX: agora + PIX_EXPIRATION_SECONDS.
 * Para exibição ao usuário, formate com PIX_TIMEZONE (America/Sao_Paulo).
 */
export function getPixExpiresAt(): number {
  return Math.floor(Date.now() / 1000) + PIX_EXPIRATION_SECONDS;
}

/**
 * Formata um Unix timestamp (segundos) em data/hora no fuso America/Sao_Paulo.
 */
export function formatPixExpirationInSaoPaulo(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString("pt-BR", {
    timeZone: PIX_TIMEZONE,
    dateStyle: "short",
    timeStyle: "medium",
  });
}
