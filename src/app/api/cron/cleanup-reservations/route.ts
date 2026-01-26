import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route para limpeza automática de reservas expiradas
 * 
 * Esta rota deve ser chamada via CRON job (Vercel Cron ou similar)
 * Recomendado: Executar a cada 15 minutos
 * 
 * Configuração Vercel Cron (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-reservations",
 *     "schedule": "0,15,30,45 * * * *"
 *   }]
 * }
 * 
 * Nota: O schedule acima executa nos minutos 0, 15, 30 e 45 de cada hora
 * (equivalente a executar a cada 15 minutos)
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar se é uma chamada autorizada (CRON secret ou header)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Executar função de limpeza
    const { data, error } = await supabase.rpc('cleanup_expired_reservations');

    if (error) {
      console.error('Error cleaning up expired reservations:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cleaned: data || 0,
      message: `Cleaned up ${data || 0} expired reservation(s)`,
    });
  } catch (error: any) {
    console.error('Error in cleanup-reservations cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Permitir apenas GET (CRON jobs geralmente usam GET)
export async function POST(req: NextRequest) {
  return GET(req);
}
