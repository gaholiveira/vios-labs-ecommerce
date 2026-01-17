// src/components/Navbar.tsx
'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function Navbar() {
  const { totalItems, setIsOpen, setIsMenuOpen, setIsSearchOpen } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Apenas no desktop (md:), aplicar animação de scroll
      if (window.innerWidth >= 768) {
        setIsScrolled(window.scrollY > 10);
      } else {
        // Mobile: sempre manter false para altura fixa
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    // Inicializar estado baseado no tamanho atual
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm md:bg-brand-offwhite/80 md:backdrop-blur-md border-b border-gray-200/50 transition-colors duration-300">
      <div className={`max-w-7xl mx-auto px-6 flex justify-between items-center text-brand-softblack h-14 md:h-auto md:transition-all md:duration-300 ${isScrolled ? 'md:py-2' : 'md:py-4'}`}>
        
        {/* LADO ESQUERDO: Menu + Lupa */}
        <div className="flex-1 flex items-center space-x-6">
          {/* Menu Hambúrguer */}
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="flex flex-col space-y-1.5 w-6 min-h-[44px] min-w-[44px] items-center justify-center -ml-2 -my-2 p-2 group active:opacity-70 md:hover:opacity-70 transition-opacity"
            aria-label="Abrir menu de navegação"
            aria-expanded={false}
          >
            <span className="h-0.5 w-full bg-brand-softblack transition-all md:group-hover:w-4"></span>
            <span className="h-0.5 w-full bg-brand-softblack"></span>
            <span className="h-0.5 w-full bg-brand-softblack transition-all md:group-hover:w-4"></span>
          </button>

          {/* Lupa de Pesquisa */}
          <button 
            onClick={() => setIsSearchOpen(true)} 
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 -my-2 p-2 active:opacity-70 md:hover:opacity-50 transition-opacity"
            aria-label="Pesquisar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </div>

        {/* LOGO CENTRAL */}
        <Link 
          href="/"
          className="text-xl font-extralight tracking-[0.4em] uppercase cursor-pointer absolute left-1/2 -translate-x-1/2 hover:opacity-70 transition-opacity"
          aria-label="Ir para página inicial"
        >
          VIOS
        </Link>

        {/* LADO DIREITO: Carrinho */}
        <div className="flex-1 flex justify-end">
          <button 
            onClick={() => setIsOpen(true)}
            className="text-[10px] uppercase tracking-[0.2em] font-medium min-h-[44px] px-3 py-2 -my-2 -mr-2 active:opacity-70 md:hover:opacity-50 transition-opacity"
            aria-label={`Abrir carrinho com ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
          >
            Carrinho ({totalItems})
          </button>
        </div>
      </div>
    </nav>
  );
}