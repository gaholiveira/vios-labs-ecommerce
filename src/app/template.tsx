"use client";

import { motion } from "framer-motion";

interface TemplateProps {
  children: React.ReactNode;
}

/**
 * Template com transição 'Cinematic Reveal' para páginas
 * 
 * Efeito cinematográfico de alta qualidade:
 * - Blur inicial disfarça o corte seco
 * - Duração de 0.8s cria sensação de calma e luxo
 * - Curva Bézier [0.25, 1, 0.5, 1] desacelera muito suavemente
 * - Elimina o 'hard cut' e o 'piscar' durante navegação
 */
export default function Template({ children }: TemplateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.8,
        ease: [0.25, 1, 0.5, 1], // Curva Bézier que desacelera muito suavemente no final
      }}
    >
      {children}
    </motion.div>
  );
}
