'use client';

import { memo } from 'react';
import TextReveal from '@/components/ui/text-reveal';

function AboutSection() {
  return (
    <section className="bg-brand-offwhite py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* Subtítulo discreto */}
        <span className="text-brand-green uppercase tracking-[0.4em] text-[10px] font-semibold mb-6 block">
          A Nossa Essência
        </span>
        
        {/* Título Principal com TextReveal */}
        <TextReveal
          text="Design minimalista para quem valoriza o essencial."
          el="h2"
          className="text-brand-softblack text-3xl md:text-4xl font-light uppercase tracking-tighter leading-tight mb-8"
          delay={0.2}
          duration={0.6}
        />

        {/* Texto de Apoio */}
        <p className="text-brand-softblack/70 text-sm md:text-base font-light leading-relaxed tracking-wide">
          A VIOS LABS nasceu do desejo de simplificar a busca pelo bem-estar. Em um mundo de excessos, escolhemos a clareza. Nossos produtos unem ativos de alta pureza a uma estética que inspira calma e foco. Somos a ponte entre o cuidado que seu corpo exige e o estilo de vida que você merece. Essencial, transparente e eficiente.
        </p>

        {/* Link ou Botão discreto */}
        <div className="mt-10">
          <a 
            href="/sobre" 
            className="text-brand-softblack text-[10px] uppercase tracking-[0.3em] font-medium border-b border-brand-green pb-2 hover:text-brand-green transition-colors"
          >
            Conheça a nossa história
          </a>
        </div>
      </div>
    </section>
  );
}

// Memoizar AboutSection pois é conteúdo estático
export default memo(AboutSection);