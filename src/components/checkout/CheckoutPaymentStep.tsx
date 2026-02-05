"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CheckoutPaymentPayload,
  CheckoutCartItem,
  CheckoutFormData,
} from "@/types/checkout";
import { getCardBrandFromNumber, type CardBrand } from "@/lib/card-brand";

/**
 * Tokenização V5: apenas pagarme-js com public_key (pk_...).
 * Não usar calculate_installments_amount nem scripts api.pagar.me/1/ — parcelas fixas (3x) no backend.
 */
const PAGARME_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY?.trim() ?? "";

export interface CheckoutPaymentStepProps {
  payload: CheckoutPaymentPayload;
  onSuccess: (id: string) => void;
  onError: (message: string) => void;
}

/** Normaliza base64 (remove espaços/quebras que quebram data URL) */
function normalizeBase64(value: string): string {
  return value.replace(/\s/g, "");
}

/** Ícones de bandeira (padrão e-commerce Pagar.me) — SVG compactos */
function CardBrandIcon({
  brand,
  className = "w-8 h-5",
}: {
  brand: CardBrand;
  className?: string;
}) {
  if (!brand) return null;
  const c = className;
  if (brand === "visa")
    return (
      <span className={`inline-block ${c}`} aria-label="Visa">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 36 24"
          className="w-full h-full"
          aria-hidden
        >
          <path
            fill="#1A1F71"
            d="M33.6 24H2.4A2.4 2.4 0 0 1 0 21.6V2.4A2.4 2.4 0 0 1 2.4 0h31.2A2.4 2.4 0 0 1 36 2.4v19.2a2.4 2.4 0 0 1-2.4 2.4zm-15.76-9.238l-.359 2.25a6.84 6.84 0 0 0 2.903.531h-.011a5.167 5.167 0 0 0 3.275-.933l-.017.011a3.085 3.085 0 0 0 1.258-2.485v-.015v.001c0-1.1-.736-2.014-2.187-2.72a7.653 7.653 0 0 1-1.132-.672l.023.016a.754.754 0 0 1-.343-.592v-.002a.736.736 0 0 1 .379-.6l.004-.002a1.954 1.954 0 0 1 1.108-.257h-.006h.08l.077-.001c.644 0 1.255.139 1.806.388l-.028-.011l.234.125l.359-2.171a6.239 6.239 0 0 0-2.277-.422h-.049h.003a5.067 5.067 0 0 0-3.157.932l.016-.011a2.922 2.922 0 0 0-1.237 2.386v.005c-.01 1.058.752 1.972 2.266 2.72c.4.175.745.389 1.054.646l-.007-.006a.835.835 0 0 1 .297.608v.004c0 .319-.19.593-.464.716l-.005.002c-.3.158-.656.25-1.034.25h-.046h.002h-.075c-.857 0-1.669-.19-2.397-.53l.035.015l-.343-.172zm10.125 1.141h3.315q.08.343.313 1.5H34L31.906 7.372h-2a1.334 1.334 0 0 0-1.357.835l-.003.009l-3.84 9.187h2.72l.546-1.499zM14.891 7.372l-1.626 10.031h2.594l1.625-10.031zM4.922 9.419l2.11 7.968h2.734l4.075-10.015h-2.746l-2.534 6.844l-.266-1.391l-.904-4.609a1.042 1.042 0 0 0-1.177-.844l.006-.001H2.033l-.031.203c3.224.819 5.342 2.586 6.296 5.25A5.74 5.74 0 0 0 6.972 10.8l-.001-.001a6.103 6.103 0 0 0-2.007-1.368l-.04-.015zm25.937 4.421h-2.16q.219-.578 1.032-2.8l.046-.141l.16-.406c.066-.166.11-.302.14-.406l.188.859l.593 2.89z"
          />
        </svg>
      </span>
    );
  if (brand === "mastercard")
    return (
      <span className={`inline-block ${c}`} aria-label="Mastercard">
        <svg
          viewBox="0 0 24 16"
          fill="none"
          className="w-full h-full"
          aria-hidden
        >
          <circle cx="9" cy="8" r="6" fill="#EB001B" />
          <circle cx="15" cy="8" r="6" fill="#F79E1B" />
          <path
            fill="#FF5F00"
            d="M12 3.2a6 6 0 0 1 0 9.6 6 6 0 0 1 0-9.6z"
            opacity=".8"
          />
        </svg>
      </span>
    );
  if (brand === "elo")
    return (
      <span className={`inline-block ${c}`} aria-label="Elo">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 197"
          className="w-full h-full"
          aria-hidden
        >
          <path
            fill="#FC0"
            d="M79.817 43.344A57.633 57.633 0 0 1 98.12 40.39c27.918 0 51.227 19.83 56.566 46.188l39.576-8.073C185.179 33.711 145.594 0 98.12 0a97.947 97.947 0 0 0-31.106 5.04l12.803 38.304Z"
          />
          <path
            fill="#00A0DE"
            d="m33.111 171.604l26.763-30.258c-11.946-10.584-19.484-26.03-19.484-43.239c0-17.196 7.527-32.635 19.466-43.206L33.091 24.64C12.802 42.614 0 68.869 0 98.107c0 29.256 12.807 55.519 33.111 73.497Z"
          />
          <path
            fill="#EC3413"
            d="M154.676 109.69c-5.362 26.345-28.646 46.137-56.556 46.137c-6.405 0-12.572-1.033-18.32-2.965l-12.821 38.32c9.779 3.264 20.25 5.032 31.141 5.032c47.428 0 87.009-33.655 96.126-78.408l-39.57-8.116Z"
          />
          <path
            fill="#000000"
            d="M228.87 142.622c-1.297-2.1-3.06-5.46-4.12-7.932c-6.267-14.55-6.567-29.607-1.274-44.061c5.819-15.852 16.935-27.988 31.298-34.167c18.057-7.771 38.028-6.239 55.334 4.03c10.994 6.307 18.788 16.045 24.706 29.813l.549 1.339l1.024 2.66c.165.429.327.846.489 1.246l-108.007 47.072Zm36.065-62.803c-12.823 5.511-19.433 17.54-18.075 31.644l54.32-23.378c-9.341-10.979-21.499-14.617-36.245-8.266Zm64.014 64.904l-20.996-14.038l-.03.031l-1.125-.758c-3.24 5.26-8.299 9.52-14.68 12.287c-12.142 5.28-23.394 3.923-31.474-3.164l-.743 1.13c-.008-.013-.01-.023-.024-.023l-13.78 20.617a58.958 58.958 0 0 0 10.952 6c15.223 6.323 30.798 6.03 46.142-.643c11.099-4.81 19.807-12.144 25.758-21.44Zm45.678-118.624v114.62l17.82 7.222l-10.126 23.627l-19.67-8.191c-4.416-1.911-7.42-4.838-9.696-8.14c-2.175-3.366-3.802-7.986-3.802-14.206V26.099h25.474Zm46.165 85.42c.01-9.76 4.32-18.513 11.14-24.462l-18.283-20.386c-12.4 10.96-20.21 26.976-20.224 44.82c-.02 17.85 7.778 33.882 20.165 44.871l18.262-20.406c-6.787-5.972-11.068-14.699-11.06-24.437Zm32.484 32.533c-3.6-.01-7.067-.605-10.3-1.681l-8.731 25.96a59.903 59.903 0 0 0 19.002 3.106c28.949.028 53.121-20.512 58.722-47.817l-26.837-5.48c-3.052 14.8-16.157 25.922-31.856 25.912Zm.08-92.389a59.768 59.768 0 0 0-18.985 3.056l8.655 25.984a32.824 32.824 0 0 1 10.304-1.662c15.736.015 28.85 11.203 31.83 26.045L512 99.642c-5.524-27.345-29.673-47.961-58.645-47.979Z"
          />
        </svg>
      </span>
    );
  if (brand === "amex")
    return (
      <span className={`inline-block ${c}`} aria-label="American Express">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          className="w-full h-full"
          aria-hidden
        >
          <path
            fill="#006FCF"
            d="M256 138.548V0H0v256h256v-74.69c-.57 0 0-42.762 0-42.762"
          />
          <path
            fill="#FFF"
            d="M224.641 124.294h19.386V79.252H222.93v6.271l-3.991-6.271h-18.245v7.982l-3.421-7.982h-33.64c-1.14 0-2.28.57-3.42.57c-1.14 0-1.71.57-2.851 1.14c-1.14.57-1.71.57-2.85 1.14v-2.85H58.155l-2.85 7.412l-2.852-7.412H29.648v7.982l-3.42-7.982H7.981L0 98.637v25.657h13.114l2.28-6.272h4.561l2.281 6.272h100.348v-5.702l3.99 5.702h27.938v-3.42c.57.57 1.71.57 2.28 1.14c.571.57 1.711.57 2.281 1.14c1.14.57 2.281.57 3.421.57h20.526l2.28-6.272h4.562l2.28 6.272h27.938v-5.702l4.561 6.272ZM256 181.31v-42.192H99.207l-3.991 5.702l-3.991-5.702H45.612v45.042h45.613l3.991-5.701l3.991 5.701h28.508v-9.692h-1.14c3.99 0 7.412-.57 10.262-1.71v11.973h20.526v-5.702l3.991 5.702h84.953c3.421-1.14 6.842-1.711 9.693-3.421Z"
          />
          <path
            fill="#006FCF"
            d="M246.307 170.477h-15.394v6.271h14.824c6.272 0 10.263-3.99 10.263-9.692s-3.42-8.553-9.122-8.553h-6.842c-1.71 0-2.851-1.14-2.851-2.85c0-1.71 1.14-2.851 2.85-2.851h13.114L256 146.53h-15.394c-6.272 0-10.263 3.991-10.263 9.123c0 5.701 3.42 8.552 9.122 8.552h6.842c1.71 0 2.851 1.14 2.851 2.85c.57 2.281-.57 3.422-2.85 3.422Zm-27.937 0h-15.394v6.271H217.8c6.271 0 10.262-3.99 10.262-9.692s-3.42-8.553-9.122-8.553h-6.842c-1.71 0-2.85-1.14-2.85-2.85c0-1.71 1.14-2.851 2.85-2.851h13.114l2.85-6.272h-15.394c-6.272 0-10.263 3.991-10.263 9.123c0 5.701 3.421 8.552 9.123 8.552h6.842c1.71 0 2.85 1.14 2.85 2.85c.57 2.281-1.14 3.422-2.85 3.422Zm-19.956-18.245v-6.272h-23.946v30.218h23.946v-6.272H181.31v-6.271h16.534v-6.272H181.31v-5.702h17.104v.57Zm-38.77 0c2.85 0 3.99 1.71 3.99 3.42c0 1.711-1.14 3.421-3.99 3.421h-8.553v-7.412l8.553.57Zm-8.553 13.113h3.421l9.123 10.833h8.552l-10.263-11.403c5.132-1.14 7.982-4.561 7.982-9.122c0-5.702-3.99-9.693-10.262-9.693h-15.965v30.218h6.842l.57-10.833Zm-18.245-9.122c0 2.28-1.14 3.99-3.99 3.99h-9.123v-7.981h8.552c2.85 0 4.561 1.71 4.561 3.99Zm-19.955-10.263v30.218h6.842v-10.263h9.122c6.272 0 10.833-3.99 10.833-10.262c0-5.702-3.99-10.263-10.263-10.263l-16.534.57Zm-10.263 30.218h8.552l-11.973-15.394l11.973-14.824h-8.552l-7.412 9.693l-7.412-9.693h-8.552l11.973 14.824l-11.973 14.824h8.552l7.412-9.693l7.412 10.263Zm-25.657-23.946v-6.272H53.024v30.218h23.947v-6.272H59.866v-6.271h16.535v-6.272H59.866v-5.702h17.105v.57Zm138.548-53.595l11.973 18.245h8.553V86.664h-6.842v19.955l-1.71-2.85l-10.834-17.105h-9.122v30.218h6.842V96.356l1.14 2.281Zm-29.648-.57l2.28-6.272l2.281 6.272l2.85 6.842H183.02l2.85-6.842Zm11.973 18.815h7.412l-13.113-30.218h-9.123l-13.114 30.218h7.412l2.851-6.272h14.824l2.851 6.272Zm-31.929 0l2.851-6.272h-1.71c-5.132 0-7.983-3.42-7.983-8.552v-.57c0-5.132 2.851-8.553 7.983-8.553h7.412v-6.271h-7.982c-9.123 0-14.254 6.271-14.254 14.824v.57c0 9.122 5.131 14.824 13.683 14.824Zm-25.657 0h6.842V87.234h-6.842v29.648Zm-14.824-23.947c2.851 0 3.991 1.71 3.991 3.421c0 1.71-1.14 3.421-3.99 3.421h-8.553v-7.412l8.552.57Zm-8.552 13.114h3.42l9.123 10.833h8.553l-10.263-11.403c5.131-1.14 7.982-4.561 7.982-9.123c0-5.701-3.991-9.692-10.263-9.692H109.47v30.218h6.842l.57-10.833Zm-12.543-13.114v-6.271H80.392v30.218h23.947v-6.272H87.234v-6.271h16.534v-6.272H87.234v-5.702h17.105v.57Zm-51.885 23.947h6.272l8.552-24.517v24.517h6.842V86.664H62.717l-6.842 20.525l-6.842-20.525H37.63v30.218h6.842V92.365l7.982 24.517Zm-37.06-18.815l2.28-6.272l2.281 6.272l2.851 6.842H12.543l2.851-6.842Zm11.973 18.815h7.413L21.666 86.664h-8.552L0 116.882h7.412l2.85-6.272h14.825l2.28 6.272Z"
          />
        </svg>
      </span>
    );
  return null;
}

