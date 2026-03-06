"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { trackViewCart } from "@/lib/analytics";
import { formatPrice } from "@/utils/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/checkout-config";
import ShippingMeter from "@/components/cart/ShippingMeter";
import { X, Minus, Plus, Trash2, Shield } from "lucide-react";

const drawerTransition = {
  type: "tween" as const,
  duration: 0.55,
  ease: [0.32, 0.72, 0, 1] as const,
};
const backdropTransition = { duration: 0.4, ease: "easeOut" as const };

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

  const isFreeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD;

  const closeDrawer = useCallback(() => {
    setIsCartDrawerOpen(false);
  }, [setIsCartDrawerOpen]);

  const hasFiredViewCartRef = useRef(false);

  useEffect(() => {
    if (!isCartDrawerOpen) {
      hasFiredViewCartRef.current = false;
      return;
    }
    if (!hasFiredViewCartRef.current) {
      hasFiredViewCartRef.current = true;
      trackViewCart({
        value: totalPrice,
        items: cart.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          category: i.category,
        })),
      });
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCartDrawerOpen, closeDrawer, cart, totalPrice]);

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

            {/* Totais + CTA — fixo no rodapé (CEP e frete só no checkout) */}
            <div className="shrink-0 border-t border-stone-200/80 bg-white/80 px-6 py-5 backdrop-blur-sm">
              <ShippingMeter currentSubtotal={totalPrice} />

              <div className="space-y-2 border-t border-stone-200/80 pt-4">
                <div className="flex justify-between text-xs font-light text-stone-600">
                  <span className="uppercase tracking-wider">Subtotal</span>
                  <span className="tabular-nums">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs font-light text-stone-600">
                  <span className="uppercase tracking-wider">Frete</span>
                  <span className="tabular-nums">
                    {isFreeShipping ? "Grátis" : "No checkout"}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-medium uppercase tracking-wider text-brand-softblack">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPrice(totalPrice)}</span>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-brand-green pt-1">
                  10% off no PIX no checkout
                </p>
                <p className="text-[10px] uppercase tracking-wider text-brand-softblack/70 pt-0.5">
                  Cupom <span className="font-medium text-brand-green">SOUVIOS</span>: +10% na primeira compra
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
              <div className="mt-4 flex flex-col gap-4">
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="flex items-center justify-center rounded-sm bg-brand-green px-6 py-4 text-sm font-medium uppercase tracking-[0.2em] text-brand-offwhite shadow-md transition-all hover:bg-brand-softblack hover:shadow-lg"
                >
                  Ir para o checkout
                </Link>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="text-[9px] uppercase tracking-[0.15em] text-stone-400 hover:text-stone-600 transition-colors py-1"
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
