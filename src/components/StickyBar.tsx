"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/format";

interface StickyBarProps {
  productName: string;
  price: number;
  productId: string;
  onAddToCart: () => void;
}

export default function StickyBar({
  productName,
  price,
  onAddToCart,
}: StickyBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!buttonRef.current) return;

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const isButtonOutOfView = buttonRect.bottom < 0;

      setIsVisible(isButtonOutOfView);
    };

    // Encontrar o botão original na página
    const originalButton = document.querySelector(
      '[data-sticky-bar-trigger]'
    ) as HTMLButtonElement;

    if (originalButton) {
      buttonRef.current = originalButton;
      window.addEventListener("scroll", handleScroll);
      handleScroll(); // Verificar estado inicial
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
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

            {/* Botão de Comprar */}
            <button
              disabled
              className="flex-shrink-0 border border-gray-300 rounded-sm bg-gray-100 text-gray-500 px-4 py-2.5 min-h-[44px] uppercase tracking-[0.2em] text-xs font-medium cursor-not-allowed transition-all duration-300 whitespace-nowrap"
              aria-label="Produto disponível em breve"
            >
              Disponível em Breve
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
