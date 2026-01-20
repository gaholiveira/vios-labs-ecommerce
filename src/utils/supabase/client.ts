import { createBrowserClient } from '@supabase/ssr'

/**
 * Cria um cliente Supabase para uso em Client Components
 * O createBrowserClient do @supabase/ssr gerencia cookies automaticamente
 * para suportar PKCE em SSR (necessário para password reset e outros fluxos)
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    )
  }

  // createBrowserClient gerencia cookies automaticamente para PKCE
  return createBrowserClient(url, key)
}
