"use client";

import { memo } from "react";
import TextReveal from "@/components/ui/text-reveal";

function AboutSection() {
  return (
    <section className="bg-brand-offwhite py-24 px-6">
      <div className="max-w-3xl mx-auto text-center md:transition-all md:duration-500 md:ease-out md:hover:-translate-y-1 md:hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
        {/* Subtítulo discreto */}
        <span className="inline-block text-brand-green uppercase tracking-[0.4em] text-[10px] font-semibold mb-6 md:transition-all md:duration-500 md:ease-out md:hover:-translate-y-1">
          A Nossa Essência
        </span>

        {/* Título Principal com TextReveal */}
        <div className="md:transition-all md:duration-500 md:ease-out md:hover:-translate-y-1">
          <TextReveal
            text="Design minimalista para quem valoriza o essencial."
            el="h2"
            className="text-brand-softblack text-3xl md:text-4xl font-light uppercase tracking-tighter leading-tight mb-8"
            delay={0.2}
            duration={0.6}
          />
        </div>

        {/* Texto de Apoio */}
        <p className="text-brand-softblack/70 text-sm md:text-base font-light leading-relaxed tracking-wide md:transition-all md:duration-500 md:ease-out md:hover:-translate-y-1">
          A VIOS LABS nasceu do desejo de simplificar a busca pelo bem-estar. Em
          um mundo de excessos, escolhemos a clareza. Nossos produtos unem
          ativos de alta pureza a uma estética que inspira calma e foco. Somos a
          ponte entre o cuidado que seu corpo exige e o estilo de vida que você
          merece. Essencial, transparente e eficiente.
        </p>

        {/* Link minimalista – estilo luxo */}
        <div className="mt-10">
          <a
            href="/sobre"
            className="inline-block text-brand-softblack text-[10px] uppercase tracking-wider font-light border-b border-brand-green/80 pb-2 hover:text-brand-green hover:border-brand-green md:hover:-translate-y-1 md:hover:shadow-[0_10px_24px_rgba(10,51,35,0.12)] transition-all duration-500 ease-out"
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
