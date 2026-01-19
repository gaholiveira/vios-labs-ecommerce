'use client';

import { useMobileViewportHeight } from '@/hooks/useMobileViewportHeight';

/**
 * Componente "Coming Soon" minimalista para o Lote Zero
 * Exibido quando sales_open = false
 */
export default function ComingSoon() {
  const viewportHeight = useMobileViewportHeight();

  return (
    <main className="bg-brand-softblack">
      <section 
        className="relative w-full flex items-center justify-center overflow-hidden bg-brand-softblack"
        style={{ 
          height: viewportHeight ? `${viewportHeight}px` : '100svh' 
        }}
      >
        {/* Conteúdo centralizado */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extralight mb-12 uppercase tracking-tighter text-brand-offwhite">
            Em Breve
          </h1>
          <div className="mb-8">
            <p className="text-2xl md:text-3xl font-light tracking-[0.3em] text-brand-green mb-4">
              21.01.2026
            </p>
            <div className="w-24 h-px bg-brand-green/50 mx-auto mb-4"></div>
            <p className="text-sm md:text-base font-light tracking-[0.2em] text-brand-offwhite/70 uppercase">
              Lote Zero
            </p>
          </div>
        </div>

        {/* Linha decorativa inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-brand-green/30"></div>
      </section>
    </main>
  );
}