/** Intervalo de polling para verificar se o pedido foi pago (webhook criou o pedido) */
const PIX_POLL_INTERVAL_MS = 3000;
const PIX_POLL_MAX_ATTEMPTS = 100; // ~5 min

/** Step PIX: exibe QR Code, código copia-e-cola e link; polling automático redireciona quando pago (padrão Pagar.me) */
function PagarmePixStep({
  orderId,
  pix,
  onSuccess,
  onError,
}: {
  orderId: string;
  pix: {
    qr_code: string | null;
    qr_code_url: string | null;
    pix_copy_paste: string | null;
  };
  onSuccess: (id: string) => void;
  onError: (message: string) => void;
}) {
  const [qrImageFailed, setQrImageFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  // qr_code deve ser base64 de imagem; se for código EMV (0002...) não usar como img (ERR_INVALID_URL)
  const isQrCodeBase64 =
    pix.qr_code && pix.qr_code.trim() && !pix.qr_code.trim().startsWith("0002");
  const hasQrCode = Boolean(isQrCodeBase64);
  const hasQrUrl = Boolean(pix.qr_code_url && pix.qr_code_url.trim());
  const hasCopyPaste = Boolean(pix.pix_copy_paste && pix.pix_copy_paste.trim());
  const showQrImage = hasQrCode && !qrImageFailed;
  const showLink = hasQrUrl;

  // Polling: quando o webhook Pagar.me criar o pedido no Supabase, redireciona automaticamente (comportamento padrão)
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const checkOrder = async () => {
      if (cancelled || attempts >= PIX_POLL_MAX_ATTEMPTS) return;
      attempts++;
      try {
        const res = await fetch(
          `/api/orders/verify?session_id=${encodeURIComponent(orderId)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data.exists) {
          onSuccessRef.current(orderId);
          return;
        }
      } catch {
        if (cancelled) return;
      }
    };

    const intervalId = setInterval(checkOrder, PIX_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [orderId]);

  if (!hasQrCode && !hasQrUrl && !hasCopyPaste) {
    onError(
      "PIX não disponível para este pedido. Verifique se PIX está habilitado na sua conta Pagar.me ou tente novamente em instantes.",
    );
    return null;
  }

  const handleCopyPixCode = async () => {
    if (!pix.pix_copy_paste) return;
    try {
      await navigator.clipboard.writeText(pix.pix_copy_paste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-softblack/80">
        Escaneie o QR Code ou copie o código PIX para pagar no app do seu banco.
      </p>
      {showQrImage && (
        <div className="flex justify-center bg-white p-4 rounded-sm border border-gray-100">
          <img
            src={`data:image/png;base64,${normalizeBase64(pix.qr_code!)}`}
            alt="QR Code PIX"
            className="w-48 h-48 object-contain"
            onError={() => setQrImageFailed(true)}
          />
        </div>
      )}
      {showLink && (
        <>
          {qrImageFailed && (
            <p className="text-xs text-brand-softblack/70 text-center">
              Abra o link abaixo para ver o QR Code ou pagar pelo app do banco.
            </p>
          )}
          <a
            href={pix.qr_code_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full py-3 px-4 bg-brand-green text-white font-medium text-sm rounded-sm hover:bg-brand-green/90 transition-colors"
          >
            Abrir PIX no navegador
          </a>
        </>
      )}
      {hasCopyPaste && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-brand-softblack/80">
            Código PIX para copiar e colar
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={pix.pix_copy_paste!}
              className="flex-1 min-w-0 px-3 py-2.5 text-[11px] sm:text-xs font-mono text-brand-softblack bg-white border border-gray-200 rounded-sm overflow-x-auto"
              aria-label="Código PIX"
            />
            <button
              type="button"
              onClick={handleCopyPixCode}
              className="shrink-0 px-4 py-2.5 bg-brand-green text-white text-sm font-medium rounded-sm hover:bg-brand-green/90 transition-colors whitespace-nowrap"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
      )}
      <div className="p-4 border border-gray-100 rounded-sm bg-gray-50/70">
        <p className="text-[11px] text-brand-softblack/70 leading-relaxed">
          Pagou via PIX? Estamos verificando o pagamento. Você será
          redirecionado automaticamente assim que for aprovado.
        </p>
        <p className="mt-2 text-[11px] text-brand-green/80 flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 border border-brand-green border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
          Aguardando confirmação do pagamento…
        </p>
        <button
          type="button"
          onClick={() => onSuccess(orderId)}
          className="mt-3 w-full py-3 px-4 bg-brand-green text-white font-medium uppercase tracking-widest text-sm rounded-sm hover:bg-brand-green/90 transition-colors"
        >
          Ver status do pedido agora
        </button>
      </div>
    </div>
  );
}

/** Step Cartão: tokenização com pagarme-js no submit; token enviado para a API/Server Action */
function PagarmeCardStep({
  checkoutData,
  items,
  userId,
  installmentOption,
  couponCode,
  shippingReais,
  selectedShippingOption,
  onSuccess,
  onError,
}: {
  checkoutData: CheckoutFormData;
  items: CheckoutCartItem[];
  userId: string | null;
  installmentOption: "1x" | "2x" | "3x";
  couponCode?: string | null;
  shippingReais?: number;
  selectedShippingOption?: { id: string; name: string; type: string } | null;
  onSuccess: (id: string) => void;
  onError: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [cardNumberDigits, setCardNumberDigits] = useState("");
  const [expDateDigits, setExpDateDigits] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const cardBrand = getCardBrandFromNumber(cardNumberDigits);

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
            card_token: cardToken,
            checkoutData,
            couponCode: couponCode?.trim() || null,
            shippingReais,
            selectedShippingOption,
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
    [items, userId, installmentOption, checkoutData, couponCode, shippingReais, selectedShippingOption],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (loading || submittedRef.current || !formRef.current) return;
      if (!PAGARME_PUBLIC_KEY) {
        onErrorRef.current(
          "Chave do Pagar.me não configurada. Entre em contato com o suporte.",
        );
        return;
      }
      const form = formRef.current;
      const holderName = (form.elements.namedItem("holder_name") as HTMLInputElement | null)?.value?.trim() ?? "";
      const cvv = (form.elements.namedItem("cvv") as HTMLInputElement | null)?.value?.trim() ?? "";
      const cardNumber = cardNumberDigits.replace(/\D/g, "");
      const expiry = expDateDigits.replace(/\D/g, "").slice(0, 4);
      if (!cardNumber || !expiry || !holderName || !cvv) {
        alert("Preencha todos os campos do cartão: nome, número, validade (MM/AA) e CVV.");
        return;
      }
      setLoading(true);
      const expMonth = parseInt(expiry.slice(0, 2), 10);
      const expYearTwo = expiry.slice(2, 4);
      const expYear = 2000 + parseInt(expYearTwo, 10);
      try {
        const res = await fetch(
          `https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(PAGARME_PUBLIC_KEY)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "card",
              card: {
                number: cardNumber,
                holder_name: holderName,
                exp_month: expMonth,
                exp_year: expYear,
                cvv,
              },
            }),
          },
        );
        const data = (await res.json().catch(() => ({}))) as {
          id?: string;
          message?: string;
          errors?: Record<string, string[]>;
        };
        if (!res.ok) {
          setLoading(false);
          const msg =
            data.message ??
            (data.errors && typeof data.errors === "object"
              ? Object.values(data.errors).flat().join(", ")
              : "Não foi possível gerar o token do cartão.");
          console.error("[Pagar.me tokens] API error:", data);
          alert(msg);
          return;
        }
        const tokenId = data.id?.trim();
        if (tokenId && tokenId.length <= 36) {
          await submitWithToken(tokenId);
        } else {
          setLoading(false);
          alert("Resposta inválida da tokenização. Tente novamente.");
        }
      } catch (err) {
        setLoading(false);
        const errObj = err && typeof err === "object" ? (err as Record<string, unknown>) : null;
        const message =
          errObj?.message != null
            ? String(errObj.message)
            : errObj?.error != null
              ? String(errObj.error)
              : err && typeof err === "object" && "message" in err
                ? String((err as { message: unknown }).message)
                : "Não foi possível validar o cartão. Verifique os dados e tente novamente.";
        console.error("[Pagar.me tokens] Erro ao tokenizar:", err);
        alert(message);
      }
    },
    [loading, cardNumberDigits, expDateDigits, submitWithToken],
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-softblack/80">
        Pagamento no cartão em <strong>{installmentOption}</strong> sem juros.
      </p>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-medium text-brand-softblack/80 mb-1">
            Nome no cartão
          </label>
          <input
            type="text"
            name="holder_name"
            placeholder="Como está no cartão"
            className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm text-brand-softblack focus:border-brand-green focus:outline-none"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label className="block text-xs font-medium text-brand-softblack/80">
              Número do cartão
            </label>
            <CardBrandIcon brand={cardBrand} className="w-9 h-6" />
          </div>
          <input
            type="text"
            name="card_number"
            value={cardNumberDigits}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              const maxLen =
                digits.startsWith("34") || digits.startsWith("37") ? 15 : 16;
              setCardNumberDigits(digits.slice(0, maxLen));
            }}
            placeholder="0000 0000 0000 0000"
            inputMode="numeric"
            autoComplete="cc-number"
            maxLength={19}
            className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm text-brand-softblack focus:border-brand-green focus:outline-none font-mono"
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
              placeholder="MM/AA (ex: 12/28)"
              value={
                expDateDigits.length >= 2
                  ? `${expDateDigits.slice(0, 2)}/${expDateDigits.slice(2)}`
                  : expDateDigits
              }
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                setExpDateDigits(digits);
              }}
              inputMode="numeric"
              autoComplete="cc-exp"
              maxLength={5}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm text-brand-softblack focus:border-brand-green focus:outline-none font-mono"
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
              placeholder="123"
              maxLength={4}
              inputMode="numeric"
              autoComplete="cc-csc"
              className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm text-brand-softblack focus:border-brand-green focus:outline-none font-mono"
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
          Chave pública do Pagar.me não configurada. Configure{" "}
          <code className="text-xs">NEXT_PUBLIC_PAGARME_PUBLIC_KEY</code> com
          pk_test_... ou pk_live_... (pagarme-js).
        </p>
      );
    }
    return (
      <PagarmeCardStep
        checkoutData={payload.checkoutData}
        items={payload.items}
        userId={payload.userId}
        installmentOption={payload.installmentOption}
        couponCode={"couponCode" in payload ? payload.couponCode : null}
        shippingReais={"shippingReais" in payload ? payload.shippingReais : undefined}
        selectedShippingOption={"selectedShippingOption" in payload ? payload.selectedShippingOption : undefined}
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
