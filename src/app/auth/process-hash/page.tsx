"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

/**
 * Processa tokens no hash (implicit flow) e salva a sessão em cookies.
 * Usado quando o reset de senha usa implicit flow — tokens vêm no # da URL.
 * O cliente do CDN usa localStorage; nosso createClient usa cookies (SSR).
 */
function ProcessHashContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash?.slice(1);
    if (!hash) {
      window.location.replace(
        "/login?error=no-code&message=" +
          encodeURIComponent("Link inválido. Verifique seu email.")
      );
      return;
    }

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");
    const error = params.get("error");
    const errorDescription = params.get("error_description");
    const next = searchParams.get("next");
    const isRecovery =
      type === "recovery" ||
      next === "/update-password" ||
      next === "/reset-password";

    if (error) {
      const msg = errorDescription
        ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
        : "Erro ao processar o link.";
      const target =
        type === "recovery"
          ? "/forgot-password?error="
          : "/login?error=auth-error&message=";
      window.location.replace(target + encodeURIComponent(msg));
      return;
    }

    if (!accessToken || !refreshToken) {
      window.location.replace(
        "/login?error=no-code&message=" +
          encodeURIComponent("Link inválido. Verifique seu email.")
      );
      return;
    }

    const supabase = createClient();

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(() => {
        // Limpar hash da URL antes de redirecionar (segurança)
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        if (isRecovery) {
          window.location.replace("/update-password");
        } else if (type === "signup" || type === "email") {
          window.location.replace(
            "/login?email-confirmed=true&message=" +
              encodeURIComponent(
                "Email confirmado! Faça login com o email e senha que você definiu no cadastro."
              )
          );
        } else {
          window.location.replace("/");
        }
      })
      .catch(() => {
        window.location.replace(
          "/login?error=auth-error&message=" +
            encodeURIComponent("Erro ao processar. Tente novamente.")
        );
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-offwhite">
      <p className="text-brand-softblack/60 text-sm font-light">
        Processando…
      </p>
    </div>
  );
}

export default function ProcessHashPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-offwhite">
          <p className="text-brand-softblack/60 text-sm font-light">
            Processando…
          </p>
        </div>
      }
    >
      <ProcessHashContent />
    </Suspense>
  );
}
