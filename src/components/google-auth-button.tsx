"use client";

import { useState, useCallback, memo, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface GoogleAuthButtonProps {
  /** Texto do botão. Default: "Continuar com Google" */
  label?: string;
  /** Callback após sucesso (antes do redirect) */
  onSuccess?: () => void;
  /** Callback de erro */
  onError?: (error: string) => void;
  /** URL de redirecionamento após login (default: /) */
  redirectTo?: string;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Botão de Login com Google - Estilo High-End
 * Otimizado para performance e acessibilidade
 */
function GoogleAuthButton({
  label = "Continuar com Google",
  onSuccess,
  onError,
  redirectTo,
  className = "",
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  // Resetar loading quando o componente é montado novamente ou quando o usuário volta
  useEffect(() => {
    // Resetar ao montar (caso o usuário tenha voltado)
    setLoading(false);

    // Verificar se voltou de uma ação de processamento (mais confiável que popstate)
    const handlePageShow = (event: PageTransitionEvent) => {
      // Se a página foi carregada do cache (botão voltar), resetar estados
      if (event.persisted || (performance.navigation && performance.navigation.type === 2)) {
        setLoading(false);
        // Forçar reload se detectar que voltou de uma ação de processamento
        const wasProcessing = sessionStorage.getItem('google_auth_processing');
        if (wasProcessing === 'true') {
          sessionStorage.removeItem('google_auth_processing');
          // Pequeno delay para evitar loop infinito
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      }
    };

    // Resetar quando o usuário usa o botão voltar do navegador
    const handlePopState = () => {
      setLoading(false);
      // Verificar se estava processando
      const wasProcessing = sessionStorage.getItem('google_auth_processing');
      if (wasProcessing === 'true') {
        sessionStorage.removeItem('google_auth_processing');
        // Forçar reload para garantir reset completo
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);
      // Marcar que estamos processando login (para detectar volta)
      sessionStorage.setItem('google_auth_processing', 'true');
      
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      if (redirectTo) {
        sessionStorage.setItem("oauth_redirect", redirectTo);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        onError?.(error.message || "Erro ao conectar com Google");
        setLoading(false);
        sessionStorage.removeItem('google_auth_processing'); // Limpar flag
        return;
      }

      // Limpar flag antes de redirecionar (sucesso)
      sessionStorage.removeItem('google_auth_processing');
      onSuccess?.();
    } catch (err: any) {
      onError?.(err.message || "Erro inesperado ao conectar com Google");
      setLoading(false);
      sessionStorage.removeItem('google_auth_processing'); // Limpar flag
    }
  }, [loading, redirectTo, onSuccess, onError]);

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className={`
        w-full h-12 
        flex items-center justify-center gap-3
        border border-brand-green/30 
        bg-transparent 
        text-brand-green 
        text-sm font-medium
        transition-colors duration-200
        hover:bg-brand-green/5 hover:border-brand-green/50
        active:bg-brand-green/10
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2
        ${className}
      `}
      aria-label={loading ? "A conectar com Google..." : label}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5 text-brand-green"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>A conectar...</span>
        </>
      ) : (
        <>
          {/* Google Logo SVG - versão monocromática verde */}
          <svg
            className="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            fill="currentColor"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

export default memo(GoogleAuthButton);
