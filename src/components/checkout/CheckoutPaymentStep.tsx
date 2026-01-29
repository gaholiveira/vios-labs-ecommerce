"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CheckoutPaymentPayload,
  CheckoutCartItem,
  CheckoutFormData,
} from "@/types/checkout";

const PAGARME_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY ?? "";
const TOKENIZECARD_SCRIPT = "https://checkout.pagar.me/v1/tokenizecard.js";

declare global {
  interface Window {
    PagarmeCheckout?: {
      init: (
        success: (data: {
          pagarmetoken?: string;
          [k: string]: unknown;
        }) => boolean | void,
        fail: (error: unknown) => void,
      ) => void;
    };
  }
}

export interface CheckoutPaymentStepProps {
  payload: CheckoutPaymentPayload;
  onSuccess: (id: string) => void;
  onError: (message: string) => void;
}

/** Step PIX: exibe QR Code e link; botão "Acompanhar status" redireciona para sucesso */
function PagarmePixStep({
  orderId,
  pix,
  onSuccess,
  onError,
}: {
  orderId: string;
  pix: { qr_code: string | null; qr_code_url: string | null };
  onSuccess: (id: string) => void;
  onError: (message: string) => void;
}) {
  if (!pix.qr_code && !pix.qr_code_url) {
    onError(
      "PIX não disponível para este pedido. Verifique se PIX está habilitado na sua conta Pagar.me ou tente novamente em instantes.",
    );
    return null;
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-softblack/80">
        Escaneie o QR Code ou copie o código PIX para pagar no app do seu banco.
      </p>
      {pix.qr_code && (
        <div className="flex justify-center bg-white p-4 rounded-sm border border-gray-100">
          <img
            src={`data:image/png;base64,${pix.qr_code}`}
            alt="QR Code PIX"
            className="w-48 h-48 object-contain"
          />
        </div>
      )}
      {pix.qr_code_url && (
        <a
          href={pix.qr_code_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-green underline block text-center"
        >
          Abrir PIX no navegador
        </a>
      )}
      <div className="p-4 border border-gray-100 rounded-sm bg-gray-50/70">
        <p className="text-[11px] text-brand-softblack/70 leading-relaxed">
          Pagou via PIX? Assim que for aprovado, o pedido aparece
          automaticamente.
        </p>
        <button
          type="button"
          onClick={() => onSuccess(orderId)}
          className="mt-3 w-full py-3 px-4 bg-brand-green text-white font-medium uppercase tracking-widest text-sm rounded-sm hover:bg-brand-green/90 transition-colors"
        >
          Acompanhar status do pedido
        </button>
      </div>
    </div>
  );
}

/** Step Cartão: formulário com tokenizecard.js; ao obter token, chama API e redireciona */
function PagarmeCardStep({
  checkoutData,
  items,
  userId,
  installmentOption,
  onSuccess,
  onError,
}: {
  checkoutData: CheckoutFormData;
  items: CheckoutCartItem[];
  userId: string | null;
  installmentOption: "1x" | "2x" | "3x";
  onSuccess: (id: string) => void;
  onError: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const submitWithToken = useCallback(
    async (cardToken: string) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setLoading(true);
      try {
        const res = await fetch("/api/checkout/pagarme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            userId,
            paymentMethod: "card",
            installmentOption,
            cardToken,
            checkoutData,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data.error || "Erro ao processar cartão.";
          onErrorRef.current(msg);
          submittedRef.current = false;
          setLoading(false);
          return;
        }
        if (data.orderId) {
          onSuccessRef.current(data.orderId);
          return;
        }
        onErrorRef.current("Resposta inválida do servidor.");
        submittedRef.current = false;
      } catch (e) {
        onErrorRef.current(
          e instanceof Error ? e.message : "Erro ao conectar. Tente novamente.",
        );
        submittedRef.current = false;
      } finally {
        setLoading(false);
      }
    },
    [items, userId, installmentOption, checkoutData],
  );

  useEffect(() => {
    if (!PAGARME_PUBLIC_KEY) return;
    const script = document.createElement("script");
    script.src = `${TOKENIZECARD_SCRIPT}?appId=${encodeURIComponent(PAGARME_PUBLIC_KEY)}`;
    script.setAttribute("data-pagarmecheckout-app-id", PAGARME_PUBLIC_KEY);
    script.async = true;
    script.onload = () => {
      if (window.PagarmeCheckout?.init) {
        window.PagarmeCheckout.init(
          (data) => {
            const token =
              (data && typeof data === "object" && "pagarmetoken" in data
                ? (data as { pagarmetoken?: string }).pagarmetoken
                : null) ||
              (data && typeof data === "object" && "token" in data
                ? (data as { token?: string }).token
                : null);
            if (token && formRef.current) {
              submitWithToken(token);
              return false;
            }
            return true;
          },
          (err) => {
            console.error("Tokenizecard error:", err);
            onErrorRef.current(
              err && typeof err === "object" && "message" in err
                ? String((err as { message: unknown }).message)
                : "Falha ao gerar token do cartão.",
            );
          },
        );
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [submitWithToken]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-softblack/80">
        Pagamento no cartão em <strong>{installmentOption}</strong>.
      </p>
      <form
        ref={formRef}
        data-pagarmecheckout-form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-medium text-brand-softblack/80 mb-1">
            Nome no cartão
          </label>
          <input
            type="text"
            name="holder_name"
            data-pagarmecheckout-element="holder_name"
            placeholder="Como está no cartão"
            className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm text-brand-softblack focus:border-brand-green focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-softblack/80 mb-1">
            Número do cartão
          </label>
          <input
            type="text"
            name="card_number"
            data-pagarmecheckout-element="number"
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm text-brand-softblack focus:border-brand-green focus:outline-none"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-brand-softblack/80 mb-1">
              Validade (MM/AA)
            </label>
            <input
              type="text"
              name="card_exp"
              data-pagarmecheckout-element="exp_date"
              placeholder="MM/AA"
              maxLength={7}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm text-brand-softblack focus:border-brand-green focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-softblack/80 mb-1">
              CVV
            </label>
            <input
              type="text"
              name="cvv"
              data-pagarmecheckout-element="cvv"
              placeholder="123"
              maxLength={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm text-brand-softblack focus:border-brand-green focus:outline-none"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-brand-green text-white font-medium uppercase tracking-widest text-sm rounded-sm hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Processando…" : "Pagar"}
        </button>
      </form>
    </div>
  );
}

/**
 * Step de pagamento — apenas Pagar.me (PIX e cartão com tokenizecard).
 * Checkout transparente a cara da VIOS.
 */
export default function CheckoutPaymentStep({
  payload,
  onSuccess,
  onError,
}: CheckoutPaymentStepProps) {
  if (payload.provider !== "pagarme") {
    return (
      <p className="text-sm text-red-600">
        Configuração de pagamento inválida. Use Pagar.me.
      </p>
    );
  }

  if (
    "orderId" in payload &&
    payload.paymentMethod === "pix" &&
    "pix" in payload
  ) {
    return (
      <PagarmePixStep
        orderId={payload.orderId}
        pix={payload.pix}
        onSuccess={onSuccess}
        onError={onError}
      />
    );
  }

  if (
    "checkoutData" in payload &&
    payload.paymentMethod === "card" &&
    "items" in payload
  ) {
    if (!PAGARME_PUBLIC_KEY) {
      return (
        <p className="text-sm text-amber-700">
          Chave pública do Pagar.me não configurada
          (NEXT_PUBLIC_PAGARME_PUBLIC_KEY).
        </p>
      );
    }
    return (
      <PagarmeCardStep
        checkoutData={payload.checkoutData}
        items={payload.items}
        userId={payload.userId}
        installmentOption={payload.installmentOption}
        onSuccess={onSuccess}
        onError={onError}
      />
    );
  }

  return (
    <p className="text-sm text-red-600">
      Dados do pagamento incompletos. Tente novamente.
    </p>
  );
}
