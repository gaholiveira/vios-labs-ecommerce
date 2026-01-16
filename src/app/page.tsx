"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AboutSection from "@/components/AboutSection";
import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/constants/products";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Detectar erros de autenticação na URL (vindos do Supabase quando o callback falha)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      const errorCode = params.get("error_code");
      const errorDescription = params.get("error_description");

      // Se há erros relacionados a OTP expirado ou acesso negado (password reset)
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
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-brand-softblack">
        {/* Usando o componente Image do Next.js para máxima performance */}
        <Image
          src="/images/hero-foto.jpg"
          alt="Vios 2026 Hero"
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover object-center"
        />

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
          <button className="border border-brand-offwhite px-10 py-4 text-[10px] uppercase tracking-widest text-brand-offwhite hover:bg-brand-offwhite hover:text-brand-softblack transition-all font-medium">
            Explorar Loja
          </button>
        </div>
      </section>

      {/* Grid de Produtos */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 2. Seção Sobre (A que acabámos de criar) */}
      <AboutSection />
    </main>
  );
}
