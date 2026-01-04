// src/components/MobileMenu.tsx
'use client';
import { useCart } from '@/context/CartContext';

export default function MobileMenu() {
  const { isMenuOpen, setIsMenuOpen } = useCart();

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 z-[80] transition-opacity ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Menu Lateral */}
      <div className={`fixed left-0 top-0 h-full w-[80%] max-w-sm bg-brand-offwhite z-[90] transition-transform duration-500 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col h-full">
          <button onClick={() => setIsMenuOpen(false)} className="self-end text-2xl font-light mb-12">
            &times;
          </button>
          
          <nav className="flex flex-col space-y-8 text-sm uppercase tracking-[0.3em] font-medium text-brand-softblack">
            <a href="/" onClick={() => setIsMenuOpen(false)}>Novidades</a>
            <a href="#" onClick={() => setIsMenuOpen(false)}>Produtos</a>
            <a href="#" onClick={() => setIsMenuOpen(false)}>Sobre a Vios</a>
            <a href="#" onClick={() => setIsMenuOpen(false)}>Contacto</a>
          </nav>
        </div>
      </div>
    </>
  );
}