"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState } from "react";

interface SmoothScrollingProps {
  children: React.ReactNode;
}

export default function SmoothScrolling({ children }: SmoothScrollingProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detectar dispositivo touch
    const checkTouchDevice = () => {
      return (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - para navegadores mais antigos
        (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)
      );
    };

    setIsTouchDevice(checkTouchDevice());
  }, []);

  return (
    <ReactLenis
      root
      options={{
        lerp: isTouchDevice ? 0.15 : 0.1, // Mais rápido no mobile
        duration: isTouchDevice ? 0.8 : 1.5, // Duração menor no mobile
        smoothWheel: true,
        smoothTouch: false, // Desativa smooth scroll no touch (usa rolagem nativa)
        touchMultiplier: isTouchDevice ? 2 : 1, // Acelera rolagem no mobile
      }}
    >
      {children}
    </ReactLenis>
  );
}
