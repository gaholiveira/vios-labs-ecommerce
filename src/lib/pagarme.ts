/**
 * Cliente Pagar.me API v5 — VIOS Labs
 * Checkout transparente: criação de pedidos com PIX ou cartão (card_token).
 * Nunca trafegar dados abertos do cartão no servidor.
 */

const PAGARME_API_BASE = "https://api.pagar.me/core/v5";

// ============================================================================
// TIPOS — Request/Response mínimos para criação de pedido
// ============================================================================

export interface PagarmeOrderItem {
  amount: number; // centavos
  description: string;
  quantity: number;
  code?: string;
}

export interface PagarmeAddress {
  line_1: string;
  line_2?: string;
  zip_code: string;
  city: string;
  state: string;
  country: string;
}

export interface PagarmeCustomer {
  name: string;
  email: string;
  document: string; // CPF ou CNPJ (apenas números)
  type: "individual" | "company";
  address?: PagarmeAddress;
  phones?: {
    mobile_phone?: {
      country_code: string;
      area_code: string;
      number: string;
    };
  };
}

/** Pagamento PIX — objeto pix obrigatório na API v5; expires_in em minutos */
export interface PagarmePaymentPix {
  payment_method: "pix";
  pix: {
    /** Tempo até expiração do QR code, em minutos (ex.: 30) */
    expires_in?: number;
    /** Ou data/hora de expiração em Unix timestamp */
    expires_at?: number;
  };
}

/** Pagamento cartão — usar card_token (tokenizecard.js); nunca dados abertos */
export interface PagarmePaymentCreditCard {
  payment_method: "credit_card";
  credit_card: {
    installments: number;
    statement_descriptor?: string;
    card_token: string;
  };
}

export type PagarmePayment = PagarmePaymentPix | PagarmePaymentCreditCard;

export interface PagarmeCreateOrderRequest {
  items: PagarmeOrderItem[];
  customer: PagarmeCustomer;
  payments: PagarmePayment[];
  /** Código único do pedido (ex.: para idempotência ou link com reserva) */
  code?: string;
  /** Moeda (ex.: BRL) */
  currency?: string;
  metadata?: Record<string, string>;
}

// ============================================================================
// RESPONSE — Estrutura mínima retornada pela API ao criar pedido
// ============================================================================

/** Dados PIX possíveis na last_transaction (API pode usar nomes diferentes) */
export interface PagarmePixTransaction {
  qr_code?: string;
  qr_code_url?: string;
  emv?: string;
  /** Algumas versões retornam QR em base64 com outro nome */
  [key: string]: unknown;
}

export interface PagarmeOrderResponse {
  id: string;
  code: string;
  amount: number;
  status: string;
  charges?: Array<{
    id: string;
    code: string;
    amount: number;
    status: string;
    payment_method: string;
    last_transaction?: PagarmePixTransaction;
  }>;
}

export interface PagarmeChargeResponse {
  id: string;
  code: string;
  amount: number;
  status: string;
  payment_method: string;
  last_transaction?: PagarmePixTransaction;
}

// ============================================================================
// CLIENT
// ============================================================================

function getSecretKey(): string {
  const key = process.env.PAGARME_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Missing PAGARME_SECRET_KEY. Configure no .env para usar checkout Pagar.me.",
    );
  }
  return key;
}

/**
 * Cliente HTTP para Pagar.me API v5.
 * Autenticação: Basic com secret key (base64).
 */
