import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

/**
 * API Route para limpeza automática de reservas expiradas.
 * Deve ser chamada via CRON job (Vercel Cron ou similar).
 * Recomendado: Executar a cada 15 minutos.
 *
 * vercel.json: { "crons": [{ "path": "/api/cron/cleanup-reservations", "schedule": "0,15,30,45 * * * *" }] }
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('cleanup_expired_reservations');

    if (error) {
      console.error('Error cleaning up expired reservations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      cleaned: data || 0,
      message: `Cleaned up ${data || 0} expired reservation(s)`,
    });
  } catch (err: unknown) {
    console.error('Error in cleanup-reservations cron:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
