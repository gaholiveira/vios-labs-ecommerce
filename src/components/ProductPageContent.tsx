"use client";

import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/format";
import ProductAccordion from "@/components/ProductAccordion";
import StickyBar from "@/components/StickyBar";
import KeyIngredients from "@/components/KeyIngredients";
import { Product } from "@/constants/products";

interface ProductPageContentProps {
  product: Product;
}

export default function ProductPageContent({ product }: ProductPageContentProps) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Imagem do Produto */}
        <div className="relative bg-gray-100 aspect-[3/4] overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
            quality={90}
          />
        </div>

        {/* Detalhes */}
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-light uppercase tracking-widest mb-4">
            {product.name}
          </h1>
          <p className="text-xl mb-6">{formatPrice(product.price)}</p>
          
          <div className="border-t border-b py-6 mb-8 text-gray-600 font-light leading-relaxed">
            {product.description}
          </div>

          <button 
            data-sticky-bar-trigger
            onClick={handleAddToCart}
            className="border border-brand-green rounded-sm bg-brand-green text-brand-offwhite px-6 py-3 min-h-[44px] uppercase tracking-[0.2em] text-xs font-medium active:bg-brand-softblack/80 active:border-brand-softblack md:hover:bg-brand-softblack md:hover:border-brand-softblack transition-all duration-500 ease-out md:transform md:hover:scale-105">
            Adicionar ao Carrinho
          </button>

          {/* Accordion com informações do produto */}
          <ProductAccordion
            items={[
              {
                title: "Ingredientes",
                content: "Ingredientes selecionados cuidadosamente para garantir a máxima qualidade e eficácia. Cada componente foi escolhido com base em pesquisas científicas e padrões rigorosos de pureza.",
              },
              {
                title: "Como Usar",
                content: "Recomendamos tomar uma cápsula por dia, preferencialmente com uma refeição. Para melhores resultados, mantenha uma alimentação balanceada e pratique exercícios físicos regularmente.",
              },
              {
                title: "Ciência",
                content: "Nosso produto foi desenvolvido com base em estudos científicos publicados em revistas especializadas. Cada ingrediente foi selecionado considerando sua biodisponibilidade e sinergia com os demais componentes da fórmula.",
              },
            ]}
          />
        </div>
      </div>

      {/* Key Ingredients Section */}
      <div className="w-full max-w-7xl mx-auto px-6">
        <KeyIngredients
          ingredients={[
            {
              name: "Bisglicinato de Magnésio",
              benefit: "Absorção superior e biodisponibilidade otimizada",
            },
            {
              name: "Vitamina D3",
              benefit: "Suporte à saúde óssea e sistema imunológico",
            },
            {
              name: "Zinco Quelado",
              benefit: "Melhor absorção e menor irritação gástrica",
            },
          ]}
        />
      </div>

      {/* Sticky Bar - Aparece apenas no mobile quando o botão sai da tela */}
      <StickyBar
        productName={product.name}
        price={product.price}
        productId={product.id}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}
