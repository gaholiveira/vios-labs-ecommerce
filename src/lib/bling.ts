/**
 * Cliente da API Bling v3 - Integração para emissão de NF-e
 * Documentação: https://developer.bling.com.br
 *
 * Fluxo: Pedido pago (Pagar.me) → Criar venda no Bling → Emitir NF-e
 * Token: DB (bling_tokens) com refresh automático; fallback BLING_ACCESS_TOKEN no .env
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const BLING_API_BASE = "https://api.bling.com.br/Api/v3";
const BLING_TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token";

/** Margem em segundos antes de expirar para considerar token como "expirado" e renovar */
const TOKEN_EXPIRY_MARGIN_SEC = 5 * 60; // 5 min

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface BlingTokensRow {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
}

/**
 * Renova o access_token usando refresh_token (DB ou env).
 * Atualiza a tabela bling_tokens quando bem-sucedido.
 */
export async function refreshBlingToken(): Promise<string | null> {
  const clientId = process.env.BLING_CLIENT_ID;
  const clientSecret = process.env.BLING_CLIENT_SECRET;
  if (!clientId?.trim() || !clientSecret?.trim()) {
    console.warn("[BLING] refreshBlingToken: BLING_CLIENT_ID/SECRET ausentes");
    return null;
  }

  const supabase = getSupabaseAdmin();
  let refreshToken: string | null = null;

  if (supabase) {
    const { data } = await supabase
      .from("bling_tokens")
      .select("refresh_token")
      .eq("id", 1)
      .maybeSingle();
    refreshToken = (data as { refresh_token?: string } | null)?.refresh_token ?? null;
  }
  if (!refreshToken?.trim()) {
    refreshToken = process.env.BLING_REFRESH_TOKEN?.trim() ?? null;
  }
  if (!refreshToken) {
    console.warn("[BLING] refreshBlingToken: nenhum refresh_token (DB ou env)");
    return null;
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  }).toString();

  const res = await fetch(BLING_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body,
  });

  const rawText = await res.text();
  let tokenData: Record<string, unknown>;
  try {
    tokenData = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    console.error("[BLING] refreshBlingToken: resposta inválida", rawText.slice(0, 300));
    return null;
  }

  if (!res.ok) {
    console.error("[BLING] refreshBlingToken failed", {
      status: res.status,
      error: tokenData.error,
      error_description: tokenData.error_description,
    });
    return null;
  }

  const accessToken = tokenData.access_token != null ? String(tokenData.access_token) : "";
  const newRefreshToken = tokenData.refresh_token != null ? String(tokenData.refresh_token) : refreshToken;
  const expiresIn = typeof tokenData.expires_in === "number" ? tokenData.expires_in : 6 * 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  if (!accessToken) {
    console.warn("[BLING] refreshBlingToken: Bling não retornou access_token");
    return null;
  }

  if (supabase) {
    const { error } = await supabase
      .from("bling_tokens")
      .upsert(
        {
          id: 1,
          access_token: accessToken,
          refresh_token: newRefreshToken,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    if (error) {
      console.error("[BLING] refreshBlingToken: falha ao salvar tokens no DB", error);
    } else {
      console.log("[BLING] refreshBlingToken: token renovado e salvo no DB");
    }
  }

  return accessToken;
}

/**
 * Retorna um access_token válido: primeiro tenta DB (e renova se expirado), depois env.
 */
export async function getBlingAccessToken(): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const marginMs = TOKEN_EXPIRY_MARGIN_SEC * 1000;

  if (supabase) {
    const { data } = await supabase
      .from("bling_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("id", 1)
      .maybeSingle();

    const row = data as BlingTokensRow | null;
    if (row?.access_token?.trim()) {
      const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
      if (!expiresAt || expiresAt > now.getTime() + marginMs) {
        return row.access_token;
      }
      if (row.refresh_token?.trim()) {
        const refreshed = await refreshBlingToken();
        if (refreshed) return refreshed;
      }
    }
  }

  const envToken = process.env.BLING_ACCESS_TOKEN?.trim();
  if (envToken) return envToken;

  // Sem token no DB: tentar refresh a partir do env (BLING_REFRESH_TOKEN) para popular o DB
  if (supabase || process.env.BLING_REFRESH_TOKEN?.trim()) {
    const refreshed = await refreshBlingToken();
    if (refreshed) return refreshed;
  }

  return null;
}

/**
 * Salva tokens no DB (usado pelo callback OAuth e para bootstrap a partir do env).
 */
export async function saveBlingTokens(
  accessToken: string,
  refreshToken: string,
  expiresInSeconds?: number,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const expiresAt = new Date(
    Date.now() + (expiresInSeconds ?? 6 * 3600) * 1000,
  ).toISOString();
  const { error } = await supabase.from("bling_tokens").upsert(
    {
      id: 1,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) {
    console.error("[BLING] saveBlingTokens:", error);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// SYNC DE PRODUTOS
// ---------------------------------------------------------------------------

export interface BlingCreateProductInput {
  codigo: string;
  nome: string;
  preco: number;
  descricao?: string;
}

export interface BlingCreateProductResult {
  success: boolean;
  blingId?: number;
  error?: string;
}

/**
 * Cria um produto no Bling. Retorna o ID do Bling ou erro.
 */
export async function createProductInBling(
  input: BlingCreateProductInput,
): Promise<BlingCreateProductResult> {
  const token = await getBlingAccessToken();
  if (!token?.trim()) {
    return { success: false, error: "BLING_ACCESS_TOKEN não configurado" };
  }

  const payload = {
    nome: input.nome,
    codigo: input.codigo,
    tipo: "P" as const,
    situacao: "A" as const,
    formato: "S" as const,
    descricao: input.descricao || input.nome,
    preco: input.preco,
  };

  try {
    const res = await fetch(`${BLING_API_BASE}/produtos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
      data?: { id?: number };
      error?: { message?: string };
    };

    if (!res.ok) {
      const msg =
        typeof data.error === "object" && data.error?.message
          ? String(data.error.message)
          : JSON.stringify(data.error ?? data) || `HTTP ${res.status}`;
      return { success: false, error: msg };
    }

    const id = data.data?.id;
    if (typeof id !== "number") {
      return { success: false, error: "Resposta sem id do produto" };
    }

    return { success: true, blingId: id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: msg };
  }
}

/**
 * Busca produto no Bling pelo código (SKU).
 */
export async function findProductByCodigo(
  codigo: string,
): Promise<{ success: boolean; blingId?: number; error?: string }> {
  const token = await getBlingAccessToken();
  if (!token?.trim()) {
    return { success: false, error: "BLING_ACCESS_TOKEN não configurado" };
  }

  try {
    const url = new URL(`${BLING_API_BASE}/produtos`);
    url.searchParams.set("codigo", codigo);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = (await res.json().catch(() => ({}))) as {
      data?: Array<{ id?: number }>;
    };

    const items = data.data;
    if (Array.isArray(items) && items.length > 0 && typeof items[0].id === "number") {
      return { success: true, blingId: items[0].id };
    }
    return { success: false, error: "Produto não encontrado" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: msg };
  }
}

export function isBlingConfigured(): boolean {
  const access = process.env.BLING_ACCESS_TOKEN?.trim();
  const refresh = process.env.BLING_REFRESH_TOKEN?.trim();
  const hasOAuth =
    process.env.BLING_CLIENT_ID?.trim() &&
    process.env.BLING_CLIENT_SECRET?.trim();
  return Boolean(access || refresh || hasOAuth);
}

/** Mapeamento produto VIOS → ID Bling (ex: BLING_PRODUCT_ID_PROD_1=123456) */
function getBlingProductId(ourProductId: string): number | null {
  const key = `BLING_PRODUCT_ID_${ourProductId.toUpperCase().replace(/-/g, "_")}`;
  const val = process.env[key];
  if (!val) return null;
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : null;
}

/** Mapa JSON alternativo: BLING_PRODUCT_MAP={"prod_1":123,"prod_2":456} */
function getBlingProductIdFromMap(ourProductId: string): number | null {
  const raw = process.env.BLING_PRODUCT_MAP;
  if (!raw) return null;
  try {
    const map = JSON.parse(raw) as Record<string, number>;
    const id = map[ourProductId];
    return typeof id === "number" && Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

function resolveBlingProductId(ourProductId: string): number | null {
  return getBlingProductId(ourProductId) ?? getBlingProductIdFromMap(ourProductId);
}

/**
 * Cria ou busca contato no Bling para vincular à venda.
 * A API v3 exige contato.id — não aceita apenas nome/cpf/email.
 * NF-e exige contato com endereço completo (CPF, endereço, número, bairro, CEP, cidade, UF).
 */
async function createOrGetContactInBling(
  token: string,
  customer: { name: string; email: string; document?: string | null; phone?: string | null },
  shipping: {
    zipCode: string;
    street: string;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city: string;
    state: string;
  },
): Promise<number | null> {
  const doc = customer.document?.replace(/\D/g, "").slice(0, 14) || "";
  if (!doc) return null;

  const nome = customer.name?.trim() || "Cliente";
  const email = customer.email?.trim() || "";
  const telefone = customer.phone?.replace(/\D/g, "").slice(0, 11) || undefined;
  const cep = shipping.zipCode.replace(/\D/g, "").slice(0, 8);
  const endereco = shipping.street?.trim() || "S/C";
  const bairro = shipping.neighborhood?.trim() || "S/C";
  const municipio = shipping.city?.trim() || "S/C";
  const uf = shipping.state?.trim().toUpperCase().slice(0, 2) || "SP";
  const numeroEndereco = (shipping.number?.trim() && shipping.number.trim() !== "S/N")
    ? shipping.number.trim()
    : "S/N";
  const payload: Record<string, unknown> = {
    nome,
    cpfCnpj: doc,
    numeroDocumento: doc,
    tipo: doc.length === 11 ? "F" : "J",
    situacao: "A" as const,
    email: email || undefined,
    endereco,
    numero: numeroEndereco,
    numeroEndereco: numeroEndereco,
    complemento: shipping.complement?.trim() || undefined,
    bairro,
    cep,
    municipio,
    uf,
  };
  if (telefone) {
    payload.telefone = telefone;
    payload.celular = telefone;
  }

  console.warn("[BLING] createOrGetContactInBling payload", {
    nome: payload.nome,
    cpfCnpj: payload.cpfCnpj ? `${String(payload.cpfCnpj).slice(0, 3)}***` : undefined,
    numeroDocumento: payload.numeroDocumento ? `${String(payload.numeroDocumento).slice(0, 3)}***` : undefined,
    telefone: payload.telefone ?? undefined,
    celular: payload.celular ?? undefined,
    endereco: payload.endereco,
    numero: payload.numero,
    cep: payload.cep,
  });

  const res = await fetch(`${BLING_API_BASE}/contatos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as {
    data?: { id?: number };
    error?: { message?: string; fields?: Array<{ msg?: string }> };
  };

  if (res.ok && typeof data.data?.id === "number") {
    return data.data.id;
  }

  const errMsg =
    (data.error?.message ?? "") +
    " " +
    (Array.isArray(data.error?.fields)
      ? data.error.fields.map((f) => (f && typeof f === "object" && "msg" in f ? String((f as { msg?: string }).msg) : "")).join(" ")
      : "");
  const cpfJaCadastrado =
    res.status === 400 &&
    (errMsg.toLowerCase().includes("cpf já está cadastrado") ||
      errMsg.toLowerCase().includes("já está cadastrado"));

  let existingId: number | null = null;

  if (
    res.status === 409 ||
    cpfJaCadastrado ||
    errMsg.toLowerCase().includes("já existe")
  ) {
    type ContactItem = { id?: number; cpfCnpj?: string; numeroDocumento?: string; nome?: string };
    type ContatosResponse = { data?: ContactItem[]; total?: number };

    const searchRes = await fetch(
      `${BLING_API_BASE}/contatos?cpfCnpj=${encodeURIComponent(doc)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const searchData = (await searchRes.json().catch(() => ({}))) as ContatosResponse;
    const list = Array.isArray(searchData.data) ? searchData.data : [];
    let existing: ContactItem | null = list[0] ?? null;

    if (existing?.id == null && cpfJaCadastrado) {
      const match = errMsg.match(/no contato ([^.]+)/i) || errMsg.match(/contato ([^.]+)/i);
      const nomeNoErro = match?.[1]?.trim();
      if (nomeNoErro) {
        const byNameRes = await fetch(
          `${BLING_API_BASE}/contatos?nome=${encodeURIComponent(nomeNoErro)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const byNameData = (await byNameRes.json().catch(() => ({}))) as ContatosResponse;
        const byNameList = Array.isArray(byNameData.data) ? byNameData.data : [];
        existing = byNameList[0] ?? null;
      }
    }

    if (existing?.id == null && list.length === 0 && cpfJaCadastrado) {
      const listRes = await fetch(
        `${BLING_API_BASE}/contatos?pagina=1&limite=100`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const listData = (await listRes.json().catch(() => ({}))) as ContatosResponse;
      const all = Array.isArray(listData.data) ? listData.data : [];
      const byDoc = all.find(
        (c) =>
          (String(c.cpfCnpj ?? "").replace(/\D/g, "") === doc ||
            String(c.numeroDocumento ?? "").replace(/\D/g, "") === doc),
      );
      const nomeNoErro = (errMsg.match(/no contato ([^.]+)/i) || errMsg.match(/contato ([^.]+)/i))?.[1]?.trim();
      const byNome = nomeNoErro
        ? all.find(
            (c) =>
              String(c.nome ?? "")
                .trim()
                .toLowerCase() === nomeNoErro.toLowerCase(),
          )
        : undefined;
      existing = byDoc ?? byNome ?? null;
      console.warn("[BLING] createOrGetContactInBling: busca em lista (fallback)", {
        totalListados: all.length,
        foundByDoc: !!byDoc,
        foundByNome: !!byNome,
        existingId: existing?.id,
      });
    }

    if (existing?.id != null) {
      existingId = existing.id;
      if (cpfJaCadastrado) {
        console.warn("[BLING] createOrGetContactInBling: CPF já cadastrado, usando contato existente", {
          existingId,
        });
      }
    }
  }

  if (existingId != null) {
    const updateRes = await fetch(`${BLING_API_BASE}/contatos/${existingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!updateRes.ok) {
      const updateBody = (await updateRes.json().catch(() => ({}))) as {
        error?: { message?: string; fields?: unknown[] };
      };
      console.warn("[BLING] updateContact failed", {
        contactId: existingId,
        status: updateRes.status,
        error: updateBody.error?.message,
        fields: JSON.stringify(updateBody.error?.fields ?? []),
        body: JSON.stringify(updateBody).slice(0, 500),
      });
    } else {
      console.warn("[BLING] updateContact success", { contactId: existingId });
    }

    return existingId;
  }

  console.warn("[BLING] createOrGetContactInBling failed", {
    status: res.status,
    error: data.error?.message,
    fields: JSON.stringify(data.error?.fields ?? []),
    fullBody: JSON.stringify(data).slice(0, 800),
  });
  return null;
}

export interface BlingCreateSaleInput {
  /** ID do pedido no sistema (referência) */
  orderId: string;
  /** ID do pedido Pagar.me */
  pagarmeOrderId: string;
  /** Valor total em reais */
  totalAmount: number;
  /** Itens do pedido */
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  /** Dados do cliente */
  customer: {
    name: string;
    email: string;
    document?: string | null; // CPF sem pontuação
    phone?: string | null;
  };
  /** Endereço de entrega (obrigatório para NF-e) */
  shipping: {
    zipCode: string;
    street: string;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city: string;
    state: string; // UF 2 caracteres
  };
  /** Se true, solicita emissão de NF-e na criação da venda */
  gerarNotaFiscal?: boolean;
}

export interface BlingCreateSaleResult {
  success: boolean;
  blingSaleId?: number;
  blingNfeId?: number;
  error?: string;
}

/**
 * Cria uma venda no Bling a partir dos dados do pedido.
 * Produtos precisam estar cadastrados no Bling; use BLING_PRODUCT_ID_* ou BLING_PRODUCT_MAP.
 */
export async function createSaleInBling(
  input: BlingCreateSaleInput,
): Promise<BlingCreateSaleResult> {
  const token = await getBlingAccessToken();
  if (!token?.trim()) {
    console.warn("[BLING] createSaleInBling: token ausente (env ou DB)");
    return { success: false, error: "BLING_ACCESS_TOKEN não configurado" };
  }

  const doc = input.customer.document?.replace(/\D/g, "") || "";
  if (!doc) {
    console.warn("[BLING] createSaleInBling: CPF ausente", {
      orderId: input.orderId,
    });
    return {
      success: false,
      error: "CPF do cliente é obrigatório para emissão de NF-e",
    };
  }

  const { city, state } = input.shipping;
  if (!city?.trim() || !state?.trim()) {
    console.warn("[BLING] createSaleInBling: cidade/UF ausentes", {
      orderId: input.orderId,
      city: input.shipping.city,
      state: input.shipping.state,
    });
    return {
      success: false,
      error: "Cidade e UF são obrigatórios para emissão de NF-e",
    };
  }

  const itens: Array<{
    id: number;
    descricao: string;
    quantidade: number;
    valor: number;
  }> = [];

  for (const item of input.items) {
    const blingProdId = resolveBlingProductId(item.productId);
    if (blingProdId == null) {
      return {
        success: false,
        error: `Produto ${item.productId} (${item.productName}) não mapeado para Bling. Configure BLING_PRODUCT_ID_${item.productId.toUpperCase()} ou BLING_PRODUCT_MAP.`,
      };
    }
    itens.push({
      id: blingProdId,
      descricao: item.productName,
      quantidade: item.quantity,
      valor: item.unitPrice,
    });
  }

  const contactId = await createOrGetContactInBling(
    token,
    input.customer,
    input.shipping,
  );
  if (contactId == null) {
    console.warn("[BLING] createSaleInBling: falha ao criar/obter contato");
    return {
      success: false,
      error: "Não foi possível criar ou localizar o contato no Bling",
    };
  }

  const numero = `VIOS-${input.pagarmeOrderId.slice(-8)}`;

  const payload = {
    numero,
    data: new Date().toISOString().split("T")[0],
    dataPrevista: new Date().toISOString().split("T")[0],
    contato: { id: contactId },
    enderecoEntrega: {
      nome: input.customer.name || "Cliente",
      cep: input.shipping.zipCode.replace(/\D/g, "").slice(0, 8),
      endereco: input.shipping.street,
      numero: input.shipping.number || "S/N",
      complemento: input.shipping.complement || undefined,
      bairro: input.shipping.neighborhood || undefined,
      municipio: city,
      uf: state.slice(0, 2).toUpperCase(),
    },
    itens,
    valorTotal: input.totalAmount,
    observacoes: `Pedido VIOS #${input.orderId} | Pagar.me: ${input.pagarmeOrderId}`,
    ...(input.gerarNotaFiscal !== false && { gerarNotaFiscal: true }),
  };

  try {
    console.log("[BLING] createSaleInBling", {
      orderId: input.orderId,
      itemsCount: input.items.length,
      productIds: input.items.map((i) => i.productId),
      totalAmount: input.totalAmount,
    });

    const res = await fetch(`${BLING_API_BASE}/pedidos/vendas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as {
      data?: { id?: number } | Array<{ id?: number; numero?: string }>;
      error?: {
        message?: string;
        type?: string;
        fields?: Array<{ field?: string; message?: string }>;
      };
      errors?: Array<{ field?: string; message?: string }>;
    };

    if (!res.ok) {
      const errObj = data.error;
      const fields = (errObj?.fields ?? data.errors ?? []) as Array<{
        field?: string;
        message?: string;
        element?: string;
        msg?: string;
        code?: number;
      }>;
      const fieldMsgs =
        fields.length > 0
          ? fields
              .map((f) => `${f.element ?? f.field ?? "?"}: ${f.msg ?? f.message ?? String(f)}`)
              .join("; ")
          : null;
      const msg =
        fieldMsgs ??
        errObj?.message ??
        data.errors?.map((e) => e.message).filter(Boolean).join("; ") ??
        `HTTP ${res.status}`;
      console.warn("[BLING] createSaleInBling failed", {
        orderId: input.orderId,
        status: res.status,
        error: msg,
        fields: JSON.stringify(fields),
      });
      return { success: false, error: msg };
    }

    const rawData = data.data;
    const saleId = Array.isArray(rawData) ? rawData[0]?.id : rawData?.id;
    const numero = Array.isArray(rawData) ? rawData[0]?.numero : (rawData as { numero?: string })?.numero;
    console.warn("[BLING] createSaleInBling success", {
      orderId: input.orderId,
      blingSaleId: saleId,
      numero: numero ?? `VIOS-${input.pagarmeOrderId.slice(-8)}`,
      busqueNoBling: `Busque por "VIOS-" ou ID ${saleId} em Vendas > Pedidos`,
    });

    return {
      success: true,
      blingSaleId: typeof saleId === "number" ? saleId : undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[BLING] createSaleInBling exception:", msg);
    return { success: false, error: msg };
  }
}
