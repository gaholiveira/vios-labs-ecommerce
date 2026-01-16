import { createClient } from '@/utils/supabase/server'
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

  // Log para debug (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Callback recebido:', { 
      code: code ? 'presente' : 'ausente', 
      type, 
      next,
      error,
      errorCode,
      fullUrl: requestUrl.toString()
    })
  }

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
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // PRIORIDADE 1: Se for password reset (type=recovery), SEMPRE redirecionar para reset-password
      if (type === 'recovery') {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Sessão de recovery criada. Redirecionando para /reset-password')
        }
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      
      // PRIORIDADE 2: Se next=/reset-password, também redirecionar
      if (next === '/reset-password') {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Next=/reset-password detectado. Redirecionando para /reset-password')
        }
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      
      // Sucesso: redirecionar para a página desejada
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Sessão criada. Redirecionando para:', next)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    // Erro: redirecionar para login com mensagem de erro
    console.error('❌ Erro ao trocar código por sessão:', error)
    const errorMessage = error?.message || 'Erro ao autenticar'
    
    // Se for password reset e houver erro, redirecionar para forgot-password
    if (type === 'recovery' || next === '/reset-password') {
      return NextResponse.redirect(
        `${origin}/forgot-password?error=${encodeURIComponent(errorMessage)}`
      )
    }
    
    return NextResponse.redirect(
      `${origin}/login?error=auth-code-error&message=${encodeURIComponent(errorMessage)}`
    )
  }

  // Sem código: redirecionar para login
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Callback sem código. Redirecionando para login.')
  }
  return NextResponse.redirect(`${origin}/login?error=no-code`)
}
