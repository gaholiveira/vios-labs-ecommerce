import Stripe from 'stripe';

/**
 * Cliente Stripe para uso no servidor (API Routes, Server Components, etc.)
 * Este cliente usa a chave secreta (STRIPE_SECRET_KEY) e não deve ser exposto ao cliente
 * 
 * Nota: A verificação da variável de ambiente é feita em runtime para permitir builds
 * sem a chave definida (necessária apenas em produção).
 * O erro será lançado apenas quando o Stripe for realmente usado (em runtime).
 */
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Verifica apenas se a chave existe, mas não lança erro durante o build
// O erro será lançado em runtime quando o Stripe for inicializado
export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
      maxNetworkRetries: 2,
      timeout: 30000,
    })
  : (() => {
      // Retorna um objeto proxy que lança erro apenas quando acessado
      return new Proxy({} as Stripe, {
        get() {
          throw new Error(
            'Missing STRIPE_SECRET_KEY environment variable. Please add it to your .env.local file.'
          );
        },
      });
    })();

/**
 * Tipagem para produtos do Stripe
 */
export type StripeProduct = Stripe.Product;
export type StripePrice = Stripe.Price;
export type StripeCheckoutSession = Stripe.Checkout.Session;
export type StripePaymentIntent = Stripe.PaymentIntent;
