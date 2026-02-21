"use server";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { PRODUCTS } from "@/constants/products";

// ============================================================================
// VALIDAÇÃO
// ============================================================================

const VALID_PRODUCT_IDS = new Set(PRODUCTS.map((p) => p.id));

const submitReviewSchema = z.object({
  product_id: z
    .string()
    .min(1, "Produto é obrigatório")
    .refine((id) => VALID_PRODUCT_IDS.has(id), "Produto inválido"),
  rating: z
    .number()
    .int()
    .min(1, "Avaliação mínima: 1 estrela")
    .max(5, "Avaliação máxima: 5 estrelas"),
  text: z
    .string()
    .min(10, "O texto deve ter pelo menos 10 caracteres")
    .max(1000, "O texto deve ter no máximo 1000 caracteres")
    .transform((s) => s.trim()),
  author_name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .transform((s) => s.trim()),
  author_email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido")
    .transform((s) => s.trim().toLowerCase()),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

export type SubmitReviewResult =
  | { success: true; message: string }
  | { success: false; error: string };

// ============================================================================
// SUPABASE
// ============================================================================

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase configuration.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================================================
// SERVER ACTION
// ============================================================================

/**
 * Envia uma avaliação de produto. Entra como 'pending' e só aparece após aprovação.
 */
export async function submitReview(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  try {
    const parsed = submitReviewSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg =
        first.rating?.[0] ??
        first.text?.[0] ??
        first.author_name?.[0] ??
        first.author_email?.[0] ??
        first.product_id?.[0] ??
        "Dados inválidos";
      return { success: false, error: msg };
    }

    const { product_id, rating, text, author_name, author_email } = parsed.data;

    const supabase = getSupabaseAdmin();

    // Anti-spam: 1 review por email+produto a cada 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", product_id)
      .eq("author_email", author_email)
      .gte("created_at", oneDayAgo)
      .limit(1);

    if (recent && recent.length > 0) {
      return {
        success: false,
        error: "Você já enviou uma avaliação para este produto nas últimas 24 horas.",
      };
    }

    const { error } = await supabase.from("reviews").insert({
      product_id,
      rating,
      text,
      author_name,
      author_email,
      status: "pending",
    });

    if (error) {
      console.error("[REVIEW ACTION] Insert error:", error);
      return {
        success: false,
        error: "Não foi possível enviar sua avaliação. Tente novamente.",
      };
    }

    return {
      success: true,
      message:
        "Obrigado! Sua avaliação foi enviada e será publicada após moderação.",
    };
  } catch (e) {
    console.error("[REVIEW ACTION] Error:", e);
    return {
      success: false,
      error: "Ocorreu um erro. Tente novamente mais tarde.",
    };
  }
}
