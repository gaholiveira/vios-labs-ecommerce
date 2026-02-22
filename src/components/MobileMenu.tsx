"use client";
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import Avatar from "@/components/ui/Avatar";

function MobileMenu() {
  const { isMenuOpen, setIsMenuOpen } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Resetar loading quando o componente é montado novamente ou quando o usuário volta
  useEffect(() => {
    // Resetar ao montar (caso o usuário tenha voltado)
    setLoading(false);
    setLoggingOut(false);

    // Resetar quando o usuário usa o botão voltar do navegador
    const handlePopState = () => {
      setLoading(false);
      setLoggingOut(false);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Prevenir scroll quando menu está aberto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const getUser = async () => {
      if (!isMenuOpen) return;
      setLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        // Carregar perfil se usuário estiver logado
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .single();

          setProfile(data || { full_name: null, avatar_url: null });
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [isMenuOpen]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    setIsMenuOpen(false); // Fechar menu antes do logout

    try {
      // Importar e usar função centralizada de logout
      const { handleLogout: logout } = await import("@/utils/auth");
      await logout();
      // Não precisa setLoggingOut(false) pois a página será recarregada
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo com erro, tentar redirecionar
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }, [setIsMenuOpen]);

  const handleLinkClick = useCallback(() => {
    setIsMenuOpen(false);
  }, [setIsMenuOpen]);

  // Memoizar menuItems para evitar recriação
  const menuItems = useMemo(
    () => [
      { href: "/", label: "Início", icon: "home" },
      { href: "/essencia", label: "A Essência", icon: "star" },
      { href: "/sobre", label: "Sobre Nós", icon: "info" },
      { href: "/kits", label: "Kits", icon: "box" },
    ],
    [],
  );

  return (
    <>
      {/* Overlay com animação */}
      <div
        className={`fixed inset-0 bg-black/40 z-[80] transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={handleLinkClick}
        aria-hidden="true"
      />

      {/* Menu lateral */}
      <div
        className={`fixed left-0 top-0 h-full w-[85%] max-w-sm bg-brand-offwhite z-[90] shadow-2xl transition-transform duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        <div className="p-6 md:p-8 flex flex-col h-full">
          {/* Header do Menu - Botão Fechar */}
          <div className="flex justify-end items-center mb-6">
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* SEÇÃO DE DESTAQUE - TOPO DO MENU */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <svg
                  className="animate-spin h-5 w-5 text-brand-softblack"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : user ? (
              /* Usuário Logado - Avatar Grande + Nome + E-mail */
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-3">
                  <Avatar
                    src={profile?.avatar_url || null}
                    name={profile?.full_name || user.email || null}
                    size="lg"
                  />
                  <div className="text-center">
                    {profile?.full_name && (
                      <h3 className="text-sm font-medium text-brand-softblack mb-1">
                        {profile.full_name}
                      </h3>
                    )}
                    <p className="text-xs text-brand-softblack/60">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 pt-4">
                  <Link
                    href="/profile"
                    onClick={handleLinkClick}
                    className="flex items-center justify-center space-x-2 py-3 px-4 text-xs uppercase tracking-[0.2em] font-medium text-brand-softblack bg-gray-50 hover:bg-gray-100 rounded-sm transition-colors"
                  >
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
                    <span>Minha Conta</span>
                  </Link>

                  <Link
                    href="/orders"
                    onClick={handleLinkClick}
                    className="flex items-center justify-center space-x-2 py-3 px-4 text-xs uppercase tracking-[0.2em] font-medium text-brand-softblack bg-gray-50 hover:bg-gray-100 rounded-sm transition-colors"
                  >
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
                    <span>Meus Pedidos</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Usuário Não Logado - Botão Grande "Entrar / Cadastrar" (High-End) */
              <Link
                href="/login"
                onClick={handleLinkClick}
                className="block w-full py-5 px-6 text-center text-xs uppercase tracking-[0.4em] font-light text-brand-offwhite bg-brand-green hover:bg-brand-green/90 active:bg-brand-green/95 rounded-sm transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Entrar / Cadastrar
              </Link>
            )}
          </div>

          {/* Navegação Principal */}
          <nav className="flex-1">
            <ul className="flex flex-col space-y-2">
              {menuItems.map((item) => {
                const IconComponent = () => {
                  switch (item.icon) {
                    case "home":
                      return (
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
                            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                          />
                        </svg>
                      );
                    case "info":
                      return (
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
                            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                          />
                        </svg>
                      );
                    case "star":
                      return (
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
                            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                          />
                        </svg>
                      );
                    case "box":
                      return (
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
                            d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                          />
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

          {/* Botão Sair - Apenas quando logado */}
          {user && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center justify-center space-x-2 py-3 px-4 w-full text-xs uppercase tracking-[0.2em] font-medium text-red-600 hover:bg-red-50 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingOut ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Saindo...</span>
                  </>
                ) : (
                  <>
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
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                      />
                    </svg>
                    <span>Sair da Conta</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Memoizar o componente inteiro para evitar re-renders desnecessários
export default memo(MobileMenu);
