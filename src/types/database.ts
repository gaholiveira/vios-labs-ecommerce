/**
 * Tipos do Banco de Dados - VIOS LABS
 *
 * Este arquivo documenta as interfaces TypeScript para as tabelas do Supabase.
 * ATUALIZADO:
 * - Suporte para Guest Checkout (user_id opcional em orders)
 * - Sistema de Gestão de Estoque (Inventory Management)
 */

export interface Order {
  id: string;
  user_id: string | null; // NULL para guest checkout
  customer_email: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  stripe_session_id?: string; // ID do pedido Pagar.me (ou referência de outro gateway)
  created_at: string;
  updated_at: string;
  // Fiscal e entrega (preenchidos no checkout e no webhook Pagar.me)
  customer_cpf?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  shipping_cep?: string | null;
  shipping_street?: string | null;
  shipping_number?: string | null;
  shipping_complement?: string | null;
  shipping_neighborhood?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
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
  phone?: string;
  avatar_url?: string;
  email?: string;
  username?: string;
  website?: string;
  address_street?: string;
  address_city?: string;
  address_postcode?: string;
  address_country?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VipList {
  id: string;
  user_id?: string;
  email: string;
  full_name?: string;
  phone?: string;
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
  customerEmail: string | null; // null para guest, será coletado no checkout
}

/**
 * Metadata de checkout (Pagar.me / guest ou user)
 */
export interface CheckoutMetadata {
  userId: string | "null";
  customerEmail: string | "null";
  isGuest: "true" | "false";
}

// ============================================================================
// SISTEMA DE GESTÃO DE ESTOQUE
// ============================================================================

/**
 * Produto no Banco de Dados
 */
export interface ProductDB {
  id: string;
  name: string;
  description: string | null;
  price: number;
  old_price: number | null;
  category: string;
  image_url: string | null;
  badge: "bestseller" | "novo" | "vegano" | null;
  anvisa_record: string | null;
  rating: number | null;
  reviews: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Inventário (Estoque)
 */
export interface Inventory {
  id: string;
  product_id: string;
  stock_quantity: number; // Estoque total
  reserved_quantity: number; // Estoque reservado (checkout em andamento)
  low_stock_threshold: number; // Alerta de estoque baixo
  reorder_point: number; // Ponto de reposição
  created_at: string;
  updated_at: string;
}

/**
 * Reserva de Estoque (durante checkout)
 */
export interface InventoryReservation {
  id: string;
  product_id: string;
  quantity: number;
  stripe_session_id: string | null;
  status: "active" | "completed" | "cancelled" | "expired";
  expires_at: string;
  created_at: string;
  completed_at: string | null;
  customer_email: string | null;
  user_id: string | null;
}

/**
 * Movimento de Estoque (Auditoria)
 */
export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type:
    | "sale"
    | "reservation"
    | "reservation_release"
    | "restock"
    | "adjustment"
    | "return";
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_id: string | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

/**
 * Status do Estoque (View)
 */
export interface InventoryStatus {
  product_id: string;
  product_name: string;
  price: number;
  is_active: boolean;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number; // stock_quantity - reserved_quantity
  low_stock_threshold: number;
  reorder_point: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  inventory_updated_at: string;
}

/**
 * Resposta da função reserve_inventory
 */
export interface ReserveInventoryResponse {
  success: boolean;
  error?: string;
  available?: number;
  requested?: number;
  reservation_id?: string;
  expires_at?: string;
}

/**
 * Resposta da função confirm_reservation
 */
export interface ConfirmReservationResponse {
  success: boolean;
  error?: string;
  product_id?: string;
  quantity_sold?: number;
}

/**
 * Resposta da função release_reservation
 */
export interface ReleaseReservationResponse {
  success: boolean;
  error?: string;
  product_id?: string;
  quantity_released?: number;
}
