import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    'Missing STRIPE_SECRET_KEY environment variable. Please add it to your .env.local file.'
  );
}

/**
 * Cliente Stripe para uso no servidor (API Routes, Server Components, etc.)
 * Este cliente usa a chave secreta (STRIPE_SECRET_KEY) e não deve ser exposto ao cliente
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
  maxNetworkRetries: 2,
  timeout: 30000,
});

/**
 * Tipagem para produtos do Stripe
 */
export type StripeProduct = Stripe.Product;
export type StripePrice = Stripe.Price;
export type StripeCheckoutSession = Stripe.Checkout.Session;
export type StripePaymentIntent = Stripe.PaymentIntent;
