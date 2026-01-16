'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function MobileMenu() {
  const { isMenuOpen, setIsMenuOpen } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  // Prevenir scroll quando menu está aberto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const getUser = async () => {
      if (!isMenuOpen) return;
      setLoading(true);
      try {
        const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [isMenuOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
      setIsMenuOpen(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const menuItems = [
    { href: '/', label: 'Início', icon: 'home' },
    { href: '/sobre', label: 'Sobre Nós', icon: 'info' },
    { href: '/lote-zero', label: 'Lote Zero', icon: 'star' },
  ];

  return (
    <>
      {/* Overlay com animação */}
      <div 
        className={`fixed inset-0 bg-black/40 z-[80] transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`} 
        onClick={handleLinkClick}
        aria-hidden="true"
      />

      {/* Menu lateral */}
      <div 
        className={`fixed left-0 top-0 h-full w-[85%] max-w-sm bg-brand-offwhite z-[90] shadow-2xl transition-transform duration-300 ease-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        <div className="p-6 md:p-8 flex flex-col h-full">
          {/* Header do Menu */}
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-brand-softblack">
              Menu
            </span>
            <button 
              onClick={handleLinkClick}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Fechar menu"
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

          {/* Navegação Principal */}
          <nav className="flex-1">
            <ul className="flex flex-col space-y-2">
              {menuItems.map((item) => {
                const IconComponent = () => {
                  switch (item.icon) {
                    case 'home':
                      return (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                      );
                    case 'info':
                      return (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                        </svg>
                      );
                    case 'star':
                      return (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                      );
                    default:
                      return null;
                  }
                };

                return (
                  <li key={item.href}>
                    <Link 
                      href={item.href} 
                      onClick={handleLinkClick}
                      className="flex items-center space-x-4 py-3 px-2 text-sm uppercase tracking-[0.2em] font-light text-brand-softblack hover:bg-gray-50 rounded-sm transition-colors"
                    >
                      <IconComponent />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Seção de Autenticação */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <svg className="animate-spin h-5 w-5 text-brand-softblack" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : !user ? (
              /* Usuário não logado */
    <div className="flex flex-col space-y-4">
                <Link 
                  href="/login" 
                  onClick={handleLinkClick}
                  className="flex items-center space-x-4 py-3 px-2 text-brand-softblack hover:bg-gray-50 rounded-sm transition-colors group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:text-brand-green transition-colors">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-medium">
                    Entrar na Conta
                  </span>
      </Link>
      
      <Link 
        href="/register" 
                  onClick={handleLinkClick}
                  className="text-[10px] uppercase tracking-[0.3em] font-light opacity-60 ml-9 hover:opacity-100 transition-opacity"
      >
        Criar nova conta
      </Link>
    </div>
  ) : (
              /* Usuário logado */
    <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100">
                  <p className="text-[8px] uppercase tracking-widest opacity-50 mb-2">
                    Sessão iniciada como:
                  </p>
      <p className="text-[10px] uppercase tracking-widest font-medium text-brand-softblack truncate">
        {user.email}
      </p>
                </div>
                
                <Link 
                  href="/profile" 
                  onClick={handleLinkClick}
                  className="flex items-center space-x-4 py-3 px-2 text-[10px] uppercase tracking-[0.3em] font-medium text-brand-softblack hover:bg-gray-50 rounded-sm transition-colors group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:text-brand-green transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  <span>Editar Perfil / Endereço</span>
      </Link>
                
      <button 
        onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center space-x-4 py-3 px-2 w-full text-[10px] uppercase tracking-[0.3em] font-medium text-red-600 hover:bg-red-50 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loggingOut ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saindo...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                      </svg>
                      <span>Sair da Conta</span>
                    </>
                  )}
      </button>
    </div>
  )}
</div>
</div>
</div>
</>
);
}