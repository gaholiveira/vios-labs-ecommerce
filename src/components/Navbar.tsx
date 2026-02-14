// src/components/Navbar.tsx
"use client";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Avatar from "@/components/ui/Avatar";
import DropdownMenu from "@/components/ui/DropdownMenu";
import SiteSearch from "@/components/SiteSearch";

function Navbar() {
  const { totalItems, setIsMenuOpen, setIsCartDrawerOpen } = useCart();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Apenas no desktop (md:), aplicar animação de scroll
          if (window.innerWidth >= 768) {
            setIsScrolled(window.scrollY > 10);
          } else {
            // Mobile: sempre manter false para altura fixa
            setIsScrolled(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Throttle resize events
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        handleScroll();
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    // Inicializar estado baseado no tamanho atual
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Carregar perfil do usuário
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        return;
      }

      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();

        setProfile(data || { full_name: null, avatar_url: null });
      } catch (error) {
        // Se não houver perfil, usar dados do usuário
        setProfile({ full_name: null, avatar_url: null });
      }
    }

    loadProfile();
  }, [user]);

  const handleOpenMenu = useCallback(() => {
    setIsMenuOpen(true);
  }, [setIsMenuOpen]);

  // Menu de links para desktop - Memoizado
  const desktopMenuItems = useMemo(
    () => [
      { href: "/", label: "Início" },
      { href: "/sobre", label: "Sobre Nós" },
      { href: "/kits", label: "Kits" },
    ],
    [],
  );

  // Itens do dropdown - Memoizado
  const dropdownItems = useMemo(
    () => [
      {
        label: "Minha Conta",
        href: "/profile",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
        ),
      },
      {
        label: "Meus Pedidos",
        href: "/orders",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h4.125M8.25 8.25h4.125"
            />
          </svg>
        ),
      },
      { separator: true },
      {
        label: "Sair",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
            />
          </svg>
        ),
      },
    ],
    [],
  );

  const cartAriaLabel = useMemo(
    () =>
      totalItems > 0
        ? `Abrir sua sacola (${totalItems} item${totalItems !== 1 ? "s" : ""})`
        : "Abrir sua sacola",
    [totalItems],
  );

  const cartBadgeDisplay = useMemo(() => {
    return totalItems > 9 ? "9+" : totalItems;
  }, [totalItems]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm md:bg-brand-offwhite/80 md:backdrop-blur-md border-b border-gray-200/50 transition-colors duration-300">
      <div
        className={`max-w-7xl mx-auto px-6 flex justify-between items-center text-brand-softblack h-14 md:h-auto md:transition-all md:duration-300 ${isScrolled ? "md:py-2" : "md:py-4"}`}
      >
        {/* MOBILE: LADO ESQUERDO - Menu Hambúrguer */}
        <div className="flex-1 flex items-center space-x-6 md:hidden">
          <button
            onClick={handleOpenMenu}
            className="flex flex-col space-y-1.5 w-6 min-h-[44px] min-w-[44px] items-center justify-center -ml-2 -my-2 p-2 group active:opacity-70 transition-opacity"
            aria-label="Abrir menu de navegação"
            aria-expanded={false}
          >
            <span className="h-0.5 w-full bg-brand-softblack transition-all"></span>
            <span className="h-0.5 w-full bg-brand-softblack"></span>
            <span className="h-0.5 w-full bg-brand-softblack transition-all"></span>
          </button>

          {/* Command Palette Search - Mobile */}
          <div className="-ml-2 -my-2">
            <SiteSearch />
          </div>
        </div>

        {/* DESKTOP: LADO ESQUERDO - Menu de Links */}
        <div className="hidden md:flex flex-1 items-center space-x-8">
          {desktopMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs uppercase tracking-[0.2em] font-light text-brand-softblack hover:opacity-60 transition-opacity"
            >
              {item.label}
            </Link>
          ))}

          {/* Command Palette Search */}
          <SiteSearch />
        </div>

        {/* LOGO CENTRAL */}
        <Link
          href="/"
          className="text-xl font-extralight tracking-[0.4em] uppercase cursor-pointer absolute left-1/2 -translate-x-1/2 hover:opacity-70 transition-opacity"
          aria-label="Ir para página inicial"
        >
          VIOS
        </Link>

        {/* LADO DIREITO: Sacola + Avatar/Login */}
        <div className="flex-1 flex justify-end items-center space-x-4">
          {/* Sacola — abre drawer lateral */}
          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -my-2 p-2 active:opacity-70 md:hover:opacity-50 transition-opacity relative"
            aria-label={cartAriaLabel}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            {totalItems > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-softblack text-white text-[8px] font-medium rounded-full flex items-center justify-center">
                {cartBadgeDisplay}
              </span>
            )}
            <span className="ml-2 text-[10px] uppercase tracking-[0.2em] font-medium md:hidden">
              ({totalItems})
            </span>
          </button>

          {/* Avatar/Login - Apenas Desktop */}
          <div className="hidden md:block">
            {user ? (
              <DropdownMenu items={dropdownItems} align="right">
                <Avatar
                  src={profile?.avatar_url || null}
                  name={profile?.full_name || user.email || null}
                  size="md"
                />
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center -my-2 p-2 hover:opacity-60 transition-opacity"
                aria-label="Fazer login"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Memoizar componente inteiro
export default memo(Navbar);
