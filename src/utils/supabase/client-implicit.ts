import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com flowType: 'implicit' para reset de senha.
 *
 * O implicit flow retorna tokens no hash da URL — não exige code_verifier.
 * Resolve o problema de "link expirado" quando o link abre em nova aba ou
 * em contexto diferente (ex.: WebView do cliente de email).
 *
 * Usar APENAS para resetPasswordForEmail. O resto do app usa @/utils/supabase/client (PKCE).
 */
export function createImplicitClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Please check your .env.local file."
    );
  }

  return createClient(url, key, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
}
