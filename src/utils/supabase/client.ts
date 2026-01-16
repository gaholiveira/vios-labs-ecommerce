import { createBrowserClient } from '@supabase/ssr'

/**
 * Cria um cliente Supabase para uso em Client Components
 * Este cliente gerencia cookies automaticamente no navegador
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    )
  }

  return createBrowserClient(url, key)
}
