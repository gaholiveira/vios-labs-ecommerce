"use client";
import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Kit } from "@/constants/kits";
import { PRODUCTS } from "@/constants/products";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/format";
import KitImageTemplate from "./KitImageTemplate";

function KitCard({ kit }: { kit: Kit }) {
  const { addKitToCart } = useCart();

  const handleAddToCart = () => {
    addKitToCart(kit);
  };

  return (
    <div className="group flex flex-col">
      {/* Container da Imagem do Kit - Linkável */}
      <Link
        href={`/kit/${kit.id}`}
        className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden mb-6 block"
      >
        {kit.image ? (
          <>
            <Image
              src={kit.image}
              alt={kit.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
              quality={85}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />

            {/* Badge */}
            <div className="absolute top-3 left-3 bg-brand-green text-brand-offwhite px-3 py-1 text-[9px] uppercase tracking-wider font-medium z-10">
              {kit.badge === "kit" ? "Kit" : "Protocolo"}
            </div>

            {/* Overlay no Hover com Texto "Ver Detalhes" */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 ease-out flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-brand-offwhite px-6 py-3 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 ease-out">
                <span className="text-[10px] uppercase tracking-wider text-brand-softblack font-light">
                  Ver Detalhes
                </span>
              </div>
            </div>
          </>
        ) : (
          <KitImageTemplate kitName={kit.name} badge={kit.badge} />
        )}
      </Link>

      {/* Informações do Kit */}
      <div className="flex flex-col gap-3">
        {/* Categoria/Badge */}
        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-gold font-light">
          {kit.badge === "kit" ? "Kit" : "Protocolo"}
        </p>

        {/* Nome do Kit - altura fixa para evitar que empurre o botão ao comprimir */}
        <h3 className="text-xs sm:text-sm uppercase tracking-wider font-light text-brand-gold group-hover:text-brand-green transition-colors duration-500 ease-out leading-tight h-10 sm:h-12 flex items-start overflow-hidden">
          {kit.name}
        </h3>

        {/* Frase de Apoio - altura fixa para consistência */}
        <p className="text-xs font-light text-brand-softblack/70 leading-relaxed h-[3.5rem] overflow-hidden">
          {kit.description}
        </p>

        {/* Preço */}
        <div className="flex items-baseline gap-2">
          {kit.oldPrice && kit.oldPrice > kit.price && (
            <p className="text-sm text-brand-softblack/40 line-through font-light">
              {formatPrice(kit.oldPrice)}
            </p>
          )}
          <p className="text-base font-light text-brand-softblack">
            {formatPrice(kit.price)}
          </p>
          {kit.oldPrice && kit.oldPrice > kit.price && (
            <span className="text-[10px] uppercase tracking-wider text-brand-green font-medium">
              Economia
            </span>
          )}
        </div>

        {/* Benefício PIX */}
        <p className="text-[10px] uppercase tracking-wider text-brand-green/90 font-light">
          5% off no PIX
        </p>

        {/* Botão Colocar na sacola — conversão high-end */}
        <button
          onClick={handleAddToCart}
          disabled
          className="w-full border border-gray-300 rounded-sm bg-gray-200 text-gray-500 px-6 py-3 min-h-[44px] uppercase tracking-wider text-xs font-light cursor-not-allowed transition-all duration-500 ease-out mt-2"
        >
          Em Breve
        </button>
      </div>
    </div>
  );
}

export default memo(KitCard);
