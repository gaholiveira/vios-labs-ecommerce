import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase configuration.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /api/reviews/summary
 * Retorna agregado (rating médio e quantidade) por produto, apenas reviews aprovadas.
 * Usado nos cards da home.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("reviews")
      .select("product_id, rating")
      .eq("status", "approved");

    if (error) {
      console.error("[REVIEWS SUMMARY] Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews summary" },
        { status: 500 }
      );
    }

    const byProduct = new Map<
      string,
      { sum: number; count: number }
    >();

    for (const row of data ?? []) {
      const existing = byProduct.get(row.product_id);
      if (existing) {
        existing.sum += row.rating;
        existing.count += 1;
      } else {
        byProduct.set(row.product_id, { sum: row.rating, count: 1 });
      }
    }

    const summary = Array.from(byProduct.entries()).map(
      ([product_id, { sum, count }]) => ({
        product_id,
        rating: Math.round((sum / count) * 10) / 10,
        reviews: count,
      })
    );

    return NextResponse.json(summary);
  } catch (e) {
    console.error("[REVIEWS SUMMARY] Error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
