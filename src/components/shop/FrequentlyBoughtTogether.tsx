"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/format";
import type { Product } from "@/constants/products";
import type { Kit } from "@/constants/kits";
import { PRODUCTS } from "@/constants/products";
import KitProductsPreview from "@/components/KitProductsPreview";

interface FrequentlyBoughtTogetherProps {
  /** Produtos recomendados (ex.: da mesma página de produto) */
  products?: Product[];
  /** Kits recomendados (ex.: da página de kit) */
  kits?: Kit[];
}

function FrequentlyBoughtTogether({
  products = [],
  kits = [],
}: FrequentlyBoughtTogetherProps) {
  const { addToCart, addKitToCart } = useCart();
  const hasProducts = products.length > 0;
  const hasKits = kits.length > 0;
  const hasContent = hasProducts || hasKits;

  if (!hasContent) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-16 md:py-20 border-t border-gray-100">
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-softblack/65 mb-2">
        VIOS LABS
      </p>
      <h2 className="text-xl md:text-2xl font-light uppercase tracking-widest text-brand-softblack mb-10">
        Quem comprou também comprou
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductRecommendationCard
            key={product.id}
            product={product}
            onAddToCart={() => addToCart(product)}
          />
        ))}
        {kits.map((kit) => (
          <KitRecommendationCard
            key={kit.id}
            kit={kit}
            onAddToCart={() => addKitToCart(kit)}
          />
        ))}
      </div>
    </section>
  );
}

function ProductRecommendationCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: () => void;
}) {
  const isActive = !product.soldOut;

  return (
    <div className="group flex flex-col">
      <Link
        href={`/produto/${product.id}`}
        className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden mb-4 block"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          quality={85}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="text-[10px] uppercase tracking-wider text-white font-light bg-brand-softblack/80 px-4 py-2">
            Ver detalhes
          </span>
        </div>
      </Link>

      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-gold font-light">
          {product.category}
        </p>
        <Link href={`/produto/${product.id}`}>
          <h3 className="text-xs uppercase tracking-wider font-light text-brand-softblack group-hover:text-brand-green transition-colors leading-tight">
            {product.name}
          </h3>
        </Link>
        {product.shortDescription && (
          <p className="text-[11px] font-light text-brand-softblack/65 line-clamp-2">
            {product.shortDescription}
          </p>
        )}
        <p className="text-base font-light text-brand-softblack">
          {formatPrice(product.price)}
        </p>
        <button
          onClick={onAddToCart}
          disabled={!isActive}
          className={`w-full border rounded-sm px-4 py-2.5 text-[10px] uppercase tracking-wider font-light transition-all duration-300 mt-1 ${
            isActive
              ? "border-brand-green bg-brand-green text-brand-offwhite hover:bg-brand-softblack hover:border-brand-softblack"
              : "border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isActive ? "Adicionar à sacola" : "Esgotado"}
        </button>
      </div>
    </div>
  );
}

function KitRecommendationCard({
  kit,
  onAddToCart,
}: {
  kit: Kit;
  onAddToCart: () => void;
}) {
  const kitProducts = kit.products
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);
  const isActive = !kitProducts.some((p) => p.soldOut);

  return (
    <div className="group flex flex-col">
      <Link
        href={`/kit/${kit.id}`}
        className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden mb-4 block"
      >
        {kit.image ? (
          <Image
            src={kit.image}
            alt={kit.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
            quality={85}
          />
        ) : (
          <KitProductsPreview
            products={kitProducts}
            badge={kit.badge}
            variant="compact"
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="text-[10px] uppercase tracking-wider text-white font-light bg-brand-softblack/80 px-4 py-2">
            Ver protocolo
          </span>
        </div>
      </Link>

      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-gold font-light">
          {kit.badge === "kit" ? "Kit" : "Protocolo"}
        </p>
        <Link href={`/kit/${kit.id}`}>
          <h3 className="text-xs uppercase tracking-wider font-light text-brand-softblack group-hover:text-brand-green transition-colors leading-tight">
            {kit.name}
          </h3>
        </Link>
        <p className="text-[11px] font-light text-brand-softblack/65 line-clamp-2">
          {kit.description}
        </p>
        <div className="flex items-baseline gap-2">
          {kit.oldPrice && kit.oldPrice > kit.price && (
            <p className="text-sm text-brand-softblack/40 line-through font-light">
              {formatPrice(kit.oldPrice)}
            </p>
          )}
          <p className="text-base font-light text-brand-softblack">
            {formatPrice(kit.price)}
          </p>
        </div>
        <button
          onClick={onAddToCart}
          disabled={!isActive}
          className={`w-full border rounded-sm px-4 py-2.5 text-[10px] uppercase tracking-wider font-light transition-all duration-300 mt-1 ${
            isActive
              ? "border-brand-green bg-brand-green text-brand-offwhite hover:bg-brand-softblack hover:border-brand-softblack"
              : "border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isActive ? "Adicionar à sacola" : "Em breve"}
        </button>
      </div>
    </div>
  );
}

export default memo(FrequentlyBoughtTogether);
