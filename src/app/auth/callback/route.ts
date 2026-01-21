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
  // IMPORTANTE: O code verifier do PKCE deve estar nos cookies para funcionar
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
          // Garantir que os cookies sejam definidos tanto na request quanto na response
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            // Definir cookies na response com opções adequadas para PKCE
            response.cookies.set(name, value, {
              ...options,
              // Garantir SameSite=Lax para funcionar com links de email
              sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') || 'lax',
              // Path deve ser / para estar disponível em todas as rotas
              path: options?.path || '/',
              // HttpOnly deve ser false para que o cliente possa acessar (necessário para PKCE)
              httpOnly: false,
            })
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
    // Tentar trocar o código por sessão
    // Se o code verifier não estiver nos cookies, isso falhará
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.session) {
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
    
    // Erro: verificar se é erro de PKCE
    console.error('❌ Erro ao trocar código por sessão:', error)
    
    let errorMessage = error?.message || 'Erro ao autenticar'
    
    // Tratar especificamente o erro de PKCE code verifier
    if (error?.message?.includes('PKCE') || error?.message?.includes('code verifier')) {
      errorMessage = 'Link expirado ou inválido. Por favor, solicite um novo link de redefinição de senha ou confirmação de email.'
      
      // Se for password reset, redirecionar para forgot-password
      if (type === 'recovery' || next === '/update-password' || next === '/reset-password') {
        return NextResponse.redirect(
          `${origin}/forgot-password?error=${encodeURIComponent(errorMessage)}`
        )
      }
      
      // Se for signup, redirecionar para register
      if (type === 'signup') {
        return NextResponse.redirect(
          `${origin}/register?error=${encodeURIComponent(errorMessage)}`
        )
      }
      
      // Outros casos: redirecionar para login
      return NextResponse.redirect(
        `${origin}/login?error=pkce-error&message=${encodeURIComponent(errorMessage)}`
      )
    }
    
    // Outros erros: redirecionar para login com mensagem de erro
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
