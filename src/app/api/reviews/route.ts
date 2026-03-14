import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/utils/rate-limit";
import { getSupabaseAdmin } from "@/utils/supabase/admin";

/**
 * GET /api/reviews?product_id=prod_1
 * Retorna apenas reviews aprovadas, ordenadas por data (mais recentes primeiro)
 */
export async function GET(req: NextRequest) {
  const rl = rateLimit(getClientIp(req), { limit: 60, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "60",
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product_id");

    if (!productId) {
      return NextResponse.json(
        { error: "product_id is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("reviews")
      .select("id, product_id, rating, text, author_name, image_url, created_at")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[REVIEWS API] Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], {
      headers: {
        // Cache de 2 min na CDN; serve dado stale por até 10 min enquanto revalida em background.
        // Reviews mudam apenas quando uma nova avaliação é aprovada manualmente.
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    console.error("[REVIEWS API] Error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
