"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Capturar session_id da URL no cliente
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSessionId(params.get("session_id"));
    }
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-brand-offwhite flex items-start justify-center px-6 pt-32 md:pt-40 pb-24">
      <div className="max-w-md w-full text-center mt-8 md:mt-16">
        {/* Ícone de Check Animado */}
        <div className="flex justify-center mb-10 md:mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="relative w-24 h-24 rounded-full bg-brand-green/10 flex items-center justify-center"
          >
            <svg
              className="w-16 h-16 text-brand-green"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Círculo */}
              <motion.circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.2 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
              {/* Check */}
              <motion.path
                d="M8 12 L11 15 L16 8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.5,
                  ease: "easeOut",
                }}
              />
            </svg>
          </motion.div>
        </div>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-3xl md:text-4xl font-extralight uppercase tracking-widest mb-8 md:mb-10 text-brand-softblack"
        >
          Pedido Confirmado
        </motion.h1>

        {/* Texto */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-base md:text-lg font-light text-brand-softblack/70 mb-10 md:mb-12 leading-relaxed max-w-sm mx-auto"
        >
          Obrigado por escolher a VIOS. Você receberá os detalhes por e-mail.
        </motion.p>

        {/* Session ID (Opcional - para debug/referência) */}
        {sessionId && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="text-xs text-brand-softblack/40 mb-8 font-mono"
          >
            ID: {sessionId.substring(0, 20)}...
          </motion.p>
        )}

        {/* Botão Voltar para a Loja */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <Link
            href="/"
            className="inline-block border border-brand-green rounded-sm text-brand-green bg-transparent px-10 py-4 min-h-[44px] text-xs uppercase tracking-[0.2em] font-medium active:bg-brand-green/10 active:border-brand-green md:hover:bg-brand-green md:hover:text-brand-offwhite md:hover:border-brand-green transition-all duration-500 ease-out md:transform md:hover:scale-105"
          >
            Voltar para a Loja
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
