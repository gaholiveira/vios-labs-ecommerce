"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useMemo, useEffect, useState } from "react";

interface TextRevealProps {
  text: string;
  el?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div" | "span";
  className?: string;
  delay?: number;
  duration?: number;
}

export default function TextReveal({
  text,
  el: Element = "h1",
  className = "",
  delay = 0,
  duration = 0.5,
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px", amount: 0.1 });
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Verificar se o elemento já está visível no mount (para hero section no topo)
  // Usa requestAnimationFrame para evitar reflow forçado — lê layout após o paint
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rafId = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isVisible) {
        timerRef.current = setTimeout(() => setShouldAnimate(true), 100);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Atualizar quando isInView mudar
  useEffect(() => {
    if (isInView) {
      setShouldAnimate(true);
    }
  }, [isInView]);

  // Quebrar texto em palavras
  const words = useMemo(() => text.split(" "), [text]);

  // Container variants com stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: delay,
      },
    },
  };

  // Word variants com blur effect (o segredo do luxo)
  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: "blur(10px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: duration,
        ease: "easeOut" as const,
      },
    },
  };

  // Criar elemento dinâmico
  const ElementComponent = Element as any;

  return (
    <>
      {/* Texto completo para leitores de tela e SEO */}
      <span className="sr-only">{text}</span>

      {/* Elemento com classe aplicada */}
      <ElementComponent className={className}>
        {/* Motion span com ref para useInView - este é o container animado */}
        <motion.span
          ref={ref}
          aria-hidden="true"
          variants={containerVariants}
          initial="hidden"
          animate={shouldAnimate || isInView ? "visible" : "hidden"}
          className="inline-block"
        >
          {words.map((word, index) => (
            <motion.span
              key={`${word}-${index}`}
              variants={wordVariants}
              className="inline-block"
              style={{ marginRight: index < words.length - 1 ? "0.25em" : "0" }}
            >
              {word}
            </motion.span>
          ))}
        </motion.span>
      </ElementComponent>
    </>
  );
}
