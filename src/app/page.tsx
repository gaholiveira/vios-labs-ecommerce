"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AboutSection from "@/components/AboutSection";
import ProductCard from "@/components/ProductCard";
import FadeInStagger from "@/components/FadeInStagger";
import { PRODUCTS } from "@/constants/products";
import Image from "next/image";
import { useMobileViewportHeight } from "@/hooks/useMobileViewportHeight";

export default function Home() {
  const router = useRouter();
  const viewportHeight = useMobileViewportHeight();

  useEffect(() => {
    // Detectar códigos de autenticação e erros na URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");
      const errorCode = params.get("error_code");
      const errorDescription = params.get("error_description");

      // PRIORIDADE 1: Se há um código na URL (Supabase enviou para home ao invés de /auth/callback)
      // Redirecionar para /auth/callback preservando todos os parâmetros
      if (code) {
        const currentUrl = new URL(window.location.href);
        const callbackUrl = `/auth/callback${currentUrl.search}`;
        router.replace(callbackUrl);
        return;
      }

      // PRIORIDADE 2: Se há erros relacionados a OTP expirado ou acesso negado (password reset)
      if (error === "access_denied" && errorCode === "otp_expired") {
        // Redirecionar para forgot-password com mensagem amigável
        const message = "Link de redefinição de senha expirado ou inválido. Por favor, solicite um novo link.";
        router.replace(`/forgot-password?error=${encodeURIComponent(message)}`);
        return;
      }

      // Se há outros erros de autenticação na URL, limpar a URL
      if (error || errorCode) {
        // Limpar a URL sem recarregar a página
        window.history.replaceState({}, "", "/");
      }
    }
  }, [router]);

  return (
    <main>
      {/* Hero Section */}
      <section 
        className="relative w-full flex items-center justify-center overflow-hidden bg-brand-softblack"
        style={{ 
          height: viewportHeight ? `${viewportHeight}px` : '100svh' 
        }}
      >
        {/* Usando o componente Image do Next.js para máxima performance */}
        <div className="absolute inset-0 transform-gpu will-change-transform">
          <Image
            src="/images/hero-foto.jpg"
            alt="Vios 2026 Hero"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover object-center"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        </div>

        {/* Overlay para escurecer a imagem e destacar o texto */}
        <div className="absolute inset-0 bg-black/30 z-[1]" />

        {/* Conteúdo do Banner */}
        <div className="relative z-10 text-center px-4">
          <span className="uppercase tracking-[0.5em] text-[10px] mb-4 block text-brand-offwhite">
            A ciência da melhor versão
          </span>
          <h1 className="text-5xl md:text-7xl font-extralight mb-8 uppercase tracking-tighter text-brand-offwhite">
            Vios 2026
          </h1>
          <button className="border border-brand-offwhite rounded-sm px-10 py-4 min-h-[44px] text-xs uppercase tracking-[0.2em] text-brand-offwhite active:bg-brand-green/80 active:text-brand-offwhite active:border-brand-green md:hover:bg-brand-green md:hover:text-brand-offwhite md:hover:border-brand-green transition-all duration-500 ease-out md:transform md:hover:scale-105 font-medium">
            Explorar Loja
          </button>
        </div>
      </section>

      {/* Grid de Produtos */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-x-10 sm:gap-y-16">
          {PRODUCTS.map((product, index) => (
            <FadeInStagger 
              key={product.id} 
              index={index}
              className={index === PRODUCTS.length - 1 ? "col-span-2 lg:col-span-1" : ""}
            >
              <ProductCard product={product} />
            </FadeInStagger>
          ))}
        </div>
      </section>

      {/* 2. Seção Sobre (A que acabámos de criar) */}
      <AboutSection />
    </main>
  );
}
