"use client";

import Image from "next/image";
import { useCart } from "@/context/CartContext";
import {
  FREE_SHIPPING_THRESHOLD,
  PIX_DISCOUNT_PERCENT,
  MAX_INSTALLMENTS,
} from "@/lib/checkout-config";
import type { PaymentMethod, InstallmentOption } from "@/types/checkout";

function formatBRL(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function calculateInstallmentAmount(
  total: number,
  installments: number,
): number {
  return Math.round((total / installments) * 100) / 100;
}

export interface CheckoutOrderSummaryProps {
  paymentMethod: PaymentMethod | null;
  installmentOption: InstallmentOption | null;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onInstallmentChange: (option: InstallmentOption) => void;
  /** Se true, mostra seletor de pagamento; se false, só mostra totais */
  showPaymentSelector?: boolean;
  /** Valor do frete em reais (Melhor Envio). Quando omitido, usa cálculo legado. */
  shippingReais?: number;
  /** Se true, exibe "Grátis" no frete */
  isFreeShipping?: boolean;
  className?: string;
}

export default function CheckoutOrderSummary({
  paymentMethod,
  installmentOption,
  onPaymentMethodChange,
  onInstallmentChange,
  showPaymentSelector = true,
  shippingReais: shippingProp,
  isFreeShipping: isFreeShippingProp,
  className = "",
}: CheckoutOrderSummaryProps) {
  const { cart, totalPrice } = useCart();
  const isFreeShipping =
    isFreeShippingProp ?? totalPrice >= FREE_SHIPPING_THRESHOLD;
  const shippingReais =
    shippingProp ?? (isFreeShipping ? 0 : 0);
  const subtotalWithShipping = totalPrice + shippingReais;
  const pixDiscount =
    paymentMethod === "pix" ? totalPrice * PIX_DISCOUNT_PERCENT : 0;
  const totalReais = subtotalWithShipping - pixDiscount;

  const installment1x = totalReais;
  const installment2x = calculateInstallmentAmount(totalReais, 2);
  const installment3x = calculateInstallmentAmount(totalReais, 3);

  return (
    <div
      className={`bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden ${className}`}
    >
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-softblack/60 mb-1">
          Resumo do pedido
        </h2>
        <p className="text-sm font-light text-brand-softblack">
          {cart.length} {cart.length === 1 ? "item" : "itens"}
        </p>
      </div>

      <div className="p-6 space-y-4 max-h-[320px] overflow-y-auto">
        {cart.map((item) => (
          <div
            key={item.id + (item.isKit ? "kit" : "")}
            className="flex gap-3 text-sm items-center"
          >
            <div className="relative w-14 h-14 shrink-0 rounded-sm overflow-hidden bg-gray-100 border border-gray-100">
              <Image
                src={item.image ?? "/images/products/glow.jpeg"}
                alt={item.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-brand-softblack/80 font-light line-clamp-2">
                {item.name} × {item.quantity}
              </p>
              <p className="font-medium text-brand-softblack mt-0.5">
                R$ {formatBRL(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-gray-100 space-y-2">
        <div className="flex justify-between text-sm font-light text-brand-softblack">
          <span>Subtotal</span>
          <span>R$ {formatBRL(totalPrice)}</span>
        </div>
        <div className="flex justify-between text-sm font-light text-brand-softblack">
          <span>Frete</span>
          <span>
            {isFreeShipping ? (
              <span className="text-brand-green">Grátis</span>
            ) : (
              <>R$ {formatBRL(shippingReais)}</>
            )}
          </span>
        </div>
        {paymentMethod === "pix" && pixDiscount > 0 && (
          <div className="flex justify-between text-sm text-brand-green font-light">
            <span>Desconto 5% (PIX)</span>
            <span>- R$ {formatBRL(pixDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between pt-3 border-t border-gray-200 font-medium text-brand-softblack">
          <span>Total</span>
          <span className="text-lg">
            {paymentMethod === "pix" && pixDiscount > 0 ? (
              <>
                <span className="line-through text-brand-softblack/50 text-sm font-normal mr-2">
                  R$ {formatBRL(subtotalWithShipping)}
                </span>
                R$ {formatBRL(totalReais)}
              </>
            ) : (
              <>R$ {formatBRL(totalReais)}</>
            )}
          </span>
        </div>
      </div>

      {showPaymentSelector && (
        <div className="p-6 border-t border-gray-100 space-y-4">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-softblack/60">
            Forma de pagamento
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onPaymentMethodChange("pix")}
              className={`flex flex-col items-center justify-center p-4 rounded-sm border-2 transition-all duration-200 ${
                paymentMethod === "pix"
                  ? "border-brand-green bg-brand-green/5 text-brand-green"
                  : "border-gray-200 hover:border-brand-green/40 text-brand-softblack/70"
              }`}
              aria-pressed={paymentMethod === "pix"}
              aria-label="Pagar com PIX"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                className="w-8 h-8 mb-2 fill-current stroke-[#082f1e] stroke-[0.35]"
                aria-hidden
              >
                <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253z" />
                <path d="M4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wider">
                PIX
              </span>
              <span className="text-[10px] text-brand-softblack/60 mt-0.5">
                5% off
              </span>
            </button>

            <button
              type="button"
              onClick={() => onPaymentMethodChange("card")}
              className={`flex flex-col items-center justify-center p-4 rounded-sm border-2 transition-all duration-200 ${
                paymentMethod === "card"
                  ? "border-brand-green bg-brand-green/5 text-brand-green"
                  : "border-gray-200 hover:border-brand-green/40 text-brand-softblack/70"
              }`}
              aria-pressed={paymentMethod === "card"}
              aria-label="Pagar com cartão"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                className="w-8 h-8 mb-2"
                fill="currentColor"
                aria-hidden
              >
                <path d="M32 376a56 56 0 0 0 56 56h336a56 56 0 0 0 56-56V222H32Zm66-76a30 30 0 0 1 30-30h48a30 30 0 0 1 30 30v20a30 30 0 0 1-30 30h-48a30 30 0 0 1-30-30ZM424 80H88a56 56 0 0 0-56 56v26h448v-26a56 56 0 0 0-56-56Z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wider">
                Cartão
              </span>
              <span className="text-[10px] text-brand-softblack/60 mt-0.5">
                até {MAX_INSTALLMENTS}x sem juros
              </span>
            </button>
          </div>

          {paymentMethod === "card" && (
            <div className="pt-2">
              <p className="text-[10px] uppercase tracking-wider text-brand-softblack/60 mb-2">
                Parcelas
              </p>
              <div className="flex gap-2">
                {(["1x", "2x", "3x"] as const).map((opt) => {
                  const amount =
                    opt === "1x"
                      ? installment1x
                      : opt === "2x"
                        ? installment2x
                        : installment3x;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onInstallmentChange(opt)}
                      className={`flex-1 py-2.5 rounded-sm border text-xs font-light transition-all ${
                        installmentOption === opt
                          ? "border-brand-green bg-brand-green/5 text-brand-green"
                          : "border-gray-200 hover:border-brand-green/40 text-brand-softblack/70"
                      }`}
                      aria-pressed={installmentOption === opt}
                    >
                      {opt === "1x" ? "À vista" : opt}
                      {opt !== "1x" && (
                        <span className="block text-[10px] opacity-80 mt-0.5">
                          R$ {formatBRL(amount)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
