"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[Error Boundary]", error.message, error.digest);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 bg-brand-offwhite">
      <div className="max-w-md text-center">
        <span className="block text-[10px] uppercase tracking-[0.3em] text-brand-softblack/60 mb-4">
          Algo inesperado aconteceu
        </span>
        <h1 className="text-2xl md:text-3xl font-light uppercase tracking-tighter text-brand-softblack mb-4">
          Erro na página
        </h1>
        <p className="text-sm font-light text-brand-softblack/80 mb-8 leading-relaxed">
          Pedimos desculpas pelo inconveniente. Nossa equipe foi notificada.
          Tente novamente ou retorne à página inicial.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={reset}
            className="border border-brand-green rounded-sm px-8 py-3 text-xs font-medium uppercase tracking-[0.2em] text-brand-green hover:bg-brand-green hover:text-brand-offwhite transition-colors duration-200"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="border border-brand-softblack/20 rounded-sm px-8 py-3 text-xs font-medium uppercase tracking-[0.2em] text-brand-softblack/80 hover:border-brand-softblack hover:text-brand-softblack transition-colors duration-200"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
