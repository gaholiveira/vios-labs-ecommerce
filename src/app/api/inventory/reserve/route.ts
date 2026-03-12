import { NextResponse } from 'next/server';
import type { ReserveInventoryResponse } from '@/types/database';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

// ============================================================================
// API: RESERVAR ESTOQUE (PRÉ-CHECKOUT)
// ============================================================================
// Rota: POST /api/inventory/reserve
// Reserva estoque temporariamente durante o checkout (expira em 1 hora)
// ============================================================================

interface ReserveInventoryRequest {
  product_id: string;
  quantity: number;
  payment_order_id: string;
  customer_email?: string;
  user_id?: string;
}

/**
 * POST /api/inventory/reserve
 * Body: { product_id, quantity, payment_order_id, customer_email?, user_id? }
 */
export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body: ReserveInventoryRequest = await req.json();

    // Validações
    if (!body.product_id || !body.quantity || !body.payment_order_id) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, quantity, payment_order_id' },
        { status: 400 }
      );
    }

    if (body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Chamar função do PostgreSQL para reservar estoque
    const { data, error } = await supabaseAdmin.rpc('reserve_inventory', {
      p_product_id: body.product_id,
      p_quantity: body.quantity,
      p_payment_order_id: body.payment_order_id,
      p_customer_email: body.customer_email || null,
      p_user_id: body.user_id || null,
    });

    if (error) {
      console.error('Error reserving inventory:', error);
      return NextResponse.json(
        { error: 'Failed to reserve inventory', details: error.message },
        { status: 500 }
      );
    }

    const response = data as ReserveInventoryResponse;

    // Se a reserva falhou (estoque insuficiente)
    if (!response.success) {
      return NextResponse.json(
        {
          error: response.error,
          available: response.available,
          requested: response.requested,
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Sucesso
    return NextResponse.json({
      success: true,
      reservation_id: response.reservation_id,
      expires_at: response.expires_at,
    });

  } catch (error: unknown) {
    // Log estruturado do erro
    console.error('Error in reserve inventory API:', 
      error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error
    );
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Internal server error';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
