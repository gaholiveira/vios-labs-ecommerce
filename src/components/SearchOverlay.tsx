// src/components/SearchOverlay.tsx
'use client';
import { useCart } from '@/context/CartContext';

export default function SearchOverlay() {
  const { isSearchOpen, setIsSearchOpen } = useCart();

  return (
    <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isSearchOpen ? 'translate-y-0 opacity-100 visible' : '-translate-y-full opacity-0 invisible'}`}>
      {/* Fundo Branco da Pesquisa */}
      <div className="bg-brand-offwhite w-full h-40 flex items-center px-6 md:px-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto w-full flex items-center gap-4">
          <input 
            type="text" 
            placeholder="O QUE ESTÁ À PROCURA?" 
            className="w-full bg-transparent text-xl md:text-3xl font-light uppercase tracking-widest outline-none text-brand-softblack placeholder:text-gray-300"
            autoFocus={isSearchOpen}
          />
          <button onClick={() => setIsSearchOpen(false)} className="text-2xl font-light">
            &times;
          </button>
        </div>
      </div>
      {/* Overlay Escuro para fechar ao clicar fora */}
      <div 
        className="h-full w-full bg-black/20" 
        onClick={() => setIsSearchOpen(false)}
      />
    </div>
  );
}