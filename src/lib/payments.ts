/**
 * Camada de pagamentos — VIOS Labs
 * Instancia e reexporta Pagar.me (v5) e Stripe para uso em Server Actions e API routes.
 */

// ============================================================================
// PAGAR.ME (v5) — checkout transparente (PIX e cartão via credit_card.card.token)
// ============================================================================

import {
  createOrder as pagarmeCreateOrder,
  getCharge as pagarmeGetCharge,
  extractPixFromCharge,
  isPagarmeConfigured,
  isProduction as pagarmeIsProduction,
  getPublicKey as pagarmeGetPublicKey,
  isPublicKeyConfigured as pagarmeIsPublicKeyConfigured,
  buildPagarmeCustomer,
  buildPagarmeAddress,
  type PagarmeCreateOrderRequest,
  type PagarmeOrderResponse,
  type PagarmeChargeResponse,
  type PagarmeAddress,
  type PagarmeCustomer,
  type PagarmeOrderItem,
  type PagarmePayment,
  type ExtractedPixData,
  type CheckoutFormCustomerInput,
} from "@/lib/pagarme";

export const pagarme = {
  createOrder: pagarmeCreateOrder,
  getCharge: pagarmeGetCharge,
  extractPixFromCharge,
  isConfigured: isPagarmeConfigured,
  isProduction: pagarmeIsProduction,
  getPublicKey: pagarmeGetPublicKey,
  isPublicKeyConfigured: pagarmeIsPublicKeyConfigured,
  buildPagarmeCustomer,
  buildPagarmeAddress,
};

export type {
  PagarmeCreateOrderRequest,
  PagarmeOrderResponse,
  PagarmeChargeResponse,
  PagarmeAddress,
  PagarmeCustomer,
  PagarmeOrderItem,
  PagarmePayment,
  ExtractedPixData,
  CheckoutFormCustomerInput,
};

// ============================================================================
// STRIPE — opcional (configure STRIPE_SECRET_KEY e instale o pacote "stripe")
// ============================================================================

let stripeInstance: unknown = null;

/**
 * Retorna instância do Stripe quando STRIPE_SECRET_KEY está configurada.
 * Para usar: pnpm add stripe e defina STRIPE_SECRET_KEY no .env.
 */
export function getStripe(): unknown {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (stripeInstance) return stripeInstance;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require("stripe");
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
      typescript: true,
    });
    return stripeInstance;
  } catch {
    return null;
  }
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
