"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CheckoutError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[Checkout Error Boundary]", error.message, error.digest);
  }, [error]);

  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16"
      style={{ backgroundColor: "#F9F7F2", color: "#1B2B22" }}
    >
      <div className="max-w-md text-center">
        <span className="block text-[10px] uppercase tracking-[0.3em] opacity-70 mb-4">
          Erro no checkout
        </span>
        <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tighter mb-4">
          Não foi possível carregar
        </h1>
        <p className="text-sm font-light opacity-80 mb-8 leading-relaxed">
          Ocorreu um problema ao carregar o checkout. Sua sacola está segura.
          Tente novamente ou entre em contato se o problema persistir.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={reset}
            className="border-[0.5px] px-6 py-3 text-xs uppercase tracking-[0.2em] transition-colors hover:opacity-80"
            style={{ borderColor: "#1B2B22", color: "#1B2B22" }}
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="border-[0.5px] px-6 py-3 text-xs uppercase tracking-[0.2em] transition-colors hover:opacity-80"
            style={{ borderColor: "#1B2B22", color: "#1B2B22" }}
          >
            Voltar à loja
          </Link>
        </div>
      </div>
    </div>
  );
}
