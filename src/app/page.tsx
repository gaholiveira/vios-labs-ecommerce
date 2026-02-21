"use client";

import dynamic from "next/dynamic";
import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, useReducedMotion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/constants/products";
import Image from "next/image";

const AboutSection = dynamic(() => import("@/components/AboutSection"), {
  ssr: false,
  loading: () => <div className="min-h-[240px] animate-pulse bg-brand-offwhite/30" aria-hidden />,
});
const EssenceSection = dynamic(() => import("@/components/EssenceSection"), {
  ssr: false,
  loading: () => <div className="min-h-[200px] animate-pulse bg-brand-green/50" aria-hidden />,
});
import { useMobileViewportHeight } from "@/hooks/useMobileViewportHeight";
import { useCart } from "@/context/CartContext";
import TextReveal from "@/components/ui/text-reveal";
import CheckoutBenefitsBar from "@/components/CheckoutBenefitsBar";

export default function Home() {
  const router = useRouter();
  const viewportHeight = useMobileViewportHeight();
  const { showToast } = useCart();
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    // Detectar códigos de autenticação e erros na URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");
      const errorCode = params.get("error_code");

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
        const message =
          "Link de redefinição de senha expirado ou inválido. Por favor, solicite um novo link.";
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
  // Usa requestAnimationFrame para evitar reflow forçado ao ler getBoundingClientRect
  const handleExploreClick = useCallback(() => {
    const productsSection = document.getElementById("produtos");
    if (productsSection) {
      setIsScrolling(true);

      productsSection.scrollIntoView({ behavior: "smooth", block: "start" });

      let scrollInterval: ReturnType<typeof setInterval>;
      const safetyTimeout = setTimeout(() => {
        setIsScrolling(false);
        clearInterval(scrollInterval);
      }, 2000);

      scrollInterval = setInterval(() => {
        requestAnimationFrame(() => {
          const rect = productsSection.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= -50) {
            setIsScrolling(false);
            clearInterval(scrollInterval);
            clearTimeout(safetyTimeout);
          }
        });
      }, 100);
    }
  }, []);

  // Memoizar estilo de altura do viewport
  const heroStyle = useMemo(
    () => ({
      height: viewportHeight ? `${viewportHeight}px` : "100svh",
    }),
    [viewportHeight],
  );

  return (
    <main className="relative">
      {/* Overlay com blur durante o scroll */}
      {isScrolling && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300 pointer-events-none" />
      )}

      {/* Hero Section */}
      <section
        className="group relative w-full flex items-center justify-center overflow-hidden bg-brand-softblack"
        style={heroStyle}
      >
        {/* Usando o componente Image do Next.js para máxima performance */}
        <div className="absolute inset-0 transform-gpu will-change-transform md:transition-transform md:duration-700 md:ease-out md:group-hover:scale-105">
          <Image
            src="/images/hero-foto.jpg"
            alt="Vios 2026 Hero"
            fill
            priority
            quality={90}
            sizes="(max-width: 768px) 100vw, 1920px"
            className="object-cover object-center"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        </div>

        {/* Overlay para escurecer a imagem e destacar o texto */}
        <div className="absolute inset-0 z-1 bg-black/30 md:transition-opacity md:duration-500 md:ease-out md:group-hover:bg-black/25" />

        {/* Conteúdo do Banner com micro-interações */}
        <div className="relative z-10 text-center px-4">
          <div className="max-w-4xl mx-auto md:transition-transform md:duration-500 md:ease-out md:group-hover:-translate-y-2">
            {/* Pré-título com micro-interação */}
            <span className="block uppercase tracking-[0.5em] text-[10px] mb-4 md:mb-6 text-brand-offwhite md:transition-all md:duration-500 md:ease-out">
              A ciência da melhor versão
            </span>

            {/* Título Principal */}
            <div className="md:transition-all md:duration-500 md:ease-out">
              <TextReveal
                text="Vios 2026"
                el="h1"
                className="text-5xl md:text-7xl font-extralight mb-6 md:mb-8 uppercase tracking-tighter text-brand-offwhite"
                delay={0.1}
                duration={0.8}
              />
            </div>

            {/* Subtítulo com micro-interação */}
            <div className="md:transition-all md:duration-500 md:ease-out">
              <TextReveal
                text="Bem-vindo à nova era da biotecnologia aplicada ao bem-estar. Produtos de alta performance desenvolvidos com rigor científico e design minimalista."
                el="p"
                className="text-brand-offwhite/80 text-sm md:text-base font-light tracking-wide max-w-2xl mx-auto mb-8 md:mb-10 md:transition-opacity md:duration-500 md:ease-out md:group-hover:text-brand-offwhite/90"
                delay={0.6}
                duration={0.6}
              />
            </div>

            {/* Botão CTA Minimalista de Luxo */}
            <button
              onClick={handleExploreClick}
              className="border border-brand-offwhite/90 rounded-sm px-10 md:px-12 py-4 md:py-5 min-h-[44px] text-xs md:text-sm uppercase tracking-wider text-brand-offwhite font-light active:bg-brand-green active:text-brand-offwhite active:border-brand-green md:hover:bg-brand-green md:hover:text-brand-offwhite md:hover:border-brand-green md:transition-all md:duration-500 md:ease-out md:transform md:group-hover:-translate-y-1"
            >
              Explorar Loja
            </button>
          </div>
        </div>
      </section>

      {/* Grid de Produtos */}
      <section id="produtos" className="max-w-7xl mx-auto px-4 md:px-6 py-24">
        {/* Título da Seção com TextReveal */}
        <div className="text-center mb-10 md:mb-12">
          <TextReveal
            text="Nossos Produtos"
            el="h2"
            className="text-3xl md:text-4xl font-light uppercase tracking-tighter text-brand-softblack mb-4"
            delay={0.2}
            duration={0.6}
          />
        </div>

        {/* Faixa de benefícios – posicionada logo antes da grade */}
        <div className="mb-12">
          <CheckoutBenefitsBar />
        </div>

        {/* Container com stagger para animação em cascata dos cards */}
        <ProductsGrid products={PRODUCTS} />
      </section>

      {/* Seção A Essência */}
      <EssenceSection />

      {/* Seção Sobre */}
      <AboutSection />
    </main>
  );
}
// Componente separado para o Grid de Produtos com animação em cascata
function ProductsGrid({ products }: { products: typeof PRODUCTS }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const reducedMotion = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: reducedMotion ? 1 : 0,
      y: reducedMotion ? 0 : 20,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  const shouldAnimate = hasMounted && isInView;

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={shouldAnimate ? "show" : "hidden"}
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-x-10 sm:gap-y-16"
    >
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          variants={cardVariants}
          className={
            index === products.length - 1 ? "col-span-2 lg:col-span-1" : ""
          }
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  );
}

