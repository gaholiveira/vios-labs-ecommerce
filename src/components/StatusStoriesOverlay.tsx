"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { StatusItem } from "@/constants/status";

interface StatusStoriesOverlayProps {
  item: StatusItem | null;
  onClose: () => void;
}

export default function StatusStoriesOverlay({ item, onClose }: StatusStoriesOverlayProps) {
  useEffect(() => {
    if (!item) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black flex flex-col cursor-default"
        >
          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Imagem fullscreen — preenche toda a tela, clique fecha */}
          <div className="absolute inset-0">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>

          {/* Overlay inferior com título e CTA */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-8 px-6">
            <p className="text-brand-offwhite text-lg font-light uppercase tracking-wider mb-4">
              {item.title}
            </p>
            {item.link && (
              <Link
                href={item.link}
                onClick={onClose}
                className="inline-block border border-brand-offwhite text-brand-offwhite px-8 py-3 text-xs uppercase tracking-wider font-light hover:bg-brand-offwhite hover:text-brand-softblack transition-colors"
              >
                Ver mais
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
