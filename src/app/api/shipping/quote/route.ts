import { NextResponse } from "next/server";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/checkout-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

/** Dimensões padrão para suplementos VIOS (em cm e kg) */
const DEFAULT_WEIGHT_KG = 0.3;
const DEFAULT_WIDTH_CM = 11;
const DEFAULT_HEIGHT_CM = 17;
const DEFAULT_LENGTH_CM = 11;

/** CEP de origem padrão (São Paulo - Av. Paulista) */
const DEFAULT_ORIGIN_CEP = "01310100";

function getOriginPostalCode(): string {
  const raw =
    process.env.MELHOR_ENVIO_ORIGIN_POSTAL_CODE?.trim() || DEFAULT_ORIGIN_CEP;
  const digits = raw.replace(/\D/g, "");
  return digits.length === 8 ? digits : DEFAULT_ORIGIN_CEP.replace(/\D/g, "");
}

interface CartItemInput {
  id: string;
  quantity: number;
  price: number;
  isKit?: boolean;
  kitProducts?: string[];
}

interface QuoteRequest {
  postalCode: string;
  cartItems: CartItemInput[];
}

interface MelhorEnvioProduct {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
}

export interface ShippingQuoteOption {
  id: string;
  name: string;
  price: number;
  deliveryTime: number;
  deliveryRange: { min: number; max: number };
  company: { id: number; name: string };
  type: "standard" | "express";
}

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

function buildProductsFromCart(cartItems: CartItemInput[]): MelhorEnvioProduct[] {
  return cartItems.map((item, idx) => {
    const units =
      item.isKit && item.kitProducts?.length
        ? item.kitProducts.length * item.quantity
        : item.quantity;
    const weight = Math.max(0.1, DEFAULT_WEIGHT_KG * units);
    const insuranceValue = item.price * item.quantity;
    const productId =
      typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : `item_${idx}`;
    return {
      id: productId,
      width: DEFAULT_WIDTH_CM,
      height: DEFAULT_HEIGHT_CM,
      length: DEFAULT_LENGTH_CM,
      weight: Math.round(weight * 100) / 100,
      insurance_value: Math.round(insuranceValue * 100) / 100,
      quantity: 1,
    };
  });
}

