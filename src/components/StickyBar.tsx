"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StickyBarProps {
  productName: string;
  price: number;
  productId: string;
  onAddToCart: () => void;
  isOutOfStock?: boolean;
  onWaitlistClick?: () => void;
  isPresale?: boolean;
}

export default function StickyBar({
  productName,
  onAddToCart,
  isOutOfStock = false,
}: StickyBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  // IntersectionObserver evita reflow forçado (não lê getBoundingClientRect no scroll)
  useEffect(() => {
    const trigger = document.querySelector("[data-sticky-bar-trigger]");
    if (!trigger) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      {
        rootMargin: "-1px 0px 0px 0px",
        threshold: 0,
      },
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-[45] bg-white/95 backdrop-blur-sm md:bg-white border-t border-gray-200 shadow-lg md:hidden"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Nome do Produto */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-light uppercase tracking-[0.1em] text-brand-softblack truncate">
                {productName}
              </p>
            </div>

            {/* Botão Colocar na sacola */}
            <button
              onClick={onAddToCart}
              disabled={isOutOfStock}
              className={`flex-shrink-0 border rounded-sm px-4 py-2.5 min-h-[44px] uppercase tracking-[0.2em] text-xs font-medium transition-all duration-300 whitespace-nowrap ${
                isOutOfStock
                  ? "border-stone-300 bg-stone-200 text-stone-500 cursor-not-allowed"
                  : "border-brand-green bg-brand-green text-brand-offwhite hover:bg-brand-softblack hover:border-brand-softblack"
              }`}
              aria-label={isOutOfStock ? "Esgotado" : "Colocar na sacola"}
            >
              {isOutOfStock ? "Esgotado" : "Na sacola"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
