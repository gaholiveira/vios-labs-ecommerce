"use client";

import { Shield, Lock, CreditCard, BadgeCheck } from "lucide-react";

interface ProductTrustSealsProps {
  /** Número do processo ANVISA (quando registrado) */
  anvisaRecord?: string;
  className?: string;
}

/**
 * Selos de confiança para página de produto — ANVISA, Pagamento Seguro, Compra Protegida.
 * Destaca regulamentação e segurança para aumentar conversão.
 */
export default function ProductTrustSeals({
  anvisaRecord,
  className = "",
}: ProductTrustSealsProps) {
  const hasAnvisaRecord = Boolean(anvisaRecord?.trim());

  return (
    <div
      className={`rounded-sm border border-brand-softblack/10 bg-brand-offwhite/50 py-5 px-4 ${className}`}
      role="group"
      aria-label="Selos de confiança e garantias"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
        {/* ANVISA — Destaque principal */}
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green/15"
            aria-hidden
          >
            <BadgeCheck
              className="w-5 h-5 text-brand-green"
              strokeWidth={1.5}
              aria-hidden
            />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-brand-softblack">
              {hasAnvisaRecord ? "Registrado ANVISA" : "Regulamentado ANVISA"}
            </p>
            <p className="text-[9px] font-mono text-brand-softblack/70">
              {hasAnvisaRecord
                ? `Processo nº ${anvisaRecord}`
                : "Dispensado conforme RDC 240/2018"}
            </p>
          </div>
        </div>

        {/* Pagamento Seguro */}
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green/15"
            aria-hidden
          >
            <CreditCard
              className="w-5 h-5 text-brand-green"
              strokeWidth={1.5}
              aria-hidden
            />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-brand-softblack">
              Pagamento Seguro
            </p>
            <p className="text-[9px] uppercase tracking-wider text-brand-softblack/70">
              Pagar.me certificado
            </p>
          </div>
        </div>

        {/* Compra Protegida */}
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green/15"
            aria-hidden
          >
            <Shield
              className="w-5 h-5 text-brand-green"
              strokeWidth={1.5}
              aria-hidden
            />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-brand-softblack">
              Compra Protegida
            </p>
            <p className="text-[9px] uppercase tracking-wider text-brand-softblack/70">
              Dados criptografados
            </p>
          </div>
        </div>

        {/* Site Seguro */}
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green/15"
            aria-hidden
          >
            <Lock
              className="w-5 h-5 text-brand-green"
              strokeWidth={1.5}
              aria-hidden
            />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-brand-softblack">
              Site Seguro
            </p>
            <p className="text-[9px] uppercase tracking-wider text-brand-softblack/70">
              SSL criptografado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
