"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { COUPON_CODE_SOUVIOS } from "@/lib/checkout-config";

const STORAGE_KEY = "vios_exit_intent_shown";
const DELAY_MS = 30000; // 30 segundos (desktop e mobile)

function isConversionPage(pathname: string | null): boolean {
  if (!pathname) return false;
  // Não mostrar em success/canceled — usuário já finalizou ou desistiu
  if (pathname.startsWith("/checkout/success")) return false;
  if (pathname.startsWith("/checkout/canceled")) return false;
  if (pathname.startsWith("/produto/")) return true;
  if (pathname.startsWith("/kit/")) return true;
  if (pathname === "/checkout") return true;
  if (pathname === "/") return true; // home também é página de conversão
  return false;
}

function wasShownThisSession(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markAsShown(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

export default function ExitIntentModal() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const hasItemsInCart = cart.length > 0;

  const showModal = useCallback(() => {
    if (wasShownThisSession()) return;
    if (!isConversionPage(pathname)) return;
    markAsShown();
    setIsOpen(true);
  }, [pathname]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const goToCheckout = useCallback(() => {
    closeModal();
    router.push("/checkout");
  }, [closeModal, router]);


  // Desktop e mobile: após 30 segundos na página
  useEffect(() => {
    if (!isConversionPage(pathname)) return;

    const timer = setTimeout(showModal, DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname, showModal]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-sm border border-stone-200/80 shadow-xl">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 p-2 text-brand-softblack/50 hover:text-brand-softblack transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <h2
            id="exit-intent-title"
            className="text-xl font-light uppercase tracking-[0.2em] text-brand-softblack mb-2"
          >
            10% na sua primeira compra
          </h2>
          <p className="text-sm text-brand-softblack/70 font-light leading-relaxed mb-6">
            Use o cupom{" "}
            <span className="font-medium text-brand-green">{COUPON_CODE_SOUVIOS}</span>{" "}
            no checkout e ganhe 10% de desconto.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={hasItemsInCart ? goToCheckout : closeModal}
              className="flex-1 border border-brand-green bg-brand-green text-brand-offwhite px-6 py-3 rounded-sm uppercase tracking-[0.15em] text-xs font-medium hover:bg-brand-softblack hover:border-brand-softblack transition-all duration-300"
            >
              {hasItemsInCart ? "Ir para o checkout" : "Continuar comprando"}
            </button>
            <button
              onClick={closeModal}
              className="flex-1 border border-stone-200 text-brand-softblack/80 px-6 py-3 rounded-sm uppercase tracking-[0.15em] text-xs font-medium hover:bg-stone-50 transition-colors"
            >
              Continuar navegando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
