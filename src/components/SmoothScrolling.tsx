"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface SmoothScrollingProps {
  children: React.ReactNode;
}

// Componente interno para acessar a instância do Lenis
function LenisWrapper({ pathname }: { pathname: string }) {
  const lenis = useLenis();

  useEffect(() => {
    // Resetar scroll restoration do browser
    if (typeof window !== 'undefined' && window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }

    // Resetar scroll quando a rota mudar
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      // Fallback: resetar scroll diretamente se Lenis não estiver pronto
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pathname, lenis]);

  return null;
}

export default function SmoothScrolling({ children }: SmoothScrollingProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const pathname = usePathname();

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
        touchMultiplier: isTouchDevice ? 2 : 1, // Acelera rolagem no mobile
      }}
    >
      <LenisWrapper pathname={pathname} />
      {children}
    </ReactLenis>
  );
}
