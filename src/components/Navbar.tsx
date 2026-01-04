// src/components/Navbar.tsx
'use client';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const { totalItems, setIsOpen, setIsMenuOpen, setIsSearchOpen } = useCart();

  return (
    <nav className="fixed w-full z-50 bg-brand-offwhite/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center text-brand-softblack">
        
        {/* LADO ESQUERDO: Menu + Lupa */}
        <div className="flex-1 flex items-center space-x-6">
          {/* Menu Hambúrguer */}
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="flex flex-col space-y-1.5 w-6 group"
          >
            <span className="h-0.5 w-full bg-brand-softblack transition-all group-hover:w-4"></span>
            <span className="h-0.5 w-full bg-brand-softblack"></span>
            <span className="h-0.5 w-full bg-brand-softblack transition-all group-hover:w-4"></span>
          </button>

          {/* Lupa de Pesquisa */}
          <button 
            onClick={() => setIsSearchOpen(true)} 
            className="hover:opacity-50 transition-opacity"
            aria-label="Pesquisar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </div>

        {/* LOGO CENTRAL */}
        <div className="text-xl font-extralight tracking-[0.4em] uppercase cursor-pointer absolute left-1/2 -translate-x-1/2">
          VIOS
        </div>

        {/* LADO DIREITO: Carrinho */}
        <div className="flex-1 flex justify-end">
          <button 
            onClick={() => setIsOpen(true)}
            className="text-[10px] uppercase tracking-[0.2em] font-medium hover:opacity-50 transition-opacity"
          >
            Carrinho ({totalItems})
          </button>
        </div>
      </div>
    </nav>
  );
}