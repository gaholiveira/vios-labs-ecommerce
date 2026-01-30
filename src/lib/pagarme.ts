/**
 * Cliente Pagar.me API v5 — VIOS Labs
 * Checkout transparente: criação de pedidos com PIX ou cartão (token em credit_card.card.token).
 * Nunca trafegar dados abertos do cartão no servidor.
 *
 * Chaves:
 * - Frontend (criptografia/tokenização): Public Key (pk_test_... ou pk_live_...) via NEXT_PUBLIC_PAGARME_PUBLIC_KEY.
 * - Backend (criação de pedidos): Secret Key (sk_test_... ou sk_live_...) via PAGARME_SECRET_KEY.
 */

const PAGARME_API_BASE = "https://api.pagar.me/core/v5";

// ============================================================================
// AMBIENTE — produção vs desenvolvimento
// ============================================================================

/**
 * Retorna true quando a aplicação está em produção.
 * Considera NODE_ENV e VERCEL_ENV (Vercel).
 */
export function isProduction(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.VERCEL_ENV === "production") return true;
  return false;
}

/**
 * Public Key (pk_...) — usada apenas no frontend para geração do token (tokenizecard.js).
 * Nunca use a Secret Key no cliente.
 */
export function getPublicKey(): string {
  const key = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY?.trim() ?? "";
  return key;
}

/**
 * Retorna true se a Public Key está configurada (para uso no frontend).
 */
export function isPublicKeyConfigured(): boolean {
  return Boolean(getPublicKey());
}

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
  /** CPF ou CNPJ — apenas dígitos (API v5 exige formato rigoroso) */
  document: string;
  /** Pessoa física: 'individual'; PJ: 'company' */
  type: "individual" | "company";
  address?: PagarmeAddress;
  /** DDI (country_code) e DDD (area_code) separados conforme SDK pagarmecore */
  phones?: {
    mobile_phone?: {
      country_code: string;
      area_code: string;
      number: string;
    };
  };
}

/** Dados mínimos do formulário de checkout para montar o customer (API v5) */
export interface CheckoutFormCustomerInput {
  email: string;
  cpf: string;
  phone: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  fullName?: string;
  name?: string;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Monta o objeto customer para a API Pagar.me v5 com campos fiscais rigorosos:
 * - document: apenas números (CPF 11 dígitos)
 * - type: 'individual'
 * - phones: DDI (country_code) e DDD (area_code) separados conforme SDK pagarmecore
 */
export function buildPagarmeCustomer(
  input: CheckoutFormCustomerInput,
  address: PagarmeAddress,
): PagarmeCustomer {
  // CPF: apenas dígitos (sem pontos ou traços) — obrigatório em produção
  const doc = onlyDigits(String(input.cpf ?? ""));
  if (doc.length !== 11) {
    throw new Error(
      "CPF deve conter 11 dígitos (apenas números). Pagar.me v5 exige document rigoroso.",
    );
  }

  const phoneDigits = onlyDigits(input.phone);
  const mobile =
    phoneDigits.length >= 10
      ? {
          country_code: "55" as const,
          area_code: phoneDigits.slice(0, 2),
          number: phoneDigits.slice(2),
        }
      : undefined;

  const name =
    (input.fullName ?? input.name)?.trim() || "Cliente VIOS";

  // E-mail: válido, trim e lowercase — obrigatório em produção
  const email = String(input.email ?? "").trim().toLowerCase();
  if (!email || email.length < 5 || !email.includes("@")) {
    throw new Error(
      "E-mail válido é obrigatório para o checkout. Pagar.me v5 exige customer.email.",
    );
  }

  return {
    name,
    email,
    document: doc,
    type: "individual",
    address,
    phones: mobile ? { mobile_phone: mobile } : undefined,
  };
}

/**
 * Monta o endereço no formato Pagar.me v5 a partir do formulário de checkout.
 */
export function buildPagarmeAddress(input: {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}): PagarmeAddress {
  return {
    line_1: [input.street.trim(), input.number.trim()]
      .filter(Boolean)
      .join(", "),
    line_2: input.complement?.trim() || undefined,
    zip_code: onlyDigits(input.cep),
    city: input.city.trim(),
    state: input.state.trim().toUpperCase().slice(0, 2),
    country: "BR",
  };
}

/** Pagamento PIX — objeto pix obrigatório na API v5 */
export interface PagarmePaymentPix {
  payment_method: "pix";
  pix: {
    /** Tempo até expiração em segundos (ex.: 3600 = 1h). Opcional se enviar expires_at. */
    expires_in?: number;
    /** Data/hora de expiração em Unix timestamp (segundos). Preferir quando usar fuso America/Sao_Paulo para consistência. */
    expires_at?: number;
  };
}

/** Pagamento cartão — API v5 pagarmecore: token gerado no front (tokenizecard + pk_...); nunca dados abertos */
export interface PagarmePaymentCreditCard {
  payment_method: "credit_card";
  credit_card: {
    card: { token: string };
    installments: number;
    statement_descriptor?: string;
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
// CLIENT — backend usa apenas Secret Key
// ============================================================================

/**
 * Secret Key (sk_...) — usada apenas no backend para chamadas à API Pagar.me.
 * Nunca exponha no frontend (não use NEXT_PUBLIC_ para a secret).
 */
function getSecretKey(): string {
  const key = process.env.PAGARME_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "Missing PAGARME_SECRET_KEY. Configure no .env para usar checkout Pagar.me.",
    );
  }
  if (isProduction() && key.startsWith("sk_test_")) {
    console.warn(
      "[Pagar.me] Produção detectada mas PAGARME_SECRET_KEY parece ser de teste (sk_test_). Use sk_live_ em produção.",
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
 * - Cartão: envia credit_card.card.token; retorna pedido com status da cobrança.
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
    // Log completo (dev e produção) para diagnosticar Chave Inválida / Dados Incompletos
    console.error("[PAGARME] API error response:", {
      status: res.status,
      message: data.message,
      errors: data.errors,
      full: JSON.stringify(data, null, 2),
    });
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

/** True se o valor for código EMV (copia-e-cola PIX), não base64 de imagem */
function isEmvString(value: string): boolean {
  const t = value.trim();
  return t.startsWith("0002") || t.startsWith("000201");
}

/** Extrai qr_code, qr_code_url e código copia-e-cola de last_transaction ou objeto similar */
export function extractPixFromTransaction(
  tx: PagarmePixTransaction | Record<string, unknown> | null | undefined,
): ExtractedPixData {
  if (!tx || typeof tx !== "object")
    return { qr_code: null, qr_code_url: null, pix_copy_paste: null };
  const o = tx as Record<string, unknown>;
  // Valor bruto do campo qr_code (algumas APIs devolvem EMV aqui em vez de base64)
  const rawQrCode = pickString(
    o,
    "qr_code",
    "qr_code_base64",
    "pix_qr_code",
    "qr_code_image",
  );
  const qr_code = rawQrCode && !isEmvString(rawQrCode) ? rawQrCode : null;
  // URL do QR / link para pagar
  const qr_code_url =
    pickString(o, "qr_code_url", "qr_code_link", "pix_qr_code_url", "link") ??
    null;
  // Código copia-e-cola (EMV) — pode vir em emv/qr_code_text ou no próprio qr_code
  const pix_copy_paste =
    pickString(o, "emv", "qr_code_text", "pix_copy_paste", "copy_paste") ??
    (rawQrCode && isEmvString(rawQrCode) ? rawQrCode : null);
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
