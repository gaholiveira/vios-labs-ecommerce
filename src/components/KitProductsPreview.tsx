"use client";

import Image from "next/image";
import { Product } from "@/constants/products";

interface KitProductsPreviewProps {
  products: Product[];
  badge?: "kit" | "protocolo";
  /** Compacto para cards na listagem; padrão para página de detalhe */
  variant?: "compact" | "default";
}

export default function KitProductsPreview({
  products,
  badge,
  variant = "default",
}: KitProductsPreviewProps) {
  if (products.length === 0) return null;

  const count = products.length;
  const gap = variant === "compact" ? "gap-1" : "gap-2";
  const padding = variant === "compact" ? "p-2" : "p-4";
  const rows = Math.ceil(count / 2); // 2 cols: 1, 2, 3 ou 4 rows conforme count

  // Último item (ímpar): centraliza na linha
  const lastItemClasses = count % 2 === 1 ? "col-span-2 justify-self-center aspect-square h-full" : "";

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-brand-offwhite via-brand-offwhite to-brand-champagne/30 flex flex-col overflow-hidden">
      {/* Badge superior */}
      {badge && (
        <div className={`shrink-0 flex justify-center ${variant === "compact" ? "pt-2 pb-1" : "pt-4 pb-2"}`}>
          <span className="inline-block bg-brand-green text-brand-offwhite px-2.5 py-0.5 text-[8px] uppercase tracking-[0.2em] font-medium">
            {badge === "kit" ? "Kit" : "Protocolo"}
          </span>
        </div>
      )}

      {/* Grid de produtos — usa 1fr para distribuir espaço e exibir todos */}
      <div
        className={`flex-1 grid grid-cols-2 ${gap} ${padding} min-h-0`}
        style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className={`relative min-h-0 rounded-sm overflow-hidden bg-white/50 shadow-sm ${
              index === count - 1 && count % 2 === 1 ? lastItemClasses : ""
            }`}
          >
            <div className="absolute inset-0">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes={variant === "compact" ? "80px" : "120px"}
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Borda decorativa */}
      <div className="absolute inset-0 border border-brand-gold/10 pointer-events-none rounded-sm" />
    </div>
  );
}
