"use client";

import { useCallback, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { CheckoutPaymentPayload } from "@/types/checkout";

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

/** Stripe Elements: formulário de pagamento e botão de confirmar */
function StripePaymentForm({
  clientSecret,
  onSuccess,
  onError,
}: {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      setLoading(true);
      try {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            // O Stripe adiciona `payment_intent`, `payment_intent_client_secret` e `redirect_status`
            // automaticamente na query do return_url quando houver redirecionamento (ex.: 3DS).
            return_url: `${window.location.origin}/checkout/success`,
            receipt_email: undefined,
          },
        });
        if (error) {
          onError(error.message ?? "Falha ao processar pagamento.");
          setLoading(false);
          return;
        }
        // Sucesso sem redirect (ex.: cartão sem 3DS): extrair ID do clientSecret e redirecionar
        const piId = clientSecret.split("_secret_")[0];
        if (piId) onSuccess(piId);
      } catch (err) {
        onError(
          err instanceof Error ? err.message : "Erro ao confirmar pagamento.",
        );
      } finally {
        setLoading(false);
      }
    },
    [stripe, elements, clientSecret, onSuccess, onError],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="w-full py-3 px-4 bg-brand-green text-white font-medium uppercase tracking-widest text-sm rounded-sm hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Processando…" : "Pagar"}
      </button>
    </form>
  );
}

/** Wrapper Stripe com Elements provider */
function StripeCheckoutEmbed({
  clientSecret,
  onSuccess,
  onError,
}: {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}) {
  const stripePromise = stripePublishableKey
    ? loadStripe(stripePublishableKey)
    : null;
  if (!stripePromise) {
    return (
      <p className="text-sm text-red-600">
        Chave pública do Stripe não configurada
        (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).
      </p>
    );
  }
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#1a3c34",
            borderRadius: "2px",
          },
        },
      }}
    >
      <StripePaymentForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

/** Resposta da API process-payment PIX */
interface PixPaymentResult {
  paymentId: number;
  qr_code_base64: string | null;
  qr_code: string | null;
  ticket_url: string | null;
}

