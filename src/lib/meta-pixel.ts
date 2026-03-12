/**
 * Meta Pixel (Facebook Pixel) — eventos de e-commerce com Advanced Matching.
 * Usa SHA-256 nativo (Web Crypto API) para hashar e-mail antes de enviar ao Meta.
 * Só dispara quando NEXT_PUBLIC_FB_PIXEL_ID está definido.
 *
 * Eventos implementados:
 *   ViewContent     — visualização de produto ou kit
 *   AddToCart       — item adicionado ao carrinho
 *   InitiateCheckout — início do checkout
 *   Purchase        — compra concluída (com e-mail hasheado)
 *
 * Referência: https://developers.facebook.com/docs/meta-pixel/reference
 */

declare global {
  interface Window {
    fbq?: (
      command: string,
      event: string,
      data?: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => void;
  }
}

function isAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    !!process.env.NEXT_PUBLIC_FB_PIXEL_ID?.trim() &&
    typeof window.fbq === "function"
  );
}

/** SHA-256 via Web Crypto API — retorna hex string. */
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Normaliza e hasheia e-mail conforme especificação do Meta. */
export async function hashEmail(email: string): Promise<string> {
  return sha256(email.trim().toLowerCase());
}

// ─────────────────────────────────────────────────────────────────────────────
// Eventos de pixel
// ─────────────────────────────────────────────────────────────────────────────

/** Visualização de produto ou kit (ProductPageContent / KitPageContent). */
export function fbTrackViewContent(params: {
  contentId: string;
  contentName: string;
  contentType?: string;
  value: number;
}): void {
  if (!isAvailable()) return;
  window.fbq!("track", "ViewContent", {
    content_ids: [params.contentId],
    content_name: params.contentName,
    content_type: params.contentType ?? "product",
    value: params.value,
    currency: "BRL",
  });
}

/** Adição ao carrinho. */
export function fbTrackAddToCart(params: {
  contentId: string;
  contentName: string;
  value: number;
  quantity?: number;
}): void {
  if (!isAvailable()) return;
  window.fbq!("track", "AddToCart", {
    content_ids: [params.contentId],
    content_name: params.contentName,
    value: params.value,
    currency: "BRL",
    quantity: params.quantity ?? 1,
  });
}

/** Início do checkout. */
export function fbTrackInitiateCheckout(params: {
  value: number;
  numItems: number;
  contentIds: string[];
}): void {
  if (!isAvailable()) return;
  window.fbq!("track", "InitiateCheckout", {
    value: params.value,
    currency: "BRL",
    num_items: params.numItems,
    content_ids: params.contentIds,
  });
}

/**
 * Compra concluída.
 * Hasheia o e-mail do cliente para Advanced Matching — melhora o match rate
 * nas campanhas de remarketing e lookalike.
 */
export async function fbTrackPurchase(params: {
  transactionId: string;
  value: number;
  contentIds: string[];
  numItems: number;
  email?: string | null;
}): Promise<void> {
  if (!isAvailable()) return;

  const userData: Record<string, unknown> = {};
  if (params.email) {
    userData.em = await hashEmail(params.email);
  }

  window.fbq!("track", "Purchase", {
    value: params.value,
    currency: "BRL",
    content_ids: params.contentIds,
    num_items: params.numItems,
    order_id: params.transactionId,
  }, {
    eventID: params.transactionId,
    ...(Object.keys(userData).length > 0 && { userData }),
  });
}
