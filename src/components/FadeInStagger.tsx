"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";

interface FadeInStaggerProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
}

function FadeInStagger({
  children,
  index = 0,
  className = "",
}: FadeInStaggerProps) {
  // Memoizar configuração de transição para evitar recálculo
  const transition = useMemo(() => ({
    duration: 0.8,
    ease: "easeOut" as const,
    delay: index * 0.1,
  }), [index]);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

// Memoizar componente para evitar re-renders desnecessários
export default memo(FadeInStagger);
