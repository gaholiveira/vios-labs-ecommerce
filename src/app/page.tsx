"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import AboutSection from "@/components/AboutSection";
import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/constants/products";
import Image from "next/image";
import { useMobileViewportHeight } from "@/hooks/useMobileViewportHeight";
import { useCart } from "@/context/CartContext";
import TextReveal from "@/components/ui/text-reveal";

export default function Home() {
  const router = useRouter();
  const viewportHeight = useMobileViewportHeight();
  const { showToast } = useCart();

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

      // Se email foi confirmado e usuário já está logado
      const emailConfirmed = params.get("email-confirmed");
      if (emailConfirmed === "true") {
        showToast("Email confirmado com sucesso! Bem-vindo de volta!");
        // Limpar a URL
        window.history.replaceState({}, "", "/");
      }
    }
  }, [router, showToast]);

  // Handler para scroll suave - Memoizado
  const handleExploreClick = useCallback(() => {
    const productsSection = document.getElementById('produtos');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Memoizar estilo de altura do viewport
  const heroStyle = useMemo(() => ({
    height: viewportHeight ? `${viewportHeight}px` : '100svh'
  }), [viewportHeight]);

  return (
    <main>
      {/* Hero Section */}
      <section 
        className="relative w-full flex items-center justify-center overflow-hidden bg-brand-softblack"
        style={heroStyle}
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
          <TextReveal
            text="Vios 2026"
            el="h1"
            className="text-5xl md:text-7xl font-extralight mb-8 uppercase tracking-tighter text-brand-offwhite"
            delay={0.1}
            duration={0.8}
          />
          <TextReveal
            text="Bem-vindo à nova era da biotecnologia aplicada ao bem-estar. Produtos de alta performance desenvolvidos com rigor científico e design minimalista."
            el="p"
            className="text-brand-offwhite/80 text-sm md:text-base font-light tracking-wide max-w-2xl mx-auto mb-8"
            delay={0.6}
            duration={0.6}
          />
          <button 
            onClick={handleExploreClick}
            className="border border-brand-offwhite rounded-sm px-10 py-4 min-h-[44px] text-xs uppercase tracking-[0.2em] text-brand-offwhite active:bg-brand-green/80 active:text-brand-offwhite active:border-brand-green md:hover:bg-brand-green md:hover:text-brand-offwhite md:hover:border-brand-green transition-all duration-500 ease-out md:transform md:hover:scale-105 font-medium"
          >
            Explorar Loja
          </button>
        </div>
      </section>

      {/* Grid de Produtos */}
      <section id="produtos" className="max-w-7xl mx-auto px-4 md:px-6 py-24">
        {/* Título da Seção com TextReveal */}
        <div className="text-center mb-16">
          <TextReveal
            text="Nossos Produtos"
            el="h2"
            className="text-3xl md:text-4xl font-light uppercase tracking-tighter text-brand-softblack mb-4"
            delay={0.2}
            duration={0.6}
          />
        </div>

        {/* Container com stagger para animação em cascata dos cards */}
        <ProductsGrid products={PRODUCTS} />
      </section>

      {/* 2. Seção Sobre (A que acabámos de criar) */}
      <AboutSection />
    </main>
  );
}

// Componente separado para o Grid de Produtos com animação em cascata
function ProductsGrid({ products }: { products: typeof PRODUCTS }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-x-10 sm:gap-y-16"
    >
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          variants={cardVariants}
          className={index === products.length - 1 ? "col-span-2 lg:col-span-1" : ""}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  );
}
