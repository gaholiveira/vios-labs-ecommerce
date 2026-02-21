"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import CheckoutForm, {
  type CheckoutFormData,
} from "@/components/checkout/CheckoutForm";
import CheckoutOrderSummary from "@/components/checkout/CheckoutOrderSummary";
import CheckoutPaymentStep from "@/components/checkout/CheckoutPaymentStep";
import ShippingQuoteSelector from "@/components/checkout/ShippingQuoteSelector";
import SecurityBadges from "@/components/SecurityBadges";
import {
  FREE_SHIPPING_THRESHOLD,
  PIX_DISCOUNT_PERCENT,
} from "@/lib/checkout-config";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics";
import type {
  PaymentMethod,
  InstallmentOption,
  CheckoutPaymentPayload,
  CheckoutCartItem,
} from "@/types/checkout";
import type { ShippingQuoteOption } from "@/app/api/shipping/quote/route";

const CHECKOUT_BG = "#F9F7F2";
const CHECKOUT_INK = "#1B2B22";

type CheckoutView = "form" | "pix" | "card_form";

function formatBRL(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalPrice } = useCart();
  const { user } = useAuth();
  const viewRef = useRef<CheckoutView>("form");

  // PIX como padrão — método mais usado no Brasil, reduz fricção
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    "pix",
  );
  const [installmentOption, setInstallmentOption] =
    useState<InstallmentOption | null>("3x");
  const [view, setView] = useState<CheckoutView>("form");
  const [paymentPayload, setPaymentPayload] =
    useState<CheckoutPaymentPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreparingMessage, setShowPreparingMessage] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponExpanded, setCouponExpanded] = useState(false);
  const [checkoutCep, setCheckoutCep] = useState("");
  const [selectedShippingQuote, setSelectedShippingQuote] =
    useState<ShippingQuoteOption | null>(null);

  viewRef.current = view;

  const isFreeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD;
  const shippingReais = isFreeShipping
    ? 0
    : selectedShippingQuote?.price ?? 0;

  const handleFormSubmit = useCallback(
    async (data: CheckoutFormData) => {
      if (!paymentMethod) {
        alert("Selecione uma forma de pagamento.");
        return;
      }
      if (paymentMethod === "card" && !installmentOption) {
        alert("Selecione o número de parcelas.");
        return;
      }
      const hasValidShipping =
        isFreeShipping ||
        (selectedShippingQuote && (shippingReais > 0 || selectedShippingQuote.type === "local"));
      if (!hasValidShipping) {
        alert("Aguarde o cálculo do frete ou informe um CEP válido para continuar.");
        return;
      }

      const items: CheckoutCartItem[] = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        kitProducts: item.kitProducts,
        isKit: item.isKit,
      }));

      const checkoutValue = totalPrice + shippingReais;
      const pixDiscount =
        paymentMethod === "pix" ? totalPrice * PIX_DISCOUNT_PERCENT : 0;
      const finalValue = checkoutValue - pixDiscount;

      trackBeginCheckout({
        value: finalValue,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          category: i.isKit ? "Kit" : "Produto",
        })),
        coupon: couponCode.trim() || null,
      });

      const userId = user?.id ?? null;
      const opt = installmentOption ?? "1x";

      if (paymentMethod === "pix") {
        const emailVal = (data.email ?? "").trim();
        const addr = data.address;
        const fullName = data.fullName?.trim();
        if (!fullName || fullName.length < 3) {
          alert("Nome completo é obrigatório.");
          return;
        }
        if (!emailVal) {
          alert("E-mail é obrigatório para o checkout.");
          return;
        }
        if (!addr || !addr.cep?.trim() || !addr.street?.trim() || !addr.number?.trim() || !addr.neighborhood?.trim() || !addr.city?.trim() || !addr.state?.trim()) {
          alert("Preencha o endereço completo: CEP, logradouro, número, bairro, cidade e estado.");
          return;
        }
        setIsSubmitting(true);
        try {
          const res = await fetch("/api/checkout/pagarme", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items,
              userId,
              paymentMethod: "pix",
              couponCode: couponCode.trim() || null,
              shippingReais,
              selectedShippingOption: selectedShippingQuote
                ? { id: selectedShippingQuote.id, name: selectedShippingQuote.name, type: selectedShippingQuote.type }
                : null,
              checkoutData: {
                email: emailVal,
                fullName,
                cpf: data.cpf,
                phone: data.phone,
                address: {
                  cep: addr.cep.trim(),
                  street: addr.street.trim(),
                  number: addr.number.trim(),
                  complement: addr.complement?.trim(),
                  neighborhood: addr.neighborhood.trim(),
                  city: addr.city.trim(),
                  state: addr.state.trim(),
                },
              },
            }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            alert(json.error || "Erro ao criar pedido PIX.");
            return;
          }
          setPaymentPayload({
            provider: "pagarme",
            orderId: json.orderId,
            paymentMethod: "pix",
            pix: {
              qr_code: json.pix?.qr_code ?? null,
              qr_code_url: json.pix?.qr_code_url ?? null,
              pix_copy_paste: json.pix?.pix_copy_paste ?? null,
            },
          });
          setView("pix");
          setPixModalOpen(true);
        } catch (e) {
          console.error(e);
          alert("Erro ao processar. Tente novamente.");
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      if (paymentMethod === "card") {
        const emailVal = (data.email ?? "").trim();
        const addr = data.address;
        const fullName = data.fullName?.trim();
        if (!fullName || fullName.length < 3) {
          alert("Nome completo é obrigatório.");
          return;
        }
        if (!emailVal) {
          alert("E-mail é obrigatório para o checkout.");
          return;
        }
        if (!addr || !addr.cep?.trim() || !addr.street?.trim() || !addr.number?.trim() || !addr.neighborhood?.trim() || !addr.city?.trim() || !addr.state?.trim()) {
          alert("Preencha o endereço completo: CEP, logradouro, número, bairro, cidade e estado.");
          return;
        }
        setPaymentPayload({
          provider: "pagarme",
          paymentMethod: "card",
          shippingReais,
          selectedShippingOption: selectedShippingQuote
            ? { id: selectedShippingQuote.id, name: selectedShippingQuote.name, type: selectedShippingQuote.type }
            : null,
          checkoutData: {
            email: emailVal,
            fullName,
            cpf: data.cpf,
            phone: data.phone,
            address: {
              cep: addr.cep.trim(),
              street: addr.street.trim(),
              number: addr.number.trim(),
              complement: addr.complement?.trim(),
              neighborhood: addr.neighborhood.trim(),
              city: addr.city.trim(),
              state: addr.state.trim(),
            },
          },
          items,
          userId,
          installmentOption: opt,
          couponCode: couponCode.trim() || null,
        });
        setView("card_form");
      }
    },
    [cart, paymentMethod, installmentOption, user?.id, couponCode, shippingReais, selectedShippingQuote],
  );

  const handlePaymentSuccess = useCallback(
    (orderId: string) => {
      const pixDiscount =
        paymentMethod === "pix" ? totalPrice * PIX_DISCOUNT_PERCENT : 0;
      const purchaseValue = totalPrice + shippingReais - pixDiscount;

      trackPurchase({
        transactionId: orderId,
        value: purchaseValue,
        items: cart.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          category: i.isKit ? "Kit" : i.category,
        })),
        coupon: couponCode.trim() || null,
      });

      if (viewRef.current === "card_form") {
        setShowPreparingMessage(true);
        setTimeout(() => {
          router.push(
            `/checkout/success?order_id=${encodeURIComponent(orderId)}`,
          );
        }, 2200);
      } else {
        setPixModalOpen(false);
        router.push(
          `/checkout/success?order_id=${encodeURIComponent(orderId)}`,
        );
      }
    },
    [
      router,
      cart,
      totalPrice,
      shippingReais,
      paymentMethod,
      couponCode,
    ],
  );

  const handlePaymentError = useCallback((message: string) => {
    alert(message);
  }, []);

  if (cart.length === 0 && view === "form") {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16"
        style={{ backgroundColor: CHECKOUT_BG, color: CHECKOUT_INK }}
      >
        <p className="text-sm font-light tracking-wide opacity-80 mb-6">
          Sua sacola está vazia.
        </p>
        <a
          href="/"
          className="text-sm uppercase tracking-[0.2em] border-[0.5px] px-6 py-3 transition-colors hover:opacity-80"
          style={{ borderColor: CHECKOUT_INK, color: CHECKOUT_INK }}
        >
          Continuar comprando
        </a>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-10 md:py-14 px-4 sm:px-6"
      style={{ backgroundColor: CHECKOUT_BG, color: CHECKOUT_INK }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          {/* Coluna esquerda: Formulário (Dados Pessoais > Endereço > Frete > Pagamento) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            {view === "form" && (
              <div
                className="rounded-sm overflow-hidden border-[0.5px] bg-white/90 shadow-sm"
                style={{ borderColor: "rgba(27,43,34,0.12)" }}
              >
                <CheckoutForm
                  embedded
                  onSubmit={handleFormSubmit}
                  onCancel={() => router.push("/")}
                  initialEmail={user?.email ?? undefined}
                  isLoading={isSubmitting}
                  submitLabel="Finalizar compra"
                  onCEPChange={setCheckoutCep}
                >
                  {/* Frete — Melhor Envio */}
                  <div
                    className="py-6 border-t border-[0.5px] px-6 md:px-8"
                    style={{ borderColor: "rgba(27,43,34,0.1)" }}
                  >
                    <ShippingQuoteSelector
                      postalCode={checkoutCep}
                      selectedQuote={selectedShippingQuote}
                      onSelect={setSelectedShippingQuote}
                    />
                  </div>

                  {/* Cupom — colapsável (menos fricção; só quem tem cupom abre) */}
                  <div
                    className="py-4 border-t border-[0.5px] px-6 md:px-8"
                    style={{ borderColor: "rgba(27,43,34,0.1)" }}
                  >
                    <button
                      type="button"
                      onClick={() => setCouponExpanded((p) => !p)}
                      className="text-[10px] uppercase tracking-[0.2em] opacity-60 hover:opacity-90 transition-opacity"
                      aria-expanded={couponExpanded}
                    >
                      {couponExpanded ? "Ocultar cupom" : "Tem cupom?"}
                    </button>
                    {couponExpanded && (
                      <div className="mt-3">
                        <input
                          id="checkout-coupon"
                          type="text"
                          placeholder="Código do cupom"
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.trim().toUpperCase())
                          }
                          className="w-full bg-white/70 border border-gray-200 rounded-sm px-3 py-2.5 text-sm font-light text-brand-softblack placeholder:text-gray-400 focus:outline-none focus:border-brand-green"
                          style={{ color: CHECKOUT_INK }}
                          aria-label="Cupom de desconto"
                        />
                      </div>
                    )}
                  </div>

                  {/* Pagamento: toggle elegante PIX (5% OFF) | Cartão (3x sem juros) */}
                  <div
                    className="py-6 border-t border-[0.5px] px-6 md:px-8"
                    style={{ borderColor: "rgba(27,43,34,0.1)" }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-4">
                      Pagamento
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("pix")}
                        className={`flex-1 py-4 px-5 rounded-sm border-[0.5px] text-left transition-all duration-200 ${
                          paymentMethod === "pix"
                            ? "border-[#1B2B22] bg-[#1B2B22]/6"
                            : "border-[rgba(27,43,34,0.2)] hover:border-[#1B2B22]/40 bg-white"
                        }`}
                        style={{ color: CHECKOUT_INK }}
                        aria-pressed={paymentMethod === "pix"}
                        aria-label="PIX com 5% de desconto"
                      >
                        <span className="block text-xs font-medium uppercase tracking-wider mb-0.5">
                          PIX
                        </span>
                        <span className="text-[11px] opacity-80">
                          5% OFF
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("card");
                          setInstallmentOption((prev) => prev ?? "3x");
                        }}
                        className={`flex-1 py-4 px-5 rounded-sm border-[0.5px] text-left transition-all duration-200 ${
                          paymentMethod === "card"
                            ? "border-[#1B2B22] bg-[#1B2B22]/6"
                            : "border-[rgba(27,43,34,0.2)] hover:border-[#1B2B22]/40 bg-white"
                        }`}
                        style={{ color: CHECKOUT_INK }}
                        aria-pressed={paymentMethod === "card"}
                        aria-label="Cartão de crédito em até 3x sem juros"
                      >
                        <span className="block text-xs font-medium uppercase tracking-wider mb-0.5">
                          Cartão de Crédito
                        </span>
                        <span className="text-[11px] opacity-80">
                          3x sem juros
                        </span>
                      </button>
                    </div>
                    {paymentMethod === "card" && (
                      <div className="mt-4">
                        <p className="text-[10px] uppercase tracking-wider opacity-60 mb-2">
                          Parcelas
                        </p>
                        <div className="flex gap-2">
                          {(["1x", "2x", "3x"] as const).map((opt) => {
                            const totalReais =
                              totalPrice + shippingReais;
                            const amount =
                              opt === "1x"
                                ? totalReais
                                : Math.round((totalReais / (opt === "2x" ? 2 : 3)) * 100) / 100;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setInstallmentOption(opt)}
                                className={`flex-1 py-3 rounded-sm border-[0.5px] text-xs font-light transition-all ${
                                  installmentOption === opt
                                    ? "border-[#1B2B22] bg-[#1B2B22]/6"
                                    : "border-[rgba(27,43,34,0.2)] hover:border-[#1B2B22]/40"
                                }`}
                                style={{ color: CHECKOUT_INK }}
                                aria-pressed={installmentOption === opt}
                              >
                                {opt === "1x" ? "À vista" : opt}
                                {opt !== "1x" && (
                                  <span className="block text-[10px] opacity-70 mt-0.5">
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
                </CheckoutForm>
              </div>
            )}

            {view === "pix" && !pixModalOpen && paymentPayload && "pix" in paymentPayload && (
              <div
                className="rounded-sm border-[0.5px] bg-white/90 p-8"
                style={{ borderColor: "rgba(27,43,34,0.12)" }}
              >
                <h2 className="text-lg font-light uppercase tracking-widest mb-6" style={{ color: CHECKOUT_INK }}>
                  Pagamento PIX
                </h2>
                <CheckoutPaymentStep
                  payload={paymentPayload}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            )}

            {view === "card_form" &&
              paymentPayload &&
              "checkoutData" in paymentPayload && (
                <div
                  className="rounded-sm border-[0.5px] bg-white/90 p-8"
                  style={{ borderColor: "rgba(27,43,34,0.12)" }}
                >
                  <h2 className="text-lg font-light uppercase tracking-widest mb-6" style={{ color: CHECKOUT_INK }}>
                    Dados do cartão
                  </h2>
                  <CheckoutPaymentStep
                    payload={paymentPayload}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </div>
              )}
          </div>

          {/* Coluna direita: Resumo do Pedido (imagem, subtotal, frete, total) */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="lg:sticky lg:top-8">
              <CheckoutOrderSummary
                paymentMethod={paymentMethod}
                installmentOption={installmentOption}
                onPaymentMethodChange={setPaymentMethod}
                onInstallmentChange={setInstallmentOption}
                showPaymentSelector={false}
                shippingReais={shippingReais}
                isFreeShipping={isFreeShipping}
                className="rounded-sm shadow-sm border-[0.5px] border-[#1B2B22]/10"
              />
            </div>
          </div>
        </div>

        {/* Selos de Segurança */}
        <div
          className="mt-8 py-6 px-4 rounded-sm border-[0.5px]"
          style={{
            borderColor: "rgba(27,43,34,0.12)",
            backgroundColor: "rgba(255,255,255,0.5)",
          }}
        >
          <SecurityBadges variant="compact" theme="light" />
        </div>
      </div>

      {/* Modal PIX minimalista: QR Code e código copia-e-cola */}
      <AnimatePresence>
        {pixModalOpen && paymentPayload && "pix" in paymentPayload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(27,43,34,0.4)" }}
            onClick={() => setPixModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#F9F7F2] rounded-sm border-[0.5px] border-[#1B2B22]/10 shadow-xl max-w-md w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-sm font-light uppercase tracking-widest" style={{ color: CHECKOUT_INK }}>
                  Pague com PIX
                </h3>
                <button
                  type="button"
                  onClick={() => setPixModalOpen(false)}
                  className="p-2 -m-2 opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: CHECKOUT_INK }}
                  aria-label="Fechar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CheckoutPaymentStep
                payload={paymentPayload}
                onSuccess={(id) => {
                  setPixModalOpen(false);
                  handlePaymentSuccess(id);
                }}
                onError={handlePaymentError}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback cartão: "Preparando seu envio" antes do redirect */}
      <AnimatePresence>
        {showPreparingMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(27,43,34,0.5)" }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-[#F9F7F2] rounded-sm border-[0.5px] border-[#1B2B22]/10 shadow-xl px-10 py-8 text-center"
            >
              <div
                className="w-10 h-10 border-2 border-[#1B2B22] border-t-transparent rounded-full animate-spin mx-auto mb-4"
                aria-hidden
              />
              <p className="text-sm font-light uppercase tracking-widest" style={{ color: CHECKOUT_INK }}>
                Preparando seu envio
              </p>
              <p className="text-xs opacity-70 mt-2" style={{ color: CHECKOUT_INK }}>
                Redirecionando…
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
