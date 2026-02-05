import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// API: CONSULTAR STATUS DO ESTOQUE
// ============================================================================
// Rota: GET /api/inventory/status
// Retorna o status do estoque de todos os produtos ou de um produto específico
// ============================================================================

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * GET /api/inventory/status
 * Query params:
 * - product_id (opcional): ID do produto específico
 */
export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product_id');

    // Consultar view inventory_status
    let query = supabaseAdmin
      .from('inventory_status')
      .select('*')
      .eq('is_active', true);

    // Filtrar por produto específico se fornecido
    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching inventory status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inventory status', details: error.message },
        { status: 500 }
      );
    }

    // Se consultou produto específico, retornar apenas ele
    if (productId) {
      const product = data && data.length > 0 ? data[0] : null;
      
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(product);
    }

    // Retornar todos os produtos
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in inventory status API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
