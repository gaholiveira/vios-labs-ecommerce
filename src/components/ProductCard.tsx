'use client';
import Link from 'next/link'; // Importante para navegação rápida
import { Product } from '@/constants/products';
import { useCart } from '@/context/CartContext';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <div className="group flex flex-col items-center">
      {/* Agora a imagem é um link */}
      <Link href={`/produto/${product.id}`} className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden mb-4">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </Link>
      
      <Link href={`/produto/${product.id}`}>
        <h3 className="text-sm uppercase tracking-wider font-light hover:text-gray-500 transition">
          {product.name}
        </h3>
      </Link>
      
      <p className="text-sm mt-1">R$ {product.price.toFixed(2)}</p>
      
      <button 
        onClick={() => addToCart(product)}
        className="bg-brand-green text-brand-offwhite px-6 py-3 uppercase tracking-widest text-[10px]">
        Compra Rápida +
      </button>
    </div>
  );
}