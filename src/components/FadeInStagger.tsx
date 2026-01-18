"use client";

import { motion } from "framer-motion";

interface FadeInStaggerProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
}

export default function FadeInStagger({
  children,
  index = 0,
  className = "",
}: FadeInStaggerProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
        delay: index * 0.1,
      }}
    >
      {children}
    </motion.div>
  );
}
