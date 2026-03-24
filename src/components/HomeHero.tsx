"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { useLenis } from "lenis/react";
import { useMobileViewportHeight } from "@/hooks/useMobileViewportHeight";
import { useAuthUrlHandler } from "@/hooks/useAuthUrlHandler";
import { useCart } from "@/context/CartContext";
import TextReveal from "@/components/ui/text-reveal";

export default function HomeHero() {
  const viewportHeight = useMobileViewportHeight();
  const { showToast } = useCart();
  const [isScrolling, setIsScrolling] = useState(false);
  const lenis = useLenis();

  useAuthUrlHandler({
    onEmailConfirmed: () =>
      showToast("Email confirmado com sucesso! Bem-vindo de volta!"),
  });

  const handleExploreClick = useCallback(() => {
    const productsSection = document.getElementById("produtos");
    if (!productsSection) return;

    setIsScrolling(true);

    if (lenis) {
      lenis.scrollTo(productsSection, {
        offset: 0,
        duration: 1.2,
        onComplete: () => setIsScrolling(false),
      });
    } else {
      const top = productsSection.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "smooth" });
      setTimeout(() => setIsScrolling(false), 1500);
    }
  }, [lenis]);

  const heroStyle = useMemo(
    () => ({
      height: viewportHeight ? `${viewportHeight}px` : "100svh",
    }),
    [viewportHeight],
  );

  return (
    <>
      {isScrolling && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300 pointer-events-none" />
      )}

      <section
        className="group relative w-full flex items-center justify-center overflow-hidden bg-brand-softblack"
        style={heroStyle}
      >
        <div className="absolute inset-0 transform-gpu will-change-transform md:transition-transform md:duration-700 md:ease-out md:group-hover:scale-105">
          <Image
            src="https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/hero-foto.jpg"
            alt="Vios 2026 Hero"
            fill
            priority
            fetchPriority="high"
            quality={60}
            sizes="(max-width: 768px) 100vw, 1920px"
            className="object-cover object-center"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        </div>

        <div className="absolute inset-0 z-1 bg-black/30 md:transition-opacity md:duration-500 md:ease-out md:group-hover:bg-black/25" />

        <div className="relative z-10 text-center px-4">
          <div className="max-w-4xl mx-auto md:transition-transform md:duration-500 md:ease-out md:group-hover:-translate-y-2">
            <span className="block uppercase tracking-[0.5em] text-[10px] mb-4 md:mb-6 text-brand-offwhite md:transition-all md:duration-500 md:ease-out">
              A ciência da melhor versão
            </span>

            <div className="md:transition-all md:duration-500 md:ease-out">
              <TextReveal
                text="Vios 2026"
                el="h1"
                className="text-5xl md:text-7xl font-extralight mb-6 md:mb-8 uppercase tracking-tighter text-brand-offwhite"
                delay={0.1}
                duration={0.8}
              />
            </div>

            <div className="md:transition-all md:duration-500 md:ease-out">
              <TextReveal
                text="Bem-vindo à nova era da biotecnologia aplicada ao bem-estar. Produtos de alta performance desenvolvidos com rigor científico e design minimalista."
                el="p"
                className="text-brand-offwhite/80 text-sm md:text-base font-light tracking-wide max-w-2xl mx-auto mb-8 md:mb-10 md:transition-opacity md:duration-500 md:ease-out md:group-hover:text-brand-offwhite/90"
                delay={0.6}
                duration={0.6}
              />
            </div>

            <button
              onClick={handleExploreClick}
              aria-label="Explorar loja e ver produtos"
              className="border border-brand-offwhite/90 rounded-sm px-10 md:px-12 py-4 md:py-5 min-h-[44px] text-xs md:text-sm uppercase tracking-wider text-brand-offwhite font-light active:bg-brand-green active:text-brand-offwhite active:border-brand-green md:hover:bg-brand-green md:hover:text-brand-offwhite md:hover:border-brand-green md:transition-all md:duration-500 md:ease-out md:transform md:group-hover:-translate-y-1"
            >
              Explorar Loja
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
