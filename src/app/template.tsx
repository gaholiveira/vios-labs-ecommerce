"use client";

import { motion } from "framer-motion";

interface TemplateProps {
  children: React.ReactNode;
}

/**
 * Template com transição 'Soft Reveal' para páginas
 * 
 * Efeito cinematográfico de alta qualidade:
 * - Início rápido com desaceleração suave e elegante
 * - Curva de Bézier personalizada para suavidade extrema
 * - Transição sem piscar, mantendo elegância premium
 */
export default function Template({ children }: TemplateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.75,
        ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier para suavidade extrema
      }}
    >
      {children}
    </motion.div>
  );
}
