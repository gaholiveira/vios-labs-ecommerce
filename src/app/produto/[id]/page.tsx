'use client';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { PRODUCTS } from '@/constants/products';
import { useCart } from '@/context/CartContext';

export default function ProductPage() {
  const params = useParams();
  const { addToCart } = useCart();

  // Procurar o produto correspondente ao ID na URL
  const product = PRODUCTS.find((p) => p.id === params.id);

  if (!product) {
    return <div className="p-20 text-center">Produto não encontrado.</div>;
  }

  return (
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
        <p className="text-xl mb-6">R$ {product.price.toFixed(2)}</p>
        
        <div className="border-t border-b py-6 mb-8 text-gray-600 font-light leading-relaxed">
          {product.description}
        </div>

        <button 
          onClick={() => addToCart(product)}
          className="bg-brand-green text-brand-offwhite px-6 py-3 uppercase tracking-widest text-[10px]">
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  );
}