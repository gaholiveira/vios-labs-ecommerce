"use client";

import dynamic from "next/dynamic";
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

// Lenis carregado apenas em desktop (economia de ~25kb no bundle inicial)
const SmoothScrollingLenis = dynamic(
  () => import("@/components/SmoothScrollingLenis"),
  { ssr: false }
);

function ScrollResetOnRoute({ pathname }: { pathname: string }) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.history.scrollRestoration) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export default function SmoothScrolling({ children }: SmoothScrollingProps) {
  const [touch, setTouch] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setTouch(isTouchDevice());
  }, []);

  if (touch === true) {
    return (
      <>
        <ScrollResetOnRoute pathname={pathname} />
        {children}
      </>
    );
  }

  if (touch === false) {
    return (
      <SmoothScrollingLenis pathname={pathname}>
        {children}
      </SmoothScrollingLenis>
    );
  }

  return (
    <>
      <ScrollResetOnRoute pathname={pathname} />
      {children}
    </>
  );
}
