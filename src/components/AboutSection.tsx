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
        className={`max-w-6xl mx-auto flex flex-col ${hasImage ? "md:flex-row md:items-center md:gap-16" : ""}`}
      >
        {/* Coluna de texto */}
        <motion.div
          className={`max-w-3xl mx-auto flex-1 ${hasImage ? "md:mx-0 text-center md:text-left" : "text-center"}`}
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
            className="text-brand-softblack text-3xl md:text-4xl font-light uppercase tracking-tighter leading-tight mb-8"
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
              className="inline-block text-brand-softblack text-[10px] uppercase tracking-wider font-light border-b border-brand-green/80 pb-2 hover:text-brand-green hover:border-brand-green md:hover:-translate-y-0.5 md:hover:shadow-[0_10px_24px_rgba(10,51,35,0.12)] transition-all duration-500 ease-out"
            >
              Conheça a nossa história
            </a>
          </motion.div>
        </motion.div>

        {/* Imagem com parallax – apenas md+ (mobile sem parallax para performance) */}
        {image && (
          <div className="hidden md:block flex-1 max-w-md md:mx-0 mt-12 md:mt-0 overflow-hidden rounded-sm">
            <motion.div
              className="relative aspect-[4/5] w-full"
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
