"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface SmoothScrollingProps {
  children: React.ReactNode;
}

function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    Boolean((navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints)
  );
}

// Reset de scroll na troca de rota (usado quando Lenis não está ativo, ex.: mobile)
function ScrollResetOnRoute({ pathname }: { pathname: string }) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.history.scrollRestoration) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

// Componente interno para acessar a instância do Lenis (apenas desktop)
function LenisWrapper({ pathname }: { pathname: string }) {
  const lenis = useLenis();

  useEffect(() => {
    if (typeof window !== "undefined" && window.history.scrollRestoration) {
      window.history.scrollRestoration = "manual";
    }
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      const t = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }, 0);
      return () => clearTimeout(t);
    }
  }, [pathname, lenis]);

  return null;
}

export default function SmoothScrolling({ children }: SmoothScrollingProps) {
  const [touch, setTouch] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setTouch(isTouchDevice());
  }, []);

  // Mobile/touch: scroll nativo (melhor performance, sem JS no scroll)
  if (touch === true) {
    return (
      <>
        <ScrollResetOnRoute pathname={pathname} />
        {children}
      </>
    );
  }

  // Desktop: Lenis para scroll suave
  if (touch === false) {
    return (
      <ReactLenis
        root
        options={{
          lerp: 0.1,
          duration: 1.5,
          smoothWheel: true,
          touchMultiplier: 1,
        }}
      >
        <LenisWrapper pathname={pathname} />
        {children}
      </ReactLenis>
    );
  }

  // SSR/hidratação: renderizar children sem Lenis até saber o dispositivo
  return (
    <>
      <ScrollResetOnRoute pathname={pathname} />
      {children}
    </>
  );
}
