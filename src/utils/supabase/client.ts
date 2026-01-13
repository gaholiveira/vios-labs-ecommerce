import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // O Next.js vai procurar estas chaves no ficheiro .env automaticamente
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Verificação de segurança
  if (!url || !key) {
    // Durante o build estático (SSR), retorna um cliente com valores placeholder
    // Isso evita erros durante o build, mas o cliente não funcionará até as variáveis estarem configuradas
    if (typeof window === 'undefined') {
      return createBrowserClient(
        url || 'https://placeholder.supabase.co',
        key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'
      )
    }
    // No cliente, lança erro se as variáveis não estiverem configuradas
    throw new Error("⚠️ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não encontradas")
  }

  return createBrowserClient(url, key)
}