export async function POST(req: Request) {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token?.trim()) {
    return NextResponse.json(
      {
        error: "Integração Melhor Envio não configurada.",
        quotes: null,
      },
      { status: 503 },
    );
  }

  let body: QuoteRequest;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json(
        { error: "Corpo inválido. Envie postalCode e cartItems." },
        { status: 400 },
      );
    }
    body = parsed as QuoteRequest;
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido ou não é JSON." },
      { status: 400 },
    );
  }

  const postalCode = onlyDigits(body.postalCode ?? "");
  if (postalCode.length !== 8) {
    return NextResponse.json(
      { error: "CEP deve ter 8 dígitos." },
      { status: 400 },
    );
  }

  const cartItems = body.cartItems;
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return NextResponse.json(
      { error: "Sacola vazia. Adicione itens para calcular o frete." },
      { status: 400 },
    );
  }

  const validCartItems = cartItems.filter(
    (i) =>
      i &&
      typeof i === "object" &&
      typeof i.price === "number" &&
      Number.isFinite(i.price) &&
      i.price > 0 &&
      typeof i.quantity === "number" &&
      Number.isInteger(i.quantity) &&
      i.quantity > 0,
  );
  if (validCartItems.length === 0) {
    return NextResponse.json(
      { error: "Itens da sacola inválidos para cálculo de frete." },
      { status: 400 },
    );
  }

  const products = buildProductsFromCart(validCartItems);
  const subtotal = validCartItems.reduce(
    (acc, i) => acc + i.price * i.quantity,
    0,
  );
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  const baseUrl =
    process.env.MELHOR_ENVIO_SANDBOX === "true"
      ? "https://sandbox.melhorenvio.com.br"
      : "https://www.melhorenvio.com.br";

  const originCep = getOriginPostalCode();

  const payload = {
    from: { postal_code: originCep },
    to: { postal_code: postalCode },
    products,
    options: {
      receipt: false,
      own_hand: false,
    },
  };

  try {
    const res = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const raw = (await res.json().catch(() => ({}))) as unknown;

    if (!res.ok) {
      let errMsg = "Não foi possível calcular o frete. Verifique o CEP.";
      if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        const errors = obj.errors as Record<string, string[]> | undefined;
        if (errors?.["from.postal_code"]?.[0]) {
          errMsg = `CEP de origem inválido. Cadastre seu endereço em Configurações → Entrega no painel Melhor Envio (${originCep}).`;
        } else if (typeof obj.message === "string") {
          errMsg = obj.message;
        } else if (typeof obj.error === "string") {
          errMsg = obj.error;
        } else if (Array.isArray(obj.errors)) {
          const first = obj.errors[0];
          errMsg =
            typeof first === "string"
              ? first
              : first && typeof first === "object" && typeof (first as { message?: string }).message === "string"
                ? (first as { message: string }).message
                : errMsg;
        }
      }
      console.error("[MELHOR_ENVIO] API error:", res.status, JSON.stringify(raw));
      return NextResponse.json(
        { error: errMsg, quotes: null },
        { status: res.status >= 500 ? 502 : 400 },
      );
    }

    // Melhor Envio pode retornar array direto ou objeto com chave (data, purchase, etc.)
    const data = raw as Record<string, unknown> | unknown[];
    let results: unknown[] = [];
    if (Array.isArray(data)) {
      results = data;
    } else if (data && typeof data === "object") {
      const arr = (data as Record<string, unknown>).data ??
        (data as Record<string, unknown>).purchase ??
        (data as Record<string, unknown>).quotes;
      results = Array.isArray(arr) ? arr : [];
    }
    interface RawQuote {
      id?: number | string;
      name?: string;
      price?: number;
      delivery_time?: number;
      company?: { id?: number; name?: string };
    }

    const quotesParsed = (results as RawQuote[])
      .map((r) => {
        const price = Number(r?.price ?? 0);
        const deliveryTime = Number(r?.delivery_time ?? 0);
        if (!Number.isFinite(price) || price <= 0) return null;
        return {
          id: String(r?.id ?? ""),
          name: String(r?.name ?? "Entrega"),
          price: Math.round(price * 100) / 100,
          deliveryTime,
          deliveryRange: { min: deliveryTime, max: deliveryTime + 2 },
          company: {
            id: Number(r?.company?.id ?? 0),
            name: String(r?.company?.name ?? ""),
          },
        };
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);

    if (quotesParsed.length === 0) {
      return NextResponse.json({
        quotes: null,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        isFreeShipping,
        subtotal,
        message: "Nenhuma opção de frete disponível para este CEP.",
      });
    }

    const byPrice = [...quotesParsed].sort((a, b) => a.price - b.price);
    const byTime = [...quotesParsed].sort((a, b) => a.deliveryTime - b.deliveryTime);

    const standard = byPrice[0]
      ? {
          ...byPrice[0],
          type: "standard" as const,
        }
      : null;
    const express = byTime[0] && byTime[0].id !== standard?.id
      ? { ...byTime[0], type: "express" as const }
      : quotesParsed.find((p) => p.deliveryTime < (standard?.deliveryTime ?? 999))
        ? { ...byTime[0], type: "express" as const }
        : null;

    const options: ShippingQuoteOption[] = [];
    if (standard) options.push(standard);
    if (express && express.id !== standard?.id) options.push(express);
    if (options.length === 0 && quotesParsed[0]) {
      options.push({ ...quotesParsed[0], type: "standard" });
    }

    return NextResponse.json({
      quotes: options,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      isFreeShipping,
      subtotal,
    });
  } catch (err) {
    console.error("[MELHOR_ENVIO] Quote error:", err);
    return NextResponse.json(
      {
        error: "Erro ao consultar frete. Tente novamente em instantes.",
        quotes: null,
      },
      { status: 500 },
    );
  }
}
