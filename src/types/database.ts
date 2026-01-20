/**
 * Tipos do Banco de Dados - VIOS LABS
 * 
 * Este arquivo documenta as interfaces TypeScript para as tabelas do Supabase.
 * ATUALIZADO: Suporte para Guest Checkout (user_id opcional em orders)
 */

export interface Order {
  id: string;
  user_id: string | null; // NULL para guest checkout
  customer_email: string; // Obrigatório (coletado no Stripe Checkout)
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  stripe_session_id?: string; // ID da sessão do Stripe
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  username?: string;
  website?: string;
}

export interface VipList {
  id: string;
  user_id?: string;
  email: string;
  full_name?: string;
  created_at: string;
}

/**
 * Tipos para Checkout (Guest ou User)
 */
export interface CheckoutData {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  userId: string | null; // null para guest checkout
  customerEmail: string | null; // null para guest, será coletado no Stripe
}

/**
 * Metadata do Stripe Checkout Session
 * Usado no webhook para identificar se é Guest ou User
 */
export interface StripeCheckoutMetadata {
  userId: string | 'null'; // Stripe converte null para string 'null'
  customerEmail: string | 'null';
  isGuest: 'true' | 'false';
}
