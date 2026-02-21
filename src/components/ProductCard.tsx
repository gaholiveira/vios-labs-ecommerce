"use client";
import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import { Product } from "@/constants/products";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/format";

const BADGE_CONFIG = {
  bestseller: { text: "Bestseller", color: "bg-brand-green" },
  novo: { text: "Novo", color: "bg-brand-softblack" },
  vegano: { text: "Vegano", color: "bg-brand-green/80" },
} as const;

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const badgeConfig = product.badge ? BADGE_CONFIG[product.badge] : null;

  const renderStars = (rating: number = 0) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const starId = `half-star-${product.id}`;

    return (
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`Avaliação: ${rating} de 5 estrelas`}
      >
        {Array.from({ length: fullStars }, (_, i) => (
          <svg
            key={`full-${i}`}
            className="w-3 h-3 text-brand-gold fill-current"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg
            className="w-3 h-3 text-brand-gold fill-current"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={starId}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#${starId})`}
              d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
            />
          </svg>
        )}
        {Array.from({ length: emptyStars }, (_, i) => (
          <svg
            key={`empty-${i}`}
            className="w-3 h-3 text-gray-300 fill-current"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="group flex flex-col">
      {/* Container da Imagem com Badge e Overlay */}
      <Link
        href={`/produto/${product.id}`}
        className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden mb-6"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />

        {/* Badge */}
        {badgeConfig && (
          <div
            className={`absolute top-3 left-3 ${badgeConfig.color} text-brand-offwhite px-3 py-1 text-[9px] uppercase tracking-wider font-medium z-10`}
          >
            {badgeConfig.text}
          </div>
        )}

        {/* Overlay no Hover com Texto "Ver Detalhes" */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 ease-out flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-brand-offwhite px-6 py-3 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 ease-out">
            <span className="text-[10px] uppercase tracking-wider text-brand-softblack font-light">
              Ver Detalhes
            </span>
          </div>
        </div>
      </Link>

      {/* Informações do Produto */}
      <div className="flex flex-col gap-3">
        {/* Categoria */}
        {product.category && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-brand-gold font-light">
            {product.category}
          </p>
        )}

        {/* Nome do Produto */}
        <Link href={`/produto/${product.id}`}>
          <h3 className="text-xs sm:text-sm uppercase tracking-wider font-light text-brand-softblack group-hover:text-brand-green transition-colors duration-500 ease-out leading-tight">
            {product.name}
          </h3>
        </Link>

        {/* Descrição curta para conversão */}
        {product.shortDescription && (
          <p className="text-[11px] sm:text-xs font-light text-brand-softblack/65 leading-snug line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* Rating e Reviews — prova social sutil */}
        {product.rating !== undefined && (
          <div className="flex items-center gap-2">
            {renderStars(product.rating)}
            {product.reviews !== undefined && product.reviews > 0 && (
              <span className="text-[10px] text-brand-softblack/50 font-light uppercase tracking-wider">
                {product.reviews} {product.reviews === 1 ? "avaliação" : "avaliações"}
              </span>
            )}
          </div>
        )}

        {/* Preço */}
        <div className="flex items-baseline gap-2">
          <p className="text-base font-light text-brand-softblack">
            {formatPrice(product.price)}
          </p>
          {hasDiscount && product.oldPrice && (
            <p className="text-sm text-brand-softblack/40 line-through font-light">
              {formatPrice(product.oldPrice)}
            </p>
          )}
        </div>

        {/* Benefício PIX */}
        <p className="text-[10px] uppercase tracking-wider text-brand-green/90 font-light">
          5% off no PIX
        </p>

        {/* Botão Colocar na sacola — conversão high-end */}
        <button
          onClick={() => !product.soldOut && addToCart(product)}
          disabled={product.soldOut}
          className={`w-full border rounded-sm px-6 py-3 min-h-[44px] uppercase tracking-wider text-xs font-light transition-all duration-500 ease-out mt-2 ${
            product.soldOut
              ? "border-stone-300 bg-stone-200 text-stone-500 cursor-not-allowed"
              : "border-brand-green bg-brand-green text-brand-offwhite hover:bg-brand-softblack hover:border-brand-softblack"
          }`}
        >
          {product.soldOut ? "Esgotado" : "Colocar na sacola"}
        </button>
      </div>
    </div>
  );
}

export default memo(ProductCard);
