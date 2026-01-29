import { MercadoPagoConfig, Preference } from "mercadopago";

/**
 * Cliente Mercado Pago para uso no servidor (API Routes, Server Components, etc.)
 * Este cliente usa a chave de acesso (MERCADOPAGO_ACCESS_TOKEN) e não deve ser exposto ao cliente
 *
 * Nota: A verificação da variável de ambiente é feita em runtime para permitir builds
 * sem a chave definida (necessária apenas em produção).
 * O erro será lançado apenas quando o Mercado Pago for realmente usado (em runtime).
 */
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

/**
 * Verifica se o Mercado Pago está configurado
 */
export function isMercadoPagoConfigured(): boolean {
  return (
    !!MERCADOPAGO_ACCESS_TOKEN && MERCADOPAGO_ACCESS_TOKEN.trim().length > 0
  );
}

/**
 * Obtém o cliente Mercado Pago configurado
 * @throws Error se MERCADOPAGO_ACCESS_TOKEN não estiver configurado
 */
export function getMercadoPagoClient(): MercadoPagoConfig {
  const token = MERCADOPAGO_ACCESS_TOKEN;
  if (!token || token.trim().length === 0) {
    throw new Error(
      "Missing MERCADOPAGO_ACCESS_TOKEN environment variable. Please add it to your .env.local file.",
    );
  }

  return new MercadoPagoConfig({
    accessToken: token,
    options: {
      timeout: 30000, // 30 segundos
      idempotencyKey: undefined, // Será definido por requisição quando necessário
    },
  });
}

/**
 * Obtém o cliente de Preferências do Mercado Pago
 * @throws Error se MERCADOPAGO_ACCESS_TOKEN não estiver configurado
 */
export function getMercadoPagoPreferenceClient(): Preference {
  const client = getMercadoPagoClient();
  return new Preference(client);
}

/**
 * Valida se as variáveis de ambiente do Mercado Pago estão configuradas
 * Retorna objeto com status e mensagens de erro (se houver)
 */
export function validateMercadoPagoConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!MERCADOPAGO_ACCESS_TOKEN) {
    errors.push("MERCADOPAGO_ACCESS_TOKEN não configurado");
  } else if (MERCADOPAGO_ACCESS_TOKEN.trim().length === 0) {
    errors.push("MERCADOPAGO_ACCESS_TOKEN está vazio");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
