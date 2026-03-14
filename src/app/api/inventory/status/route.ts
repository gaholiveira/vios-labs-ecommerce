import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/utils/rate-limit';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

// ============================================================================
// API: CONSULTAR STATUS DO ESTOQUE
// ============================================================================
// Rota: GET /api/inventory/status
// Retorna o status do estoque de todos os produtos ou de um produto específico
// ============================================================================

/**
 * GET /api/inventory/status
 * Query params:
 * - product_id (opcional): ID do produto específico
 */
export async function GET(req: NextRequest) {
  const rl = rateLimit(getClientIp(req), { limit: 60, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

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

      return NextResponse.json(product, {
        headers: {
          // Cache de 30s na CDN; serve dado stale por até 60s enquanto revalida.
          // Estoque pode mudar com compras, por isso o TTL é curto.
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      });
    }

    // Retornar todos os produtos
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });

  } catch (err: unknown) {
    console.error('Error in inventory status API:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
