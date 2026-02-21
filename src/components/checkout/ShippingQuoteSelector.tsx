"use client";

import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/checkout-config";
import type { ShippingQuoteOption } from "@/app/api/shipping/quote/route";

function formatBRL(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export interface ShippingQuoteSelectorProps {
  /** CEP de destino (8 dígitos) */
  postalCode: string;
  /** Opção selecionada (objeto completo ou null) */
  selectedQuote: ShippingQuoteOption | null;
  onSelect: (quote: ShippingQuoteOption | null) => void;
  /** Callback quando CEP muda (para limpar seleção) */
  onQuoteError?: (message: string) => void;
  className?: string;
}

export default function ShippingQuoteSelector({
  postalCode,
  selectedQuote,
  onSelect,
  onQuoteError,
  className = "",
}: ShippingQuoteSelectorProps) {
  const { cart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<ShippingQuoteOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cepDigits = postalCode.replace(/\D/g, "");

  const fetchQuotes = useCallback(async () => {
    if (cepDigits.length !== 8 || cart.length === 0) {
      setQuotes(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    onSelect(null);

    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postalCode: cepDigits,
          cartItems: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            isKit: item.isKit,
            kitProducts: item.kitProducts,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error ?? "Erro ao calcular frete.";
        setError(msg);
        setQuotes(null);
        onQuoteError?.(msg);
        return;
      }

      const options = data?.quotes ?? null;
      setQuotes(Array.isArray(options) ? options : null);
      setError(null);

      if (Array.isArray(options) && options.length > 0) {
        const defaultPick =
          options.find((q: ShippingQuoteOption) => q.type === "local") ??
          options.find((q: ShippingQuoteOption) => q.type === "standard") ??
          options[0];
        onSelect(defaultPick);
      } else {
        onSelect(null);
      }
    } catch {
      const msg = "Erro ao consultar frete. Tente novamente.";
      setError(msg);
      setQuotes(null);
      onSelect(null);
      onQuoteError?.(msg);
    } finally {
      setLoading(false);
    }
  }, [cepDigits, cart, onSelect, onQuoteError]);

  useEffect(() => {
    if (cepDigits.length === 8 && cart.length > 0) {
      void fetchQuotes();
    } else {
      setQuotes(null);
      setError(null);
      onSelect(null);
    }
  }, [cepDigits, cart.length, fetchQuotes, onSelect]);

  const isFreeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD;

  if (cepDigits.length < 8) {
    return (
      <div className={`space-y-2 ${className}`}>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">
          Frete
        </p>
        <p className="text-sm font-light text-brand-softblack/70">
          Informe seu CEP no endereço para ver as opções de entrega.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">
          Frete
        </p>
        <div className="flex items-center gap-3 py-4">
          <div
            className="h-4 w-4 rounded-full border-2 border-brand-green border-t-transparent animate-spin"
            aria-hidden
          />
          <p className="text-sm font-light text-brand-softblack/80">
            Calculando opções de entrega…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">
          Frete
        </p>
        <p className="text-sm text-amber-700">{error}</p>
        <button
          type="button"
          onClick={() => void fetchQuotes()}
          className="text-xs text-brand-green underline hover:no-underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">
          Frete
        </p>
        <p className="text-sm font-light text-brand-softblack/70">
          Nenhuma opção disponível para este CEP.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">
        Frete
      </p>
      {isFreeShipping && (
        <p className="text-sm font-medium text-brand-green">
          Frete Grátis — compras acima de R$ {formatBRL(FREE_SHIPPING_THRESHOLD)}
        </p>
      )}
      <div className="space-y-2">
        {quotes.map((quote) => {
          const isSelected = selectedQuote?.id === quote.id;
          const displayPrice = isFreeShipping ? 0 : quote.price;
          return (
            <button
              key={quote.id}
              type="button"
              onClick={() => onSelect(quote)}
              className={`w-full flex items-center justify-between gap-4 py-3 px-4 rounded-sm border-[0.5px] text-left transition-all duration-200 ${
                isSelected
                  ? "border-[#1B2B22] bg-[#1B2B22]/6"
                  : "border-[rgba(27,43,34,0.2)] hover:border-[#1B2B22]/40 bg-white"
              }`}
              aria-pressed={isSelected}
            >
              <div>
                <p className="text-sm font-medium text-brand-softblack">
                  {quote.type === "local"
                    ? "Entrega Local — Mesmo Dia"
                    : quote.type === "express"
                      ? "Entrega Expressa"
                      : "Entrega Padrão"}
                </p>
                <p className="text-[11px] text-brand-softblack/70 mt-0.5">
                  {quote.type === "local"
                    ? "Entrega no mesmo dia na nossa cidade"
                    : `${quote.company?.name ? `${quote.company.name} · ` : ""}${quote.deliveryTime} a ${quote.deliveryTime + 2} dias úteis`}
                </p>
              </div>
              <p className="text-sm font-medium text-brand-softblack shrink-0">
                {displayPrice === 0 ? (
                  <span className="text-brand-green">Grátis</span>
                ) : (
                  <>R$ {formatBRL(displayPrice)}</>
                )}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
