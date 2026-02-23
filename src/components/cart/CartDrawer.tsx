"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/format";
import {
  FREE_SHIPPING_THRESHOLD,
  PIX_DISCOUNT_PERCENT,
} from "@/lib/checkout-config";
import { formatCEP } from "@/utils/validation";
import ShippingMeter from "@/components/cart/ShippingMeter";
import type { ShippingQuoteOption } from "@/app/api/shipping/quote/route";
import { X, Minus, Plus, Trash2, Shield } from "lucide-react";

const drawerTransition = {
  type: "tween" as const,
  duration: 0.55,
  ease: [0.32, 0.72, 0, 1] as const,
};
const backdropTransition = { duration: 0.4, ease: "easeOut" as const };

function formatBRL(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export default function CartDrawer() {
  const {
    cart,
    totalItems,
    totalPrice,
    removeFromCart,
    updateQuantity,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
  } = useCart();

  const [drawerCep, setDrawerCep] = useState("");
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuoteOption[]>(
    [],
  );
  const [shippingQuote, setShippingQuote] = useState<ShippingQuoteOption | null>(
    null,
  );
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingOptionsExpanded, setShippingOptionsExpanded] = useState(false);

  const cepDigits = drawerCep.replace(/\D/g, "");
  const isFreeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD;
  const shippingReais = isFreeShipping ? 0 : (shippingQuote?.price ?? 0);
  const totalWithShipping = totalPrice + shippingReais;
  const pixDiscount = totalWithShipping * PIX_DISCOUNT_PERCENT;
  const totalWithPix = totalWithShipping - pixDiscount;

  const closeDrawer = useCallback(() => {
    setIsCartDrawerOpen(false);
  }, [setIsCartDrawerOpen]);

  useEffect(() => {
    if (!isCartDrawerOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCartDrawerOpen, closeDrawer]);

  useEffect(() => {
    if (cepDigits.length !== 8 || cart.length === 0) {
      setShippingQuotes([]);
      setShippingQuote(null);
      setShippingError(null);
      return;
    }
    let cancelled = false;
    setShippingLoading(true);
    setShippingError(null);
    setShippingQuotes([]);
    setShippingQuote(null);

    fetch("/api/shipping/quote", {
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
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.quotes?.length) {
          setShippingError(data?.error ?? "Nenhuma opção para este CEP.");
          return;
        }
        const options = Array.isArray(data.quotes) ? data.quotes : [];
        setShippingQuotes(options);
        const defaultPick =
          options.find((q: ShippingQuoteOption) => q.type === "local") ??
          options.find((q: ShippingQuoteOption) => q.type === "standard") ??
          options[0];
        setShippingQuote(defaultPick);
        setShippingOptionsExpanded(false);
        setShippingError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setShippingError("Erro ao calcular frete.");
          setShippingQuotes([]);
          setShippingQuote(null);
        }
      })
      .finally(() => {
        if (!cancelled) setShippingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cepDigits, cart]);

  const handleCepChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 8);
    setDrawerCep(cleaned.length === 8 ? formatCEP(cleaned) : cleaned);
  };

  return (
    <AnimatePresence
      onExitComplete={() => {
        document.body.style.overflow = "";
      }}
    >
      {isCartDrawerOpen && (
        <>
          {/* Backdrop — fade suave */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm md:bg-black/30"
            aria-hidden
            onClick={closeDrawer}
          />

          {/* Drawer — desliza da direita com easing suave */}
          <motion.div
            key="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={drawerTransition}
            className="fixed top-0 right-0 z-[101] flex h-full w-full flex-col overflow-hidden bg-brand-offwhite shadow-2xl md:h-full md:w-[420px] md:max-w-[100vw]"
            role="dialog"
            aria-modal="true"
            aria-label="Sua sacola"
          >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-stone-200/80 px-6 py-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.25em] text-brand-softblack">
            Sua sacola
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="flex h-10 w-10 items-center justify-center rounded-sm text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-brand-softblack"
            aria-label="Fechar sacola"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
            <p className="text-center text-sm font-light uppercase tracking-wider text-stone-500">
              Sua sacola está vazia
            </p>
            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              <Link
                href="/"
                onClick={closeDrawer}
                className="rounded-sm border border-brand-softblack/30 bg-transparent px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-brand-softblack transition-colors hover:bg-brand-softblack/5 text-center"
              >
                Continuar comprando
              </Link>
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 text-center">
                Ou explore
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/produto/prod_1"
                  onClick={closeDrawer}
                  className="text-[10px] uppercase tracking-wider text-brand-softblack/70 hover:text-brand-green transition-colors text-center py-1"
                >
                  VIOS Glow
                </Link>
                <Link
                  href="/kits"
                  onClick={closeDrawer}
                  className="text-[10px] uppercase tracking-wider text-brand-softblack/70 hover:text-brand-green transition-colors text-center py-1"
                >
                  Protocolos e Kits
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Lista de itens — scroll (min-h-0 permite encolher e ativar scroll no flex) */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              <ul className="space-y-6">
                {cart.map((item) => {
                  const itemHref = item.isKit
                    ? `/kit/${item.id}`
                    : `/produto/${item.id}`;
                  return (
                  <li
                    key={`${item.id}-${item.isKit ? "kit" : "prod"}`}
                    className="flex gap-4 border-b border-stone-200/60 pb-6 last:border-0"
                  >
                    <Link
                      href={itemHref}
                      onClick={closeDrawer}
                      className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-white group"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="80px"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={itemHref}
                        onClick={closeDrawer}
                        className="text-xs font-medium uppercase tracking-wider text-brand-softblack hover:text-brand-green transition-colors block"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm font-light text-stone-600">
                        {formatPrice(item.price)}
                        {item.quantity > 1 && (
                          <span className="ml-1 text-stone-500">
                            × {item.quantity}
                          </span>
                        )}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex items-center rounded-sm border border-stone-300/80 bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="flex h-8 w-8 items-center justify-center text-stone-500 transition-colors hover:bg-stone-100 hover:text-brand-softblack"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-8 text-center text-xs font-medium tabular-nums text-brand-softblack">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="flex h-8 w-8 items-center justify-center text-stone-500 transition-colors hover:bg-stone-100 hover:text-brand-softblack"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-sm text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label="Remover da sacola"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="shrink-0 text-right text-xs font-medium tabular-nums text-brand-softblack">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </li>
                  );
                })}
              </ul>
            </div>

            {/* Frete + totais — fixo no rodapé */}
            <div className="shrink-0 border-t border-stone-200/80 bg-white/80 px-6 py-5 backdrop-blur-sm">
              <ShippingMeter currentSubtotal={totalPrice} />

              {/* CEP — oculto quando frete grátis já conquistado (menos fricção) */}
              {!isFreeShipping && (
                <div className="mb-4">
                  <label
                    htmlFor="cart-drawer-cep"
                    className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500"
                  >
                    Calcular frete
                  </label>
                  <input
                    id="cart-drawer-cep"
                    type="text"
                    inputMode="numeric"
                    placeholder="00000-000"
                    value={drawerCep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    maxLength={9}
                    className="w-full rounded-sm border border-stone-300/80 bg-white px-3 py-2.5 text-sm font-light text-brand-softblack placeholder:text-stone-400 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green/30"
                  />
                  {shippingLoading && (
                    <p className="mt-2 text-xs font-light text-stone-500">
                      Calculando…
                    </p>
                  )}
                  {shippingError && !shippingLoading && cepDigits.length === 8 && (
                    <p className="mt-2 text-xs text-amber-700">{shippingError}</p>
                  )}
                  {shippingQuotes.length > 0 && !shippingLoading && (
                    <div className="mt-3">
                      {shippingOptionsExpanded ? (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto overscroll-contain">
                          {shippingQuotes.map((quote) => {
                            const isSelected = shippingQuote?.id === quote.id;
                            const displayPrice = quote.price;
                            return (
                              <button
                                key={quote.id}
                                type="button"
                                onClick={() => {
                                  setShippingQuote(quote);
                                  setShippingOptionsExpanded(false);
                                }}
                                className={`w-full flex items-center justify-between gap-3 py-2 px-3 rounded-sm border text-left transition-all duration-200 ${
                                  isSelected
                                    ? "border-brand-green bg-brand-green/5"
                                    : "border-stone-200/80 hover:border-stone-300 bg-white"
                                }`}
                                aria-pressed={isSelected}
                              >
                                <div className="min-w-0">
                                  <p className="text-[11px] font-medium text-brand-softblack">
                                    {quote.type === "local"
                                      ? "Entrega Local"
                                      : quote.type === "express"
                                        ? "Expressa"
                                        : "Padrão"}
                                  </p>
                                  <p className="text-[9px] text-stone-500 truncate">
                                    {quote.type === "local"
                                      ? "Mesmo dia"
                                      : `${quote.deliveryTime}–${quote.deliveryTime + 2} dias`}
                                  </p>
                                </div>
                                <p className="text-[11px] font-medium text-brand-softblack shrink-0 tabular-nums">
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
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShippingOptionsExpanded(true)}
                          className="w-full flex items-center justify-between gap-3 py-2 px-3 rounded-sm border border-stone-200/80 bg-white text-left hover:border-stone-300 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-brand-softblack">
                              {shippingQuote
                                ? shippingQuote.type === "local"
                                  ? "Entrega Local"
                                  : shippingQuote.type === "express"
                                    ? "Expressa"
                                    : "Padrão"
                                : "Selecione o frete"}
                            </p>
                            <p className="text-[9px] text-stone-500">
                              {shippingQuotes.length} opção
                              {shippingQuotes.length !== 1 ? "es" : ""}
                            </p>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-stone-500 shrink-0">
                            Ver opções
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Linhas de total */}
              <div className="space-y-2 border-t border-stone-200/80 pt-4">
                <div className="flex justify-between text-xs font-light text-stone-600">
                  <span className="uppercase tracking-wider">Subtotal</span>
                  <span className="tabular-nums">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs font-light text-stone-600">
                  <span className="uppercase tracking-wider">Frete</span>
                  <span className="tabular-nums">
                    {isFreeShipping
                      ? "Grátis"
                      : cepDigits.length !== 8 || shippingLoading
                        ? "—"
                        : shippingQuote
                          ? formatPrice(shippingReais)
                          : "—"}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-medium uppercase tracking-wider text-brand-softblack">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {isFreeShipping
                      ? formatPrice(totalPrice)
                      : cepDigits.length !== 8 || shippingLoading || !shippingQuote
                        ? formatPrice(totalPrice)
                        : formatPrice(totalWithShipping)}
                  </span>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-brand-green pt-1">
                  10% off no PIX — {formatPrice(totalWithPix)}
                </p>
              </div>

              {/* Badge de segurança — discreto */}
              <div className="mt-4 flex items-center justify-center gap-2 text-stone-500">
                <Shield
                  className="w-3.5 h-3.5 text-brand-green/70"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="text-[9px] uppercase tracking-[0.2em] font-light">
                  Compra Segura
                </span>
              </div>

              {/* Botões — CTA principal dominante; secundário discreto */}
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="flex items-center justify-center rounded-sm bg-brand-green px-6 py-3.5 text-xs font-medium uppercase tracking-[0.2em] text-brand-offwhite transition-colors hover:bg-brand-softblack"
                >
                  Ir para o checkout
                </Link>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-brand-softblack transition-colors py-2"
                >
                  Continuar comprando
                </button>
              </div>
            </div>
          </>
        )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
