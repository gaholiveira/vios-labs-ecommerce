'use client';
import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';

export default function CartDrawer() {
  const { cart, isOpen, setIsOpen, removeFromCart, updateQuantity, totalPrice } = useCart();

  // Prevenir scroll quando carrinho está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleQuantityChange = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  }, [removeFromCart, updateQuantity]);

  return (
    <>
      {/* Overlay Escuro */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Painel Lateral */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-light uppercase tracking-widest text-brand-softblack">
              O teu carrinho
            </h2>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Fechar carrinho"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className="w-6 h-6 text-brand-softblack"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Conteúdo do Carrinho */}
          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1} 
                  stroke="currentColor" 
                  className="w-16 h-16 text-gray-300 mb-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <p className="text-gray-500 font-light text-sm mb-2">O teu carrinho está vazio.</p>
                <Link 
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="text-brand-green text-[10px] uppercase tracking-wider hover:underline"
                >
                  Continuar a comprar
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => {
                  const itemTotal = item.price * item.quantity;
                  return (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                      {/* Imagem do Produto */}
                      <Link 
                        href={`/produto/${item.id}`}
                        onClick={() => setIsOpen(false)}
                        className="relative w-20 h-24 flex-shrink-0 bg-gray-100 rounded-sm overflow-hidden group"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                          quality={75}
                        />
                      </Link>

                      {/* Informações do Produto */}
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/produto/${item.id}`}
                          onClick={() => setIsOpen(false)}
                          className="block"
                        >
                          <h3 className="text-sm uppercase font-medium text-brand-softblack hover:text-brand-green transition-colors line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {formatPrice(item.price)}
                        </p>

                        {/* Controles de Quantidade */}
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center border border-gray-300 rounded-sm">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="px-2 py-1 hover:bg-gray-100 transition-colors text-brand-softblack"
                              aria-label="Diminuir quantidade"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                              </svg>
                            </button>
                            <span className="px-3 py-1 text-sm font-medium text-brand-softblack min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="px-2 py-1 hover:bg-gray-100 transition-colors text-brand-softblack"
                              aria-label="Aumentar quantidade"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </button>
                          </div>

                          {/* Botão Remover */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                            aria-label="Remover item"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>

                        {/* Total do Item */}
                        <p className="text-sm font-semibold text-brand-softblack mt-2">
                          {formatPrice(itemTotal)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer com Resumo e Botão */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm uppercase tracking-wider text-gray-600">Subtotal</span>
                  <span className="text-lg font-semibold text-brand-softblack">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Frete calculado no checkout
                </p>
              </div>
              
              <Link
                href="/checkout"
                onClick={() => setIsOpen(false)}
                className="block w-full bg-brand-green text-brand-offwhite py-4 uppercase tracking-widest text-[10px] text-center hover:bg-brand-green/90 transition-colors font-medium"
              >
                Finalizar Compra
              </Link>
              
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="block text-center text-[10px] uppercase tracking-wider text-brand-softblack/60 hover:text-brand-green transition-colors mt-3"
              >
                Continuar a comprar
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}