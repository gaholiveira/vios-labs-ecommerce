"use client";

import Link from "next/link";
import { memo } from "react";
import { PRODUCTS } from "@/constants/products";
import KitProductsPreview from "./KitProductsPreview";

function KitsPreviewCard() {
  return (
    <div className="group flex flex-col h-full">
      <Link
        href="/kits"
        className="relative w-full aspect-3/4 bg-gray-100 overflow-hidden mb-6 block"
      >
        <KitProductsPreview
          products={PRODUCTS}
          badge="kit"
          variant="compact"
        />

        {/* Overlay no Hover com CTA */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-500 ease-out flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-brand-offwhite px-6 py-3 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 ease-out">
            <span className="text-[10px] uppercase tracking-wider text-brand-softblack font-light">
              Ver Protocolos & Kits
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <div className="min-h-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-brand-gold font-light">
            Protocolos & Kits
          </p>
        </div>
        <Link href="/kits" className="min-h-10 flex items-start">
          <h3 className="text-xs sm:text-sm uppercase tracking-wider font-light text-brand-softblack group-hover:text-brand-green transition-colors duration-500 ease-out leading-tight line-clamp-2">
            Combinações científicas
          </h3>
        </Link>
        <div className="min-h-10">
          <p className="text-[11px] sm:text-xs font-light text-brand-softblack/65 leading-snug line-clamp-2">
            Os 5 produtos VIOS em protocolos com sinergia máxima e economia.
          </p>
        </div>
        <div className="min-h-5" />
        <p className="text-base font-light text-brand-softblack">
          Economia garantida nos combos
        </p>
        <p className="text-[10px] uppercase tracking-wider text-brand-green/90 font-light">
          5% off no PIX
        </p>
        <Link
          href="/kits"
          className="w-full border border-brand-green rounded-sm px-6 py-3 min-h-[44px] uppercase tracking-wider text-xs font-light transition-all duration-500 ease-out mt-2 flex items-center justify-center text-brand-green hover:bg-brand-green hover:text-brand-offwhite"
        >
          Explorar Kits
        </Link>
      </div>
    </div>
  );
}

export default memo(KitsPreviewCard);
