import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * API Route para verificar se um pedido foi criado usando session_id
 * Usado na página de sucesso para verificar se o webhook processou o pedido
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar pedido por stripe_session_id
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, created_at')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar pedido:', error);
      return NextResponse.json(
        { error: 'Erro ao verificar pedido' },
        { status: 500 }
      );
    }

    if (order) {
      return NextResponse.json({
        exists: true,
        orderId: order.id,
        status: order.status,
        createdAt: order.created_at,
      });
    }

    // Pedido ainda não foi criado (webhook pode estar processando)
    return NextResponse.json({
      exists: false,
      message: 'Pedido ainda não foi processado',
    });
  } catch (error: any) {
    console.error('Erro na verificação de pedido:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
