"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import CheckoutForm, {
  type CheckoutFormData,
} from "@/components/checkout/CheckoutForm";
import CheckoutOrderSummary from "@/components/checkout/CheckoutOrderSummary";
import CheckoutPaymentStep from "@/components/checkout/CheckoutPaymentStep";
import type {
  PaymentMethod,
  InstallmentOption,
  CheckoutPaymentPayload,
  CheckoutCartItem,
} from "@/types/checkout";

type CheckoutView = "form" | "pix" | "card_form";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalPrice } = useCart();
  const { user } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [installmentOption, setInstallmentOption] =
    useState<InstallmentOption | null>(null);
  const [view, setView] = useState<CheckoutView>("form");
  const [paymentPayload, setPaymentPayload] =
    useState<CheckoutPaymentPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = useCallback(
    async (data: CheckoutFormData) => {
      if (!paymentMethod) {
        alert("Selecione uma forma de pagamento no resumo à direita.");
        return;
      }
      if (paymentMethod === "card" && !installmentOption) {
        alert("Selecione o número de parcelas.");
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

      const userId = user?.id ?? null;
      const opt = installmentOption ?? "1x";

      if (paymentMethod === "pix") {
        setIsSubmitting(true);
        try {
          const res = await fetch("/api/checkout/pagarme", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items,
              userId,
              paymentMethod: "pix",
              checkoutData: data,
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
            },
          });
          setView("pix");
        } catch (e) {
          console.error(e);
          alert("Erro ao processar. Tente novamente.");
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      if (paymentMethod === "card") {
        setPaymentPayload({
          provider: "pagarme",
          paymentMethod: "card",
          checkoutData: data,
          items,
          userId,
          installmentOption: opt,
        });
        setView("card_form");
      }
    },
    [cart, paymentMethod, installmentOption, user?.id],
  );

  const handlePaymentSuccess = useCallback(
    (orderId: string) => {
      router.push(`/checkout/success?order_id=${encodeURIComponent(orderId)}`);
    },
    [router],
  );

  const handlePaymentError = useCallback((message: string) => {
    alert(message);
  }, []);

  if (cart.length === 0 && view === "form") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-brand-softblack/80 font-light mb-4">
          Seu carrinho está vazio.
        </p>
        <a
          href="/"
          className="text-brand-green text-sm uppercase tracking-wider hover:underline"
        >
          Continuar comprando
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Coluna esquerda no desktop: formulário. No mobile aparece em segundo (resumo primeiro) */}
        <div className="lg:col-span-7 min-h-0 order-2 lg:order-1">
          {view === "form" && (
            <div className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden">
              <CheckoutForm
                embedded
                onSubmit={handleFormSubmit}
                onCancel={() => router.push("/")}
                initialEmail={user?.email ?? undefined}
                isLoading={isSubmitting}
                submitLabel="Finalizar compra"
              />
            </div>
          )}

          {view === "pix" && paymentPayload && "pix" in paymentPayload && (
            <div className="bg-white rounded-sm border border-gray-100 shadow-sm p-8">
              <h2 className="text-xl font-light uppercase tracking-widest text-brand-softblack mb-6">
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
              <div className="bg-white rounded-sm border border-gray-100 shadow-sm p-8">
                <h2 className="text-xl font-light uppercase tracking-widest text-brand-softblack mb-6">
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

        {/* Coluna direita no desktop: resumo. No mobile aparece primeiro (recomendado) */}
        <div className="lg:col-span-5 order-1 lg:order-2">
          <div className="lg:sticky lg:top-8">
            <CheckoutOrderSummary
              paymentMethod={paymentMethod}
              installmentOption={installmentOption}
              onPaymentMethodChange={setPaymentMethod}
              onInstallmentChange={setInstallmentOption}
              showPaymentSelector={view === "form"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
