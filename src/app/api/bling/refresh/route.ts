import { NextRequest, NextResponse } from "next/server";
import { refreshBlingToken } from "@/lib/bling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

/**
 * Renova o access_token do Bling usando o refresh_token (DB ou env).
 * Chamado pelo Vercel Cron a cada 4h para manter o token válido.
 * Opcional: proteja com Authorization: Bearer CRON_SECRET no Vercel.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret?.trim() && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await refreshBlingToken();
    if (token) {
      return NextResponse.json({ ok: true, message: "Token renovado" });
    }
    return NextResponse.json(
      { ok: false, error: "Falha ao renovar token (verifique BLING_REFRESH_TOKEN ou DB)" },
      { status: 502 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[BLING REFRESH] Exception:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
