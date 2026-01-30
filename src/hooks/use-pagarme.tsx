"use client";

import Script from "next/script";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";

/**
 * API v5 Pagar.me: o checkout de cartão usa tokenizecard.js + Public Key (pk_...)
 * para gerar o token (ver CheckoutPaymentStep). A API v5 exige credit_card.card.token.
 * Este hook (checkout.js 1.1.0 + encryption_key) gera hash legado; para V5 use apenas o token do tokenizecard.
 */
const PAGARME_CHECKOUT_SCRIPT =
  "https://assets.pagar.me/checkout/1.1.0/checkout.js";

const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_PAGARME_ENCRYPTION_KEY?.trim() ?? "";

declare global {
  interface Window {
    PagarMe?: {
      checkout?: {
        getCardHash: (
          encryptionKey: string,
          cardData: PagarMeCheckoutCardData,
          callback: (error: unknown, hash: string | null) => void,
        ) => void;
      };
    };
  }
}

/** Dados do cartão no formato esperado pelo checkout.js do Pagar.me */
export interface PagarMeCheckoutCardData {
  /** Número do cartão (apenas dígitos) */
  card_number: string;
  /** Nome no cartão */
  card_holder_name: string;
  /** Validade no formato MMYY */
  card_expiration_date: string;
  /** CVV (3 ou 4 dígitos) */
  card_cvv: string;
}

export interface UsePagarMeReturn {
  /** Componente que deve ser renderizado para carregar o script (ex.: <PagarMeScript />) */
  PagarMeScript: () => ReactNode;
  /** true quando o script de criptografia foi carregado */
  isReady: boolean;
  /** Gera hash legado (checkout.js 1.1.0). Para API v5 use tokenizecard + token. */
  getCardHash: (cardData: PagarMeCheckoutCardData) => Promise<string>;
  /** Chave de criptografia legada está configurada (env) */
  hasEncryptionKey: boolean;
}

/**
 * Hook legado: checkout.js 1.1.0 + encryption_key (hash). Para API v5 use tokenizecard.js
 * com NEXT_PUBLIC_PAGARME_PUBLIC_KEY para gerar o token enviado em credit_card.card.token.
 * Variável de ambiente (legado): NEXT_PUBLIC_PAGARME_ENCRYPTION_KEY
 */
export function usePagarMe() {
  const [isReady, setIsReady] = useState(false);

  const PagarMeScript = useCallback((): ReactNode => {
    if (!ENCRYPTION_KEY) {
      return <></>;
    }
    return (
      <Script
        src={PAGARME_CHECKOUT_SCRIPT}
        strategy="afterInteractive"
        onLoad={() => setIsReady(true)}
      />
    );
  }, []);

  const getCardHash = useCallback(
    (cardData: PagarMeCheckoutCardData): Promise<string> => {
      if (!ENCRYPTION_KEY) {
        return Promise.reject(
          new Error(
            "NEXT_PUBLIC_PAGARME_ENCRYPTION_KEY não está configurada. Configure no .env.",
          ),
        );
      }
      const checkout =
        typeof window !== "undefined" ? window.PagarMe?.checkout : undefined;
      if (!checkout || typeof checkout.getCardHash !== "function") {
        return Promise.reject(
          new Error(
            "Script de criptografia do Pagar.me ainda não carregou. Aguarde isReady ou renderize PagarMeScript.",
          ),
        );
      }
      const getCardHashFn = checkout.getCardHash;
      return new Promise((resolve, reject) => {
        getCardHashFn(
          ENCRYPTION_KEY,
          {
            card_number: cardData.card_number.replace(/\D/g, ""),
            card_holder_name: cardData.card_holder_name.trim(),
            card_expiration_date: cardData.card_expiration_date.replace(
              /\D/g,
              "",
            ),
            card_cvv: cardData.card_cvv.replace(/\D/g, ""),
          },
          (error, hash) => {
            if (error) {
              reject(
                error instanceof Error
                  ? error
                  : new Error(String(error ?? "Falha ao gerar hash do cartão.")),
              );
              return;
            }
            if (hash && hash.trim()) {
              resolve(hash.trim());
            } else {
              reject(new Error("Resposta do Pagar.me sem hash."));
            }
          },
        );
      });
    },
    [],
  );

  return {
    PagarMeScript,
    isReady,
    getCardHash,
    hasEncryptionKey: Boolean(ENCRYPTION_KEY),
  } as UsePagarMeReturn;
}
