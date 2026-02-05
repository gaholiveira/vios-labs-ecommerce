"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

interface SmoothScrollingLenisProps {
  children: React.ReactNode;
  pathname: string;
}

function LenisScrollReset({ pathname }: { pathname: string }) {
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

export default function SmoothScrollingLenis({
  children,
  pathname,
}: SmoothScrollingLenisProps) {
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
      <LenisScrollReset pathname={pathname} />
      {children}
    </ReactLenis>
  );
}
