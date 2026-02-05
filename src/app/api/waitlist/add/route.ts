import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// API: ADICIONAR À WAITLIST
// ============================================================================
// Rota: POST /api/waitlist/add
// Adiciona email à fila de espera quando produto estiver esgotado
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

interface AddToWaitlistRequest {
  product_id: string;
  email: string;
  user_id?: string;
}

/**
 * POST /api/waitlist/add
 * Body: { product_id, email, user_id? }
 */
export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body: AddToWaitlistRequest = await req.json();

    // Validações
    if (!body.product_id || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, email' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Chamar função do PostgreSQL
    const { data, error } = await supabaseAdmin.rpc('add_to_waitlist', {
      p_product_id: body.product_id,
      p_email: body.email.toLowerCase().trim(),
      p_user_id: body.user_id || null,
    });

    if (error) {
      console.error('[WAITLIST ERROR] Error adding to waitlist:', error);
      return NextResponse.json(
        { error: 'Failed to add to waitlist', details: error.message },
        { status: 500 }
      );
    }

    const response = data as {
      success: boolean;
      error?: string;
      waitlist_id?: string;
      product_name?: string;
      message?: string;
    };

    // Se falhou (produto não encontrado)
    if (!response.success) {
      return NextResponse.json(
        { error: response.error },
        { status: 404 }
      );
    }

    // Sucesso
    return NextResponse.json({
      success: true,
      waitlist_id: response.waitlist_id,
      product_name: response.product_name,
      message: response.message || 'Você será notificado quando o produto voltar ao estoque',
    });

  } catch (error: unknown) {
    // Log estruturado do erro
    console.error('[WAITLIST ERROR] Error in add to waitlist API:', 
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
