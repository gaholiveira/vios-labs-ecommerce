"use client";

import { useRef, useEffect, useState, useMemo } from "react";

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Se já está visível no mount (hero acima da dobra), anima imediatamente
    const rafId = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const t = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(t);
      }

      // Abaixo da dobra: usar IntersectionObserver nativo (sem biblioteca)
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(el);
      return () => observer.disconnect();
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  const words = useMemo(() => text.split(" "), [text]);

  const ElementComponent = Element as React.ElementType;

  return (
    <>
      {/* Texto completo para leitores de tela e SEO */}
      <span className="sr-only">{text}</span>

      <ElementComponent className={className}>
        <span ref={ref} aria-hidden="true" className="inline-block">
          {words.map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="inline-block"
              style={{
                marginRight: index < words.length - 1 ? "0.25em" : "0",
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                filter: isVisible ? "blur(0px)" : "blur(10px)",
                transition: `opacity ${duration}s ease-out, transform ${duration}s ease-out, filter ${duration}s ease-out`,
                transitionDelay: `${delay + index * 0.05}s`,
              }}
            >
              {word}
            </span>
          ))}
        </span>
      </ElementComponent>
    </>
  );
}
