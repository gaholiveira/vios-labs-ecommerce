import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/utils/rate-limit";
import { getSupabaseAdmin } from "@/utils/supabase/admin";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB
const BUCKET = "review-images";

function randomHex(len = 8) {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

/**
 * POST /api/reviews/upload
 * FormData: image (File), product_id (string)
 * Returns: { url: string }
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(`upload:${getClientIp(req)}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um momento." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const productId = formData.get("product_id");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Imagem inválida." }, { status: 400 });
    }
    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { error: "product_id inválido." },
        { status: 400 },
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Use JPG, PNG ou WEBP." },
        { status: 400 },
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Imagem muito grande. Máximo 3 MB." },
        { status: 400 },
      );
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const timestamp = Date.now();
    const path = `${productId}/${timestamp}-${randomHex()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = getSupabaseAdmin();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: "public, max-age=31536000, immutable",
      });

    if (uploadError) {
      console.error("[REVIEW UPLOAD] Storage error:", uploadError);
      return NextResponse.json(
        { error: "Erro ao fazer upload da imagem." },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (err: unknown) {
    console.error("[REVIEW UPLOAD] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
