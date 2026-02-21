import { PRODUCTS } from "@/constants/products";
import { KITS } from "@/constants/kits";
import type { Product } from "@/constants/products";
import type { Kit } from "@/constants/kits";

const MAX_PRODUCT_RECOMMENDATIONS = 4;
const MAX_KIT_RECOMMENDATIONS = 3;

/**
 * Produtos que aparecem nos mesmos protocolos/kits que o produto atual.
 * Baseado na estrutura de kits — produtos que compõem protocolos juntos
 * são frequentemente comprados em conjunto.
 */
export function getFrequentlyBoughtTogetherProducts(
  productId: string
): Product[] {
  const kitsWithProduct = KITS.filter((k) => k.products.includes(productId));
  const productCounts = new Map<string, number>();

  for (const kit of kitsWithProduct) {
    for (const pid of kit.products) {
      if (pid === productId) continue;
      productCounts.set(pid, (productCounts.get(pid) ?? 0) + 1);
    }
  }

  const sorted = [...productCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_PRODUCT_RECOMMENDATIONS)
    .map(([id]) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  return sorted;
}

/**
 * Para página de kit: outros protocolos que compartilham produtos
 * e produtos complementares (que aparecem em kits relacionados).
 */
export function getFrequentlyBoughtTogetherForKit(kitId: string): {
  products: Product[];
  kits: Kit[];
} {
  const currentKit = KITS.find((k) => k.id === kitId);
  if (!currentKit) return { products: [], kits: [] };

  const currentProductIds = new Set(currentKit.products);

  // Kits que compartilham pelo menos 1 produto (excluindo o atual)
  const relatedKits = KITS.filter((k) => {
    if (k.id === kitId) return false;
    const shared = k.products.some((pid) => currentProductIds.has(pid));
    return shared;
  })
    .slice(0, MAX_KIT_RECOMMENDATIONS);

  // Produtos que não estão no kit mas aparecem em kits relacionados
  const productCounts = new Map<string, number>();
  for (const kit of relatedKits) {
    for (const pid of kit.products) {
      if (currentProductIds.has(pid)) continue;
      productCounts.set(pid, (productCounts.get(pid) ?? 0) + 1);
    }
  }

  const products = [...productCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_PRODUCT_RECOMMENDATIONS)
    .map(([id]) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);

  return { products, kits: relatedKits };
}
