/**
 * Analytics — Google Analytics 4 (GA4)
 * Eventos de e-commerce para funil de conversão.
 * Só envia quando NEXT_PUBLIC_GA_MEASUREMENT_ID está definido.
 */

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

const GA_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ??
  process.env.NEXT_PUBLIC_GA_ID?.trim();

function isAvailable(): boolean {
  return typeof window !== "undefined" && !!GA_ID && !!window.gtag;
}

/** Item no formato GA4 e-commerce */
export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
  item_variant?: string;
}

function toGA4Items(
  items: Array<{ id: string; name: string; price: number; quantity: number; category?: string }>
): AnalyticsItem[] {
  return items.map((item) => ({
    item_id: item.id,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity,
    item_category: item.category,
  }));
}

/** Visualização de produto ou kit */
export function trackViewItem(params: {
  itemId: string;
  itemName: string;
  price: number;
  category?: string;
  isKit?: boolean;
}): void {
  if (!isAvailable()) return;
  window.gtag!("event", "view_item", {
    currency: "BRL",
    value: params.price,
    items: [
      {
        item_id: params.itemId,
        item_name: params.itemName,
        price: params.price,
        quantity: 1,
        item_category: params.category ?? (params.isKit ? "Kit" : "Produto"),
      },
    ],
  });
}

/** Adição ao carrinho (produto) */
export function trackAddToCart(params: {
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
  category?: string;
}): void {
  if (!isAvailable()) return;
  window.gtag!("event", "add_to_cart", {
    currency: "BRL",
    value: params.price * params.quantity,
    items: toGA4Items([
      {
        id: params.itemId,
        name: params.itemName,
        price: params.price,
        quantity: params.quantity,
        category: params.category,
      },
    ]),
  });
}

/** Informações de pagamento adicionadas (ex.: usuário viu QR PIX) — funil add_payment_info */
export function trackAddPaymentInfo(params: {
  value: number;
  paymentMethod: "pix" | "card";
  items: Array<{ id: string; name: string; price: number; quantity: number; category?: string }>;
}): void {
  if (!isAvailable()) return;
  window.gtag!("event", "add_payment_info", {
    currency: "BRL",
    value: params.value,
    payment_type: params.paymentMethod,
    items: toGA4Items(params.items),
  });
}

/** Início do checkout */
export function trackBeginCheckout(params: {
  value: number;
  items: Array<{ id: string; name: string; price: number; quantity: number; category?: string }>;
  coupon?: string | null;
}): void {
  if (!isAvailable()) return;
  window.gtag!("event", "begin_checkout", {
    currency: "BRL",
    value: params.value,
    items: toGA4Items(params.items),
    ...(params.coupon && { coupon: params.coupon }),
  });
}

/** Compra concluída */
export function trackPurchase(params: {
  transactionId: string;
  value: number;
  items: Array<{ id: string; name: string; price: number; quantity: number; category?: string }>;
  coupon?: string | null;
}): void {
  if (!isAvailable()) return;
  window.gtag!("event", "purchase", {
    transaction_id: params.transactionId,
    currency: "BRL",
    value: params.value,
    items: toGA4Items(params.items),
    ...(params.coupon && { coupon: params.coupon }),
  });
}
