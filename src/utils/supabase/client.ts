import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // O Next.js vai procurar estas chaves no ficheiro .env automaticamente
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Verificação de segurança para o programador
  if (!url || !key) {
    console.error("⚠️ Erro: Variáveis de ambiente não encontradas no ficheiro .env")
  }

  return createBrowserClient(
    url!,
    key!
  )
}