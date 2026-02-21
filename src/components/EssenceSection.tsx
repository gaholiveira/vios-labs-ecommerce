"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const EASE_SMOOTH = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      staggerDirection: 1,
    },
  },
};

const revealVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: EASE_SMOOTH,
    },
  },
};

export default function EssenceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      ref={sectionRef}
      className="bg-brand-green py-24 px-6"
    >
      <motion.div
        className="max-w-4xl mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <motion.span
          variants={revealVariants}
          className="inline-block text-brand-champagne uppercase tracking-[0.4em] text-[10px] font-semibold mb-6"
        >
          A ESSÊNCIA
        </motion.span>

        <motion.h2
          variants={revealVariants}
          className="text-brand-offwhite text-3xl md:text-4xl font-light uppercase tracking-tighter leading-tight mb-6"
        >
          O que está por trás de cada produto VIOS
        </motion.h2>

        <motion.p
          variants={revealVariants}
          className="text-brand-offwhite/80 text-sm md:text-base font-light leading-relaxed tracking-wide max-w-2xl mx-auto mb-10"
        >
          Não trabalhamos com respostas imediatas, mas com ajuste gradual.
          Descubra nossa filosofia.
        </motion.p>

        <motion.div variants={revealVariants}>
          <Link
            href="/essencia"
            className="inline-block border border-brand-offwhite/90 rounded-sm px-10 md:px-12 py-4 md:py-5 min-h-[44px] text-xs md:text-sm uppercase tracking-wider text-brand-offwhite font-light active:bg-brand-offwhite active:text-brand-green active:border-brand-offwhite md:hover:bg-brand-offwhite md:hover:text-brand-green md:hover:border-brand-offwhite md:transition-all md:duration-500 md:ease-out"
          >
            Conhecer nossa filosofia
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
