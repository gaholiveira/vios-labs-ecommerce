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
          viewBox="0 0 48 16"
          fill="none"
          className="w-full h-full"
          aria-hidden
        >
          <path d="M19 2L16 14h-3l3-12h3z" fill="#1A1F71" />
          <path
            d="M31 2.2c-.6-.2-1.5-.5-2.7-.5-3 0-5 1.6-5 3.8 0 1.7 1.5 2.6 2.6 3.2 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.1-1.9 1.1-1.3 0-2-.2-3-.7l-.4 2.4c.7.3 1.9.6 3.2.6 3.2 0 5.2-1.5 5.2-3.9 0-1.3-.8-2.3-2.6-3.1-1.1-.5-1.8-.9-1.8-1.5 0-.5.5-.9 1.8-.9 1 0 1.7.2 2.3.5l.4-2.3z"
            fill="#1A1F71"
          />
          <path
            d="M41 2l-2.5 12h-2.9l2.5-12h2.9zm-7.2 0c.3 0 .6 0 .8.2l1.5 9.2 2-9.2c.4-.1.8-.2 1.2-.2h1.4L39 14h-3.2l-2.2-6.8-2.3 6.8h-3.2l3.9-12h2.6z"
            fill="#1A1F71"
          />
          <path
            d="M12.3 2L8 14H5l1.4-3.4C5.5 9.5 4 7.5 4 5c0-2 1.6-3 3.3-3 1 0 1.8.2 2.4.5L9.5 6.8c-.2-.6-.8-1-1.5-1-.7 0-1.3.4-1.3 1.1 0 .7.9 1 1.6 1.3l1.5.4 2.6-6.6h2.4z"
            fill="#F9A51A"
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
      <span
        className={`inline-block ${c} font-semibold text-[10px] text-brand-softblack uppercase tracking-tight`}
        aria-label="Elo"
      >
        Elo
      </span>
    );
  if (brand === "amex")
    return (
      <span
        className={`inline-block ${c} font-semibold text-[10px] text-brand-softblack uppercase tracking-tight`}
        aria-label="American Express"
      >
        Amex
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
  onSuccess,
  onError,
}: {
  checkoutData: CheckoutFormData;
  items: CheckoutCartItem[];
  userId: string | null;
  installmentOption: "1x" | "2x" | "3x";
  couponCode?: string | null;
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
    [items, userId, installmentOption, checkoutData, couponCode],
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
