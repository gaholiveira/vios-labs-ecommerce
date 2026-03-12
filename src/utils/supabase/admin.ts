import { createClient } from "@supabase/supabase-js";

/**
 * Cria um cliente Supabase com service role key.
 * Para uso exclusivo em API Routes e Server Actions (nunca no browser).
 * Lança erro se as variáveis de ambiente estiverem ausentes.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase configuration.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Variante que retorna null quando as variáveis não estiverem configuradas.
 * Usada em contextos onde a ausência de configuração é tolerável (ex.: lib/bling.ts).
 */
export function getSupabaseAdminOrNull() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
