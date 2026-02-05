"use client";

import Image from "next/image";
import LoteZeroSalesForm from "./LoteZeroSalesForm";
import type { User } from "@supabase/supabase-js";

interface LoteZeroSplitScreenProps {
  user: User | null;
  email: string;
  name: string;
  onEmailChange: (email: string) => void;
  onNameChange: (name: string) => void;
  onSuccess: () => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
}

export default function LoteZeroSplitScreen({
  user,
  email,
  name,
  onEmailChange,
  onNameChange,
  onSuccess,
  onError,
  loading,
  setLoading,
  error,
}: LoteZeroSplitScreenProps) {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Coluna Esquerda (50%) - Fixa - Fundo Deep Forest Green */}
      <div className="hidden md:flex md:w-1/2 md:sticky md:top-0 md:h-screen bg-brand-green relative overflow-hidden">
        {/* Imagem do Produto ou Composição Abstrata */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-foto.jpg"
            alt="Lote Zero"
            fill
            priority
            quality={90}
            sizes="50vw"
            className="object-cover object-center opacity-40"
          />
        </div>

        {/* Overlay escuro para melhor contraste */}
        <div className="absolute inset-0 bg-black/20 z-10"></div>

        {/* Conteúdo centralizado */}
        <div className="relative z-20 flex flex-col items-center justify-center px-12 w-full">
          {/* Texto sobreposto: LOTE ZERO - Edição Limitada */}
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-extralight uppercase tracking-[0.1em] text-brand-offwhite mb-6">
              LOTE ZERO
            </h1>
            <div className="space-y-3">
              <p className="text-sm md:text-base font-light tracking-[0.4em] text-brand-offwhite/60 uppercase">
                Edição Limitada
              </p>
              <div className="w-16 h-px bg-brand-offwhite/30 mx-auto"></div>
              <p className="text-xs md:text-sm font-extralight tracking-[0.5em] text-brand-offwhite/50 uppercase">
                Exclusivo
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé da coluna: Escassez e Exclusividade */}
        <div className="absolute bottom-8 left-0 right-0 z-20 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-center gap-2">
              {/* Indicador de escassez sutil */}
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-brand-offwhite/40 rounded-full"></div>
                <div className="absolute inset-0 w-1.5 h-1.5 bg-brand-offwhite/40 rounded-full animate-pulse opacity-50"></div>
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-brand-offwhite/70 font-extralight">
                Quantidade Limitada
              </p>
            </div>
            <p className="text-[9px] uppercase tracking-[0.4em] text-brand-offwhite/50 font-extralight">
              Acesso Exclusivo
            </p>
          </div>
        </div>
      </div>

      {/* Versão Mobile: Imagem Hero no topo */}
      <div className="md:hidden relative h-[50vh] min-h-[300px] bg-brand-green overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-foto.jpg"
            alt="Lote Zero"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover object-center opacity-40"
          />
        </div>
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-extralight uppercase tracking-[0.08em] text-brand-offwhite mb-4 text-center">
              LOTE ZERO
            </h1>
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-light tracking-[0.3em] text-brand-offwhite/60 uppercase">
                Edição Limitada
              </p>
              <div className="w-12 h-px bg-brand-offwhite/30 mx-auto"></div>
              <p className="text-[10px] sm:text-xs font-extralight tracking-[0.4em] text-brand-offwhite/50 uppercase">
                Exclusivo
              </p>
            </div>
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center justify-center gap-1.5 px-4">
            <div className="flex items-center justify-center gap-2">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-brand-offwhite/40 rounded-full"></div>
                <div className="absolute inset-0 w-1.5 h-1.5 bg-brand-offwhite/40 rounded-full animate-pulse opacity-50"></div>
              </div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-brand-offwhite/70 font-extralight text-center">
                Quantidade Limitada
              </p>
            </div>
            <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.35em] text-brand-offwhite/50 font-extralight text-center">
              Acesso Exclusivo
            </p>
          </div>
        </div>
      </div>

      {/* Coluna Direita (50%) - Fundo Off-White */}
      <div className="md:w-1/2 w-full flex-1 md:flex-none">
        <LoteZeroSalesForm
          user={user}
          email={email}
          name={name}
          onEmailChange={onEmailChange}
          onNameChange={onNameChange}
          onSuccess={onSuccess}
          onError={onError}
          loading={loading}
          setLoading={setLoading}
          error={error}
        />
      </div>
    </main>
  );
}