function getAuthHeader(): string {
  const secret = getSecretKey();
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

/**
 * Cria um pedido no Pagar.me (API v5).
 * - PIX: retorna o pedido com charge contendo qr_code / qr_code_url.
 * - Cartão: envia card_token; retorna pedido com status da cobrança.
 */
export async function createOrder(
  body: PagarmeCreateOrderRequest,
): Promise<PagarmeOrderResponse> {
  const res = await fetch(`${PAGARME_API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as PagarmeOrderResponse & {
    message?: string;
    errors?: Record<string, string[] | string>;
  };

  if (!res.ok) {
    // Log completo em dev para debugar validação da API
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[PAGARME] API error response:",
        JSON.stringify(data, null, 2),
      );
    }
    const errorsStr =
      data.errors && typeof data.errors === "object"
        ? Object.entries(data.errors)
            .map(
              ([k, v]) =>
                `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`,
            )
            .join("; ")
        : undefined;
    const message =
      data.message || errorsStr || `Pagar.me API error ${res.status}`;
    throw new Error(message);
  }

  return data as PagarmeOrderResponse;
}

/**
 * Obtém uma cobrança pelo ID (útil para PIX: às vezes o QR vem só ao consultar a charge).
 */
export async function getCharge(
  chargeId: string,
): Promise<PagarmeChargeResponse> {
  const res = await fetch(`${PAGARME_API_BASE}/charges/${chargeId}`, {
    method: "GET",
    headers: { Authorization: getAuthHeader() },
  });
  const data = (await res.json().catch(() => ({}))) as PagarmeChargeResponse & {
    message?: string;
    errors?: Record<string, string[] | string>;
  };
  if (!res.ok) {
    const msg = data.message || `Pagar.me getCharge error ${res.status}`;
    throw new Error(msg);
  }
  return data as PagarmeChargeResponse;
}

/** Retorno da extração PIX: QR, URL e código copia-e-cola (EMV) */
export interface ExtractedPixData {
  qr_code: string | null;
  qr_code_url: string | null;
  /** Código PIX para copiar e colar no app do banco (EMV) */
  pix_copy_paste: string | null;
}

/** Extrai string de um objeto (vários nomes possíveis da API Pagar.me) */
function pickString(
  obj: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

/** Extrai qr_code, qr_code_url e código copia-e-cola de last_transaction ou objeto similar */
export function extractPixFromTransaction(
  tx: PagarmePixTransaction | Record<string, unknown> | null | undefined,
): ExtractedPixData {
  if (!tx || typeof tx !== "object")
    return { qr_code: null, qr_code_url: null, pix_copy_paste: null };
  const o = tx as Record<string, unknown>;
  // QR code (base64): vários nomes possíveis
  const qr_code =
    pickString(
      o,
      "qr_code",
      "qr_code_base64",
      "pix_qr_code",
      "qr_code_image",
    ) ?? null;
  // URL do QR / link para pagar
  const qr_code_url =
    pickString(o, "qr_code_url", "qr_code_link", "pix_qr_code_url", "link") ??
    null;
  // Código copia-e-cola (EMV)
  const pix_copy_paste =
    pickString(o, "emv", "qr_code_text", "pix_copy_paste", "copy_paste") ??
    null;
  return { qr_code, qr_code_url, pix_copy_paste };
}

/** Extrai PIX do objeto charge (last_transaction + possíveis campos no topo da charge) */
export function extractPixFromCharge(
  charge:
    | PagarmeChargeResponse
    | {
        last_transaction?: PagarmePixTransaction | null;
        [key: string]: unknown;
      }
    | null
    | undefined,
): ExtractedPixData {
  const base = { qr_code: null, qr_code_url: null, pix_copy_paste: null };
  if (!charge || typeof charge !== "object") return base;
  const fromTx = extractPixFromTransaction(charge.last_transaction);
  const o = charge as Record<string, unknown>;
  // Algumas respostas colocam PIX no topo da charge
  const qr_code = fromTx.qr_code ?? pickString(o, "qr_code", "qr_code_base64");
  const qr_code_url = fromTx.qr_code_url ?? pickString(o, "qr_code_url");
  const pix_copy_paste =
    fromTx.pix_copy_paste ?? pickString(o, "emv", "qr_code_text");
  const pix = o.pix;
  if (pix && typeof pix === "object" && !Array.isArray(pix)) {
    const fromPix = extractPixFromTransaction(pix as Record<string, unknown>);
    return {
      qr_code: qr_code ?? fromPix.qr_code,
      qr_code_url: qr_code_url ?? fromPix.qr_code_url,
      pix_copy_paste: pix_copy_paste ?? fromPix.pix_copy_paste,
    };
  }
  return { qr_code, qr_code_url, pix_copy_paste };
}

/**
 * Verifica se o checkout Pagar.me está configurado (secret key presente).
 */
export function isPagarmeConfigured(): boolean {
  return Boolean(process.env.PAGARME_SECRET_KEY);
}