/** Mercado Pago Payment Brick (lazy para evitar SSR do SDK) */
function MercadoPagoCheckoutEmbed({
  preferenceId,
  publicKey,
  amount,
  paymentMethod,
  installmentOption,
  payerEmail: payerEmailFromForm,
  onSuccess,
  onError,
}: {
  preferenceId: string;
  publicKey: string;
  amount: number;
  /** "pix" = só PIX; "card" = só cartão (2x/3x) */
  paymentMethod: "pix" | "card";
  installmentOption?: "2x" | "3x";
  payerEmail?: string;
  onSuccess: (preferenceId: string) => void;
  onError: (message: string) => void;
}) {
  const isPix = paymentMethod === "pix";
  type MercadoPagoBrickProps = {
    initialization: {
      preferenceId: string;
      amount: number;
      payer?: { email?: string };
    };
    customization: {
      paymentMethods: { bankTransfer?: "all"; creditCard?: "all" };
    };
    onSubmit?: (param: unknown) => void;
    onReady?: () => void;
    onError?: (param: unknown) => void;
    id?: string;
  };
  const [Brick, setBrick] =
    useState<React.ComponentType<MercadoPagoBrickProps> | null>(null);
  const [init, setInit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PixPaymentResult | null>(
    null,
  );

  useEffect(() => {
    if (!publicKey || !preferenceId) return;
    let cancelled = false;
    (async () => {
      try {
        const { initMercadoPago, Payment } =
          await import("@mercadopago/sdk-react");
        initMercadoPago(publicKey);
        if (!cancelled) {
          setBrick(() => Payment as React.ComponentType<MercadoPagoBrickProps>);
          setInit(true);
        }
      } catch (e) {
        if (!cancelled) onError("Não foi possível carregar o Mercado Pago.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey, preferenceId, onError]);

  const handleSubmitPix = useCallback(
    async (param: unknown) => {
      const formData =
        param && typeof param === "object" && "formData" in param
          ? (param as { formData?: { payer?: { email?: string } } }).formData
          : undefined;
      const payerEmail =
        formData?.payer?.email?.trim() || payerEmailFromForm?.trim() || "";
      if (!payerEmail) {
        onError("Informe o e-mail para gerar o PIX.");
        throw new Error("E-mail obrigatório");
      }
      setSubmitting(true);
      try {
        const res = await fetch("/api/checkout/mercadopago/process-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferenceId,
            amount: Number(amount) || 0,
            payerEmail,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data.error || "Erro ao gerar PIX.";
          onError(msg);
          throw new Error(msg);
        }
        setPaymentResult({
          paymentId: data.paymentId,
          qr_code_base64: data.qr_code_base64 ?? null,
          qr_code: data.qr_code ?? null,
          ticket_url: data.ticket_url ?? null,
        });
      } catch (e) {
        if (e instanceof Error && e.message !== "E-mail obrigatório") {
          onError(e.message || "Erro ao conectar. Tente novamente.");
        }
        throw e;
      } finally {
        setSubmitting(false);
      }
    },
    [preferenceId, amount, payerEmailFromForm, onError],
  );

  const handleSubmitCard = useCallback(
    async (param: unknown) => {
      const formData =
        param && typeof param === "object" && "formData" in param
          ? (param as { formData?: Record<string, unknown> }).formData
          : undefined;
      if (!formData || typeof formData !== "object") {
        onError("Dados do cartão incompletos.");
        throw new Error("formData obrigatório");
      }
      setSubmitting(true);
      try {
        const res = await fetch(
          "/api/checkout/mercadopago/process-payment-card",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              preferenceId,
              amount: Number(amount) || 0,
              formData,
            }),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          const msg = data.error || "Erro ao processar cartão.";
          onError(msg);
          throw new Error(msg);
        }
        if (data.status === "approved") {
          onSuccess(preferenceId);
          return;
        }
        if (data.status === "pending" || data.status === "in_process") {
          onSuccess(preferenceId);
          return;
        }
        onError(data.status_detail || "Pagamento não aprovado.");
        throw new Error(data.status_detail || "Pagamento não aprovado.");
      } catch (e) {
        if (
          e instanceof Error &&
          e.message !== "formData obrigatório" &&
          e.message !== "Pagamento não aprovado."
        ) {
          onError(e.message || "Erro ao conectar. Tente novamente.");
        }
        throw e;
      } finally {
        setSubmitting(false);
      }
    },
    [preferenceId, amount, onSuccess, onError],
  );

  if (!init || !Brick) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-green border-t-transparent" />
      </div>
    );
  }

  if (isPix && paymentResult) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-brand-softblack/80">
          Escaneie o QR Code ou copie o código PIX para pagar no app do seu
          banco.
        </p>
        {paymentResult.qr_code_base64 && (
          <div className="flex justify-center bg-white p-4 rounded-sm border border-gray-100">
            <img
              src={`data:image/png;base64,${paymentResult.qr_code_base64}`}
              alt="QR Code PIX"
              className="w-48 h-48 object-contain"
            />
          </div>
        )}
        {paymentResult.qr_code && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-brand-softblack/70">
              Código PIX (copiar e colar)
            </label>
            <textarea
              readOnly
              value={paymentResult.qr_code}
              className="w-full p-3 text-xs font-mono bg-gray-50 border border-gray-100 rounded-sm resize-none"
              rows={4}
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(paymentResult.qr_code ?? "");
              }}
              className="text-xs text-brand-green underline"
            >
              Copiar código
            </button>
          </div>
        )}
        {paymentResult.ticket_url && (
          <a
            href={paymentResult.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-green underline block"
          >
            Abrir página do PIX no Mercado Pago
          </a>
        )}
        <div className="p-4 border border-gray-100 rounded-sm bg-gray-50/70">
          <p className="text-[11px] text-brand-softblack/70 leading-relaxed">
            Pagou via PIX? Assim que for aprovado, o pedido aparece
            automaticamente.
          </p>
          <button
            type="button"
            onClick={() => onSuccess(preferenceId)}
            className="mt-3 w-full py-3 px-4 bg-brand-green text-white font-medium uppercase tracking-widest text-sm rounded-sm hover:bg-brand-green/90 transition-colors"
          >
            Acompanhar status do pedido
          </button>
        </div>
      </div>
    );
  }

  const containerId = `paymentBrick_container_${preferenceId.replace(/-/g, "_")}`;
  const customization = isPix
    ? { paymentMethods: { bankTransfer: "all" as const } }
    : { paymentMethods: { creditCard: "all" as const } };
  const handleSubmit = isPix ? handleSubmitPix : handleSubmitCard;

  return (
    <div className="space-y-4">
      {!isPix && installmentOption && (
        <p className="text-sm text-brand-softblack/80">
          Pagamento no cartão em <strong>{installmentOption}</strong>.
        </p>
      )}
      <Brick
        id={containerId}
        initialization={{
          preferenceId,
          amount: Number(amount) || 0,
          ...(payerEmailFromForm?.trim()
            ? { payer: { email: payerEmailFromForm.trim() } }
            : {}),
        }}
        customization={customization}
        onSubmit={handleSubmit}
        onError={(param) => {
          const msg =
            param && typeof param === "object" && "message" in param
              ? String((param as { message: unknown }).message)
              : "Erro no pagamento.";
          onError(msg);
        }}
      />
      {submitting && (
        <p className="text-sm text-brand-softblack/70 text-center">
          {isPix ? "Gerando PIX…" : "Processando cartão…"}
        </p>
      )}
      <div className="p-4 border border-gray-100 rounded-sm bg-gray-50/70">
        <p className="text-[11px] text-brand-softblack/70 leading-relaxed">
          {isPix
            ? "Pagou via PIX no app do banco? Volte aqui e acompanhe o status."
            : "Após aprovação, você será redirecionado para a confirmação do pedido."}
        </p>
        <button
          type="button"
          onClick={() => onSuccess(preferenceId)}
          className="mt-3 w-full py-3 px-4 bg-brand-green text-white font-medium uppercase tracking-widest text-sm rounded-sm hover:bg-brand-green/90 transition-colors"
        >
          Acompanhar status do pedido
        </button>
      </div>
    </div>
  );
}

