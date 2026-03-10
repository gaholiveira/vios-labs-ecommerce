"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLenis } from "lenis/react";
import { useStickyBar } from "@/context/StickyBarContext";

interface StickyBarProps {
  productName: string;
  price?: number;
  productId?: string;
  onAddToCart: () => void;
  onBuyNow?: () => void;
  isOutOfStock?: boolean;
  isLoading?: boolean;
  onWaitlistClick?: () => void;
  isPresale?: boolean;
  /** Quando true, a barra fica sempre visível (sem depender do scroll) */
  alwaysVisible?: boolean;
  /** CTA principal (ex.: "Quero dormir melhor") — substitui "Comprar agora" */
  ctaPrimary?: string;
}

export default function StickyBar({
  productName,
  onAddToCart,
  onBuyNow,
  isOutOfStock = false,
  isLoading = false,
  alwaysVisible = false,
  ctaPrimary,
}: StickyBarProps) {
  const [triggerOutOfView, setTriggerOutOfView] = useState(false);
  const { setStickyBarVisible } = useStickyBar() ?? { setStickyBarVisible: () => {} };

  const checkVisibility = useCallback(() => {
    if (alwaysVisible) {
      setTriggerOutOfView(true);
      setStickyBarVisible(true);
      return;
    }
    const trigger = document.querySelector("[data-sticky-bar-trigger]");
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    // Trigger está fora da viewport quando sai pela parte superior
    const isOut = rect.bottom < 0;
    setTriggerOutOfView(isOut);
    setStickyBarVisible(isOut);
  }, [alwaysVisible, setStickyBarVisible]);

  // Lenis (desktop): callback no scroll
  useLenis(checkVisibility, [checkVisibility]);

  useEffect(() => {
    if (alwaysVisible) {
      setTriggerOutOfView(true);
      setStickyBarVisible(true);
      return;
    }

    // Verificação inicial (DOM pronto)
    const initTimer = setTimeout(checkVisibility, 150);

    // Scroll nativo (mobile sem Lenis) + resize
    const handleScroll = () => requestAnimationFrame(checkVisibility);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [alwaysVisible, checkVisibility]);

  // Ao desmontar: resetar estado global para o WhatsApp
  useEffect(() => () => setStickyBarVisible(false), [setStickyBarVisible]);

  const isVisible = triggerOutOfView;

  const barContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-[45] bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Nome do Produto */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-light uppercase tracking-[0.1em] text-brand-softblack truncate">
                {productName}
              </p>
            </div>

            {/* Comprar agora (Link) ou Colocar na sacola (button) — Link evita router.push e problemas com Fast Refresh */}
            {isOutOfStock || isLoading ? (
              <button
                disabled
                className="flex-shrink-0 border rounded-sm px-4 py-2.5 min-h-[44px] uppercase tracking-[0.2em] text-xs font-medium whitespace-nowrap border-stone-300 bg-stone-200 text-stone-500 cursor-not-allowed"
                aria-label={isLoading ? "Carregando" : "Esgotado"}
              >
                {isLoading ? "Carregando..." : "Esgotado"}
              </button>
            ) : onBuyNow ? (
              <Link
                href="/checkout"
                onClick={onBuyNow}
                className="flex flex-shrink-0 items-center justify-center border rounded-sm px-4 py-2.5 min-h-[44px] uppercase tracking-[0.2em] text-xs font-medium transition-all duration-300 whitespace-nowrap border-brand-green bg-brand-green text-brand-offwhite hover:bg-brand-softblack hover:border-brand-softblack"
                aria-label={ctaPrimary ?? "Comprar agora"}
              >
                {ctaPrimary ?? "Comprar agora"}
              </Link>
            ) : (
              <button
                onClick={onAddToCart}
                className="flex-shrink-0 border rounded-sm px-4 py-2.5 min-h-[44px] uppercase tracking-[0.2em] text-xs font-medium transition-all duration-300 whitespace-nowrap border-brand-green bg-brand-green text-brand-offwhite hover:bg-brand-softblack hover:border-brand-softblack"
                aria-label="Colocar na sacola"
              >
                Colocar na sacola
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Renderizar no body para evitar interferência de containers com overflow
  if (typeof document !== "undefined") {
    return createPortal(barContent, document.body);
  }
  return barContent;
}
