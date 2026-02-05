"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

const EASE_SMOOTH = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
      staggerDirection: 1,
    },
  },
};

const focusRevealVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: EASE_SMOOTH,
    },
  },
};

export interface AboutSectionImage {
  src: string;
  alt: string;
}

interface AboutSectionProps {
  /** Imagem opcional com parallax sutil (apenas md+). */
  image?: AboutSectionImage;
}

export default function AboutSection({ image }: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 0.5, 1], ["-10%", "0%", "10%"]);

  const hasImage = Boolean(image);

  return (
    <section
      ref={sectionRef}
      className="bg-brand-offwhite py-24 px-6"
    >
      <div
        className={`group max-w-6xl mx-auto flex flex-col ${hasImage ? "md:flex-row md:items-center md:gap-16" : ""} md:transition-all md:duration-500 md:ease-out md:hover:bg-[#F7F6F2] md:rounded-xl md:p-8`}
      >
        {/* Coluna de texto */}
        <motion.div
          className={`max-w-3xl mx-auto flex-1 ${hasImage ? "md:mx-0 text-center md:text-left" : "text-center"} md:transition-transform md:duration-500 md:ease-out md:group-hover:-translate-y-1`}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.span
            variants={focusRevealVariants}
            className="inline-block text-brand-green uppercase tracking-[0.4em] text-[10px] font-semibold mb-6"
          >
            A Nossa Essência
          </motion.span>

          <motion.h2
            variants={focusRevealVariants}
            className="text-brand-softblack text-3xl md:text-4xl font-light uppercase tracking-tighter leading-tight mb-8 md:transition-colors md:duration-500 md:ease-out md:group-hover:text-brand-green"
          >
            Design minimalista para quem valoriza o essencial.
          </motion.h2>

          <motion.p
            variants={focusRevealVariants}
            className="text-brand-softblack/70 text-sm md:text-base font-light leading-relaxed tracking-wide"
          >
            A VIOS LABS nasceu do desejo de simplificar a busca pelo bem-estar. Em
            um mundo de excessos, escolhemos a clareza. Nossos produtos unem
            ativos de alta pureza a uma estética que inspira calma e foco. Somos a
            ponte entre o cuidado que seu corpo exige e o estilo de vida que você
            merece. Essencial, transparente e eficiente.
          </motion.p>

          <motion.div variants={focusRevealVariants} className="mt-10">
            <a
              href="/sobre"
              className="inline-block border border-brand-softblack/90 rounded-sm px-10 md:px-12 py-4 md:py-5 min-h-[44px] text-xs md:text-sm uppercase tracking-wider text-brand-softblack font-light active:bg-brand-green active:text-brand-offwhite active:border-brand-green md:hover:bg-brand-green md:hover:text-brand-offwhite md:hover:border-brand-green md:transition-all md:duration-500 md:ease-out md:transform md:group-hover:-translate-y-1"
            >
              Conheça a nossa história
            </a>
          </motion.div>
        </motion.div>

        {/* Imagem com parallax – apenas md+ (mobile sem parallax para performance) */}
        {image && (
          <div className="hidden md:block flex-1 max-w-md md:mx-0 mt-12 md:mt-0 overflow-hidden rounded-sm">
            <motion.div
              className="relative aspect-[4/5] w-full md:transition-transform md:duration-700 md:ease-out md:group-hover:scale-105"
              style={{ y: imageY }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 768px) 0px, 448px"
                className="object-cover"
                priority={false}
              />
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
