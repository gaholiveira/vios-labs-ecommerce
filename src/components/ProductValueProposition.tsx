"use client";

import { Product } from "@/constants/products";

/**
 * Destaque de valor do produto — replica o shortDescription.
 * Registro ANVISA já é exibido em ProductTrustSeals.
 */
export default function ProductValueProposition({ product }: { product: Product }) {
  const text = product.shortDescription;
  if (!text) return null;

  return (
    <div className="rounded-sm border border-brand-green/20 bg-brand-green/5 py-4 px-5 mb-6">
      <p className="text-[11px] uppercase tracking-[0.2em] font-medium text-brand-softblack/90 leading-relaxed">
        {text}
      </p>
    </div>
  );
}
