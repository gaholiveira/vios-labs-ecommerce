/**
 * Configuração compartilhada de checkout — VIOS Labs
 * Frete, desconto PIX e limites (usado na página de checkout e na API).
 */

export const FREE_SHIPPING_THRESHOLD = 289.9;
export const PIX_DISCOUNT_PERCENT = 0.1; // 10% no PIX

/**
 * Frete local (entrega mesmo dia na nossa cidade).
 * CEPs que começam com LOCAL_DELIVERY_CEP_PREFIX recebem opção a R$ LOCAL_DELIVERY_PRICE.
 * Ex: LOCAL_DELIVERY_CEP_PREFIX=14409 (Franca/SP), LOCAL_DELIVERY_PRICE=10
 */
export const LOCAL_DELIVERY_CEP_PREFIX =
  process.env.LOCAL_DELIVERY_CEP_PREFIX?.trim()?.replace(/\D/g, "") ?? "";
/** Valor do frete local em reais. 0 = grátis. Padrão: 0 (grátis). */
export const LOCAL_DELIVERY_PRICE =
  Number(process.env.LOCAL_DELIVERY_PRICE?.trim()) || 0;
export const MAX_INSTALLMENTS = 3;

/**
 * Exibe "Poucas unidades" quando available_quantity <= este valor (e > 0).
 * Útil para criar urgência mesmo com estoque (ex: 100 unidades, threshold 150).
 */
export const LOW_STOCK_DISPLAY_THRESHOLD =
  Number(process.env.LOW_STOCK_DISPLAY_THRESHOLD?.trim()) || 150;

/** Exibe "Últimas unidades!" quando available_quantity <= este valor. */
export const LAST_UNITS_THRESHOLD = 5;

/** Exibe "Apenas X unidades" quando available_quantity <= este valor (e > LAST_UNITS_THRESHOLD). */
export const FEW_UNITS_THRESHOLD = 15;

/** Cupom de teste (produção): 100% de desconto no subtotal. Uso apenas para testes. */
export const COUPON_CODE_TESTE90 = "TESTE90";
export const COUPON_TESTE90_DISCOUNT_PERCENT = 1;

/** Cupom primeira compra: 10% no subtotal. Soma com desconto PIX. Uso único por cliente. */
export const COUPON_CODE_SOUVIOS = "SOUVIOS";
export const COUPON_SOUVIOS_DISCOUNT_PERCENT = 0.1;

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