export interface CheckoutPaymentStepProps {
  payload: CheckoutPaymentPayload;
  onSuccess: (id: string) => void;
  onError: (message: string) => void;
}

/**
 * Step de pagamento dinâmico: Stripe Elements ou Mercado Pago Bricks.
 * Checkout a cara da VIOS — tudo no nosso site.
 */
export default function CheckoutPaymentStep({
  payload,
  onSuccess,
  onError,
}: CheckoutPaymentStepProps) {
  if (payload.provider === "stripe") {
    return (
      <StripeCheckoutEmbed
        clientSecret={payload.clientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    );
  }

  if (payload.provider === "mercadopago" && payload.preferenceId) {
    if (!payload.publicKey) {
      return (
        <p className="text-sm text-amber-700">
          Chave pública do Mercado Pago não configurada. Use o link de pagamento
          abaixo ou configure NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY.
        </p>
      );
    }
    if (typeof payload.amount !== "number") {
      return (
        <p className="text-sm text-amber-700">
          Dados do pagamento incompletos. Tente novamente.
        </p>
      );
    }
    return (
      <MercadoPagoCheckoutEmbed
        preferenceId={payload.preferenceId}
        publicKey={payload.publicKey}
        amount={payload.amount}
        paymentMethod={payload.paymentMethod ?? "pix"}
        installmentOption={payload.installmentOption}
        payerEmail={payload.payerEmail}
        onSuccess={onSuccess}
        onError={onError}
      />
    );
  }

  return (
    <p className="text-sm text-red-600">Configuração de pagamento inválida.</p>
  );
}
