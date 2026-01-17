import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative min-h-screen bg-brand-offwhite flex items-center justify-center px-6 py-24 overflow-hidden">
      {/* Ícone de Frasco Desbotado no Fundo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <svg
          width="400"
          height="500"
          viewBox="0 0 200 250"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="blur-sm"
        >
          {/* Contorno do Frasco */}
          <path
            d="M100 20 C95 20 90 22 88 25 L80 45 L80 200 C80 210 85 215 90 220 L95 230 C96 232 98 233 100 233 C102 233 104 232 105 230 L110 220 C115 215 120 210 120 200 L120 45 L112 25 C110 22 105 20 100 20 Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          {/* Boca do Frasco */}
          <path
            d="M90 20 L90 25 L110 25 L110 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Linha de medição */}
          <line
            x1="85"
            y1="120"
            x2="115"
            y2="120"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
          <line
            x1="85"
            y1="140"
            x2="115"
            y2="140"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        </svg>
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Título */}
        <h1 className="text-4xl md:text-6xl font-extralight uppercase tracking-widest mb-6 text-brand-softblack">
          Página não encontrada
        </h1>

        {/* Subtítulo */}
        <p className="text-base md:text-lg font-light text-brand-softblack/60 mb-12 max-w-md mx-auto leading-relaxed">
          Parece que você se perdeu no laboratório.
        </p>

        {/* CTA Botão Premium */}
        <Link
          href="/"
          className="inline-block border border-brand-green rounded-sm bg-brand-green text-brand-offwhite px-10 py-4 min-h-[44px] text-xs uppercase tracking-[0.2em] font-medium active:bg-brand-softblack/80 active:border-brand-softblack md:hover:bg-brand-softblack md:hover:border-brand-softblack transition-all duration-500 ease-out md:transform md:hover:scale-105"
        >
          Voltar à Loja
        </Link>
      </div>
    </main>
  );
}
