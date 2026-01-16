import { createClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' para password reset, 'signup' para registro
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Se for password reset, redirecionar para página de redefinição
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      
      // Sucesso: redirecionar para a página desejada
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    // Erro: redirecionar para login com mensagem de erro
    console.error('Erro ao trocar código por sessão:', error)
    const errorMessage = error?.message || 'Erro ao autenticar'
    
    // Se for password reset e houver erro, redirecionar para forgot-password
    if (type === 'recovery') {
      return NextResponse.redirect(
        `${origin}/forgot-password?error=${encodeURIComponent(errorMessage)}`
      )
    }
    
    return NextResponse.redirect(
      `${origin}/login?error=auth-code-error&message=${encodeURIComponent(errorMessage)}`
    )
  }

  // Sem código: redirecionar para login
  return NextResponse.redirect(`${origin}/login?error=no-code`)
}
