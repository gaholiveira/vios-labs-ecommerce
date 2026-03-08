"use client";

import { useState, useCallback, useEffect } from "react";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/checkout-config";
import type { ShippingQuoteOption } from "@/app/api/shipping/quote/route";

function formatBRL(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

interface ProductShippingCalculatorProps {
  productId: string;
  productPrice: number;
  /** Para kits: IDs dos produtos que compõem o kit */
  isKit?: boolean;
  kitProducts?: string[];
  className?: string;
}

export function ProductShippingCalculator({
  productId,
  productPrice,
  isKit = false,
  kitProducts,
  className = "",
}: ProductShippingCalculatorProps) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<ShippingQuoteOption | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cepDigits = cep.replace(/\D/g, "");
  const isFreeByThreshold = productPrice >= FREE_SHIPPING_THRESHOLD;

  const fetchQuote = useCallback(async () => {
    if (cepDigits.length !== 8) return;

    setLoading(true);
    setError(null);
    setQuote(null);

    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postalCode: cepDigits,
          cartItems: [
            {
              id: productId,
              quantity: 1,
              price: productPrice,
              isKit: isKit ?? false,
              ...(isKit && kitProducts && { kitProducts }),
            },
          ],
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "Erro ao calcular frete.");
        return;
      }

      const options = data?.quotes ?? [];
      const cheapest =
        Array.isArray(options) && options.length > 0
          ? options.reduce(
              (min: ShippingQuoteOption, q: ShippingQuoteOption) =>
                q.price < min.price ? q : min,
            )
          : null;
      setQuote(cheapest);
      setError(null);
    } catch {
      setError("Erro ao consultar frete. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [cepDigits, productId, productPrice, isKit, kitProducts]);

  useEffect(() => {
    if (cepDigits.length === 8) {
      void fetchQuote();
    } else {
      setQuote(null);
      setError(null);
    }
  }, [cepDigits, fetchQuote]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 8);
    setCep(v.replace(/(\d{5})(\d)/, "$1-$2"));
  };

  const handleCepBlur = () => {
    if (cepDigits.length === 8) void fetchQuote();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-brand-softblack/70">
        Calcular frete
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="00000-000"
          value={cep}
          onChange={handleCepChange}
          onBlur={handleCepBlur}
          maxLength={9}
          className="flex-1 min-w-0 px-3 py-2 text-sm border border-stone-200 rounded-sm bg-white text-brand-softblack placeholder:text-brand-softblack/40 focus:outline-none focus:border-brand-green/60"
          aria-label="CEP para cálculo de frete"
        />
        <button
          type="button"
          onClick={() => void fetchQuote()}
          disabled={cepDigits.length !== 8 || loading}
          className="shrink-0 px-4 py-2 text-xs font-medium uppercase tracking-wider border border-brand-green text-brand-green rounded-sm hover:bg-brand-green/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "..." : "Calcular"}
        </button>
      </div>

      {/* Benefício SOUVIOS — sempre visível */}
      <p className="text-[11px] text-brand-softblack/80">
        <span className="font-medium text-brand-green">Frete por nossa conta</span>{" "}
        na primeira compra com cupom SOUVIOS.
      </p>

      {/* Resultado do CEP */}
      {loading && cepDigits.length === 8 && (
        <p className="text-xs text-brand-softblack/60 flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full border-2 border-brand-green border-t-transparent animate-spin"
            aria-hidden
          />
          Consultando opções…
        </p>
      )}

      {error && !loading && (
        <p className="text-xs text-amber-700">{error}</p>
      )}

      {quote && !loading && !error && (
        <p className="text-xs text-brand-softblack/80">
          {isFreeByThreshold ? (
            <span className="font-medium text-brand-green">
              Frete Grátis — compras acima de R$ {formatBRL(FREE_SHIPPING_THRESHOLD)}
            </span>
          ) : (
            <>
              Para seu CEP:{" "}
              <span className="font-medium text-brand-softblack">
                R$ {formatBRL(quote.price)}
              </span>
              {quote.deliveryTime > 0 && (
                <span className="text-brand-softblack/60">
                  {" "}
                  · {quote.deliveryTime} a {quote.deliveryTime + 2} dias úteis
                </span>
              )}
            </>
          )}
        </p>
      )}
    </div>
  );
}
