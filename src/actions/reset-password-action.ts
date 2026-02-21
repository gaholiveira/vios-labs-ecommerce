"use server";

import { createClient } from "@supabase/supabase-js";
import { sendPasswordResetEmail } from "@/lib/email";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hora
const MAX_REQUESTS_PER_EMAIL = 2;

// Rate limit em memória (em produção, use Redis ou similar)
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase().trim();
  let timestamps = rateLimitMap.get(key) ?? [];

  timestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_EMAIL) {
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return false;
}

function generateSecurePassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
  const length = 12;
  let password = "";
  const randomBytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < length; i++) {
      password += chars[randomBytes[i]! % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return password;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase configuration.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Gera senha temporária, atualiza no Supabase e envia por email.
 * Sempre retorna sucesso para evitar enumeração de emails.
 */
export async function requestPasswordReset(
  email: string
): Promise<ResetPasswordResult> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return { success: false, error: "E-mail inválido." };
  }

  if (isRateLimited(trimmedEmail)) {
    return {
      success: false,
      error:
        "O limite de solicitações foi atingido. Aguarde 1 hora para tentar novamente.",
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });

    if (error) {
      console.error("[RESET PASSWORD] listUsers error:", error.message);
      return {
        success: true, // Não revelar se o email existe
      };
    }

    const user = data.users.find(
      (u) => u.email?.toLowerCase() === trimmedEmail
    );

    if (!user) {
      // Sempre retornar sucesso para evitar enumeração
      return { success: true };
    }

    const tempPassword = generateSecurePassword();

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: tempPassword }
    );

    if (updateError) {
      console.error("[RESET PASSWORD] updateUserById error:", updateError.message);
      return {
        success: false,
        error: "Não foi possível processar. Tente novamente.",
      };
    }

    const emailResult = await sendPasswordResetEmail({
      to: trimmedEmail,
      tempPassword,
    });

    if (!emailResult.success) {
      console.error("[RESET PASSWORD] Email error:", emailResult.error);
      return {
        success: false,
        error:
          emailResult.error ??
          "Não foi possível enviar o e-mail. Verifique a configuração.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("[RESET PASSWORD] Exception:", err);
    return {
      success: false,
      error: "Erro inesperado. Tente novamente.",
    };
  }
}
