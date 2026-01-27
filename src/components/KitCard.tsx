"use client";
import { memo } from "react";
import { Kit } from "@/constants/kits";
import { PRODUCTS } from "@/constants/products";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/format";
import KitImageTemplate from "./KitImageTemplate";

function KitCard({ kit }: { kit: Kit }) {
  const { addKitToCart } = useCart();

  const handleAddToCart = () => {
    // Adicionar o kit como um item único ao carrinho
    addKitToCart(kit);
  };

  return (
    <div className="group flex flex-col h-full">
      {/* Template de Imagem do Kit */}
      <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden mb-6">
        <KitImageTemplate kitName={kit.name} badge={kit.badge} />
      </div>

      {/* Informações do Kit */}
      <div className="flex flex-col gap-3 flex-1">
        {/* Categoria/Badge */}
        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-gold font-light">
          {kit.badge === 'kit' ? 'Kit' : 'Protocolo'}
        </p>

        {/* Nome do Kit */}
        <h3 className="text-xs sm:text-sm uppercase tracking-wider font-light text-brand-gold group-hover:text-brand-green transition-colors duration-500 ease-out leading-tight">
          {kit.name}
        </h3>

        {/* Frase de Apoio */}
        <p className="text-xs font-light text-brand-softblack/70 leading-relaxed">
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

        {/* Botão Adicionar ao Carrinho */}
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
