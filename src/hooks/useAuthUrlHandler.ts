"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface UseAuthUrlHandlerOptions {
  onEmailConfirmed?: () => void;
}

/**
 * Detecta parâmetros de autenticação/erro na URL (vindos do Supabase OAuth)
 * e aplica os redirecionamentos ou limpezas necessárias.
 *
 * Casos tratados:
 * - `?code=` → redireciona para /auth/callback (OAuth entrou na home por config errada)
 * - `?error=access_denied&error_code=otp_expired` → redireciona para /forgot-password
 * - outros erros de auth → limpa a URL
 * - `?email-confirmed=true` → dispara callback e limpa a URL
 */
export function useAuthUrlHandler({ onEmailConfirmed }: UseAuthUrlHandlerOptions = {}) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const errorCode = params.get("error_code");
    const emailConfirmed = params.get("email-confirmed");

    if (code) {
      const callbackUrl = `/auth/callback${new URL(window.location.href).search}`;
      router.replace(callbackUrl);
      return;
    }

    if (error === "access_denied" && errorCode === "otp_expired") {
      const message =
        "Link de redefinição de senha expirado ou inválido. Por favor, solicite um novo link.";
      router.replace(`/forgot-password?error=${encodeURIComponent(message)}`);
      return;
    }

    if (error || errorCode) {
      window.history.replaceState({}, "", "/");
    }

    if (emailConfirmed === "true") {
      onEmailConfirmed?.();
      window.history.replaceState({}, "", "/");
    }
  }, [router, onEmailConfirmed]);
}
