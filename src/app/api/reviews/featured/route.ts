import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/utils/rate-limit";
import { getSupabaseAdmin } from "@/utils/supabase/admin";

/**
 * GET /api/reviews/featured
 * Retorna as últimas reviews aprovadas de todos os produtos (para seção "Veja o que estão falando")
 */
export async function GET(req: NextRequest) {
  const rl = rateLimit(getClientIp(req), { limit: 30, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("reviews")
      .select("id, product_id, rating, text, author_name, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("[REVIEWS FEATURED] Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("[REVIEWS FEATURED] Error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
