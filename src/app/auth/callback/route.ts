import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const searchParams = requestUrl.searchParams
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' para password reset, 'signup' para registro
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error') // Erros do Supabase
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')
  const origin = requestUrl.origin

  // Debug logging apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    // Logs de debug removidos para produção
  }

  // Criar cliente Supabase com cookies da requisição para Route Handler
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Se há erros do Supabase (link expirado, inválido, etc.)
  if (error || errorCode) {
    const isRecovery = type === 'recovery' || next === '/reset-password'
    
    // Mensagem amigável baseada no erro
    let errorMessage = 'Erro ao processar o link de redefinição de senha.'
    if (errorCode === 'otp_expired') {
      errorMessage = 'Link de redefinição de senha expirado ou inválido. Por favor, solicite um novo link.'
    } else if (error === 'access_denied') {
      errorMessage = 'Acesso negado. O link pode ter expirado ou já foi usado.'
    } else if (errorDescription) {
      errorMessage = decodeURIComponent(errorDescription).replace(/\+/g, ' ')
    }

    // Se for password reset, redirecionar para forgot-password
    if (isRecovery) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Erro no callback de recovery:', { error, errorCode, errorDescription })
      }
      return NextResponse.redirect(
        `${origin}/forgot-password?error=${encodeURIComponent(errorMessage)}`
      )
    }

    // Outros erros: redirecionar para login
    return NextResponse.redirect(
      `${origin}/login?error=auth-error&message=${encodeURIComponent(errorMessage)}`
    )
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // PRIORIDADE 1: Se for password reset (type=recovery), SEMPRE redirecionar para update-password
      if (type === 'recovery') {
            // Sessão de recovery criada. Redirecionando para /update-password
        return NextResponse.redirect(`${origin}/update-password`, { headers: response.headers })
      }
      
      // PRIORIDADE 2: Se next=/update-password ou /reset-password, também redirecionar
      if (next === '/update-password' || next === '/reset-password') {
            // Next=/update-password detectado. Redirecionando para /update-password
        return NextResponse.redirect(`${origin}/update-password`, { headers: response.headers })
      }
      
      // Sucesso: redirecionar para a página desejada
            // Sessão criada. Redirecionando
      return NextResponse.redirect(`${origin}${next}`, { headers: response.headers })
    }
    
    // Erro: redirecionar para login com mensagem de erro
    console.error('❌ Erro ao trocar código por sessão:', error)
    const errorMessage = error?.message || 'Erro ao autenticar'
    
    // Se for password reset e houver erro, redirecionar para forgot-password
    if (type === 'recovery' || next === '/update-password' || next === '/reset-password') {
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
