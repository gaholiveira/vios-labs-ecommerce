"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

/**
 * Página intermediária com botão obrigatório (recomendação Supabase).
 * Evita que scanners de email consumam o token antes do usuário.
 * O exchange só ocorre quando o usuário clica explicitamente.
 */
function ConfirmContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next");
  const isRecovery =
    type === "recovery" ||
    next === "/update-password" ||
    next === "/reset-password";

  const handleContinue = async () => {
    if (!code) {
      window.location.replace(
        "/forgot-password?error=" +
          encodeURIComponent("Link inválido. Solicite um novo.")
      );
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      setLoading(false);
      if (isRecovery) {
        window.location.replace(
          "/forgot-password?error=" +
            encodeURIComponent(
              "Link expirado ou já utilizado. Solicite um novo."
            )
        );
      } else {
        window.location.replace(
          "/login?email-confirmed=true&message=" +
            encodeURIComponent(
              "Link expirado ou já utilizado. Se você já confirmou, faça login com seu email e senha."
            )
        );
      }
      return;
    }

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
  };

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-offwhite px-6">
        <div className="text-center">
          <p className="text-brand-softblack/60 text-sm font-light mb-4">
            Link inválido. Solicite um novo.
          </p>
          <Link
            href="/forgot-password"
            className="text-brand-green text-sm uppercase tracking-widest hover:underline"
          >
            Recuperar acesso
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-offwhite px-6">
      <div className="max-w-md w-full bg-white p-8 md:p-12 shadow-sm border border-gray-100 text-center">
        <h1 className="text-2xl md:text-3xl font-light uppercase tracking-widest mb-6 text-brand-softblack">
          {isRecovery ? "Redefinir Senha" : "Confirmar Email"}
        </h1>
        <p className="text-sm font-light text-brand-softblack/70 leading-relaxed mb-8">
          {isRecovery
            ? "Clique no botão abaixo para continuar e criar uma nova senha."
            : "Clique no botão abaixo para confirmar seu email e continuar para o login."}
        </p>

        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="w-full bg-brand-green text-brand-offwhite py-4 uppercase text-xs tracking-[0.2em] hover:bg-brand-softblack transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Processando…</span>
            </span>
          ) : (
            "Continuar"
          )}
        </button>

        <Link
          href="/login"
          className="block mt-8 text-[10px] uppercase tracking-widest opacity-60 text-brand-softblack hover:text-brand-green transition-colors"
        >
          ← Voltar para o login
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-offwhite">
          <p className="text-brand-softblack/60 text-sm font-light">
            Carregando…
          </p>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
