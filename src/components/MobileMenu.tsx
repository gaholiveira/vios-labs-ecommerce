'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

export default function MobileMenu() {
  const { isMenuOpen, setIsMenuOpen } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [isMenuOpen]); // Atualiza sempre que o menu abrir

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 z-[80] transition-opacity ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setIsMenuOpen(false)} />

      <div className={`fixed left-0 top-0 h-full w-[85%] max-w-sm bg-brand-offwhite z-[90] transition-transform duration-500 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col h-full justify-between">
          
          <div>
            <div className="flex justify-between items-center mb-12 text-brand-softblack">
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-2xl font-light">&times;</button>
            </div>
            
            <nav className="flex flex-col space-y-6 text-sm uppercase tracking-[0.2em] font-light text-brand-softblack">
              <Link href="/" onClick={() => setIsMenuOpen(false)}>Novidades</Link>
              <Link href="#" onClick={() => setIsMenuOpen(false)}>Produtos</Link>
              <Link href="#" onClick={() => setIsMenuOpen(false)}>Sobre</Link>
            </nav>
          </div>

          <div className="border-t border-gray-200 pt-8">
  {/* CASO 1: UTILIZADOR NÃO ESTÁ LOGADO */}
  {!user ? (
    <div className="flex flex-col space-y-4">
      <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-4 text-brand-softblack">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Entrar na Conta</span>
      </Link>
      
      <Link 
        href="/register" 
        onClick={() => setIsMenuOpen(false)}
        className="text-[10px] uppercase tracking-[0.3em] font-light opacity-60 ml-10 hover:opacity-100 transition"
      >
        Criar nova conta
      </Link>
    </div>
  ) : (
    /* CASO 2: UTILIZADOR ESTÁ LOGADO */
    <div className="space-y-4">
      <p className="text-[8px] uppercase tracking-widest opacity-50">Sessão iniciada como:</p>
      <p className="text-[10px] uppercase tracking-widest font-medium text-brand-softblack truncate">
        {user.email}
      </p>
      <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="text-[10px] uppercase tracking-[0.3em] font-medium block mb-2 underline">
            Editar Perfil / Endereço
      </Link>
      <button 
        onClick={handleLogout}
        className="text-[10px] uppercase tracking-[0.3em] font-medium text-red-800 hover:opacity-70 transition-opacity pt-2">
        Sair da Conta
      </button>
    </div>
  )}
</div>
</div>
</div>
</>
);
}