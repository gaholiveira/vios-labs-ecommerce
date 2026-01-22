import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Callback Route Handler para autenticação Supabase
 * 
 * Este route handler processa callbacks de:
 * - Confirmação de email (signup)
 * - Redefinição de senha (recovery)
 * - OAuth providers (futuro)
 * 
 * Fluxo completo:
 * 1. Recebe código de autenticação via query params
 * 2. Troca código por sessão usando PKCE
 * 3. Redireciona para página apropriada baseado no tipo
 */

interface CallbackParams {
  code: string | null;
  type: string | null; // 'recovery' | 'signup' | null
  next: string;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}

/**
 * Cria cliente Supabase com configuração adequada para PKCE
 */
function createSupabaseClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, {
              ...options,
              sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') || 'lax',
              path: options?.path || '/',
              httpOnly: false, // Necessário para PKCE funcionar no cliente
              secure: process.env.NODE_ENV === 'production', // HTTPS em produção
              maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 dias padrão
            });
          });
        },
      },
    }
  );
}

/**
 * Processa erros do Supabase e retorna mensagens amigáveis
 */
function processAuthError(
  error: string | null,
  errorCode: string | null,
  errorDescription: string | null,
  type: string | null
): { message: string; isEmailConfirmed: boolean; isRecovery: boolean } {
  const isRecovery = type === 'recovery';
  let message = 'Erro ao processar autenticação.';
  let isEmailConfirmed = false;

  // Erro de código expirado
  if (errorCode === 'otp_expired') {
    if (isRecovery) {
      message = 'Link de redefinição de senha expirado. Solicite um novo link.';
    } else {
      message = 'Link de confirmação expirado. Se seu email já foi confirmado, faça login normalmente.';
      isEmailConfirmed = true;
    }
    return { message, isEmailConfirmed, isRecovery };
  }

  // Acesso negado (geralmente link já usado)
  if (error === 'access_denied') {
    if (isRecovery) {
      message = 'Link já utilizado ou inválido. Solicite um novo link de redefinição.';
    } else {
      message = 'Este link já foi utilizado. Seu email já está confirmado! Faça login para continuar.';
      isEmailConfirmed = true;
    }
    return { message, isEmailConfirmed, isRecovery };
  }

  // Erro genérico com descrição
  if (errorDescription) {
    message = decodeURIComponent(errorDescription).replace(/\+/g, ' ');
    if (!isRecovery && (errorDescription.includes('already') || errorDescription.includes('used'))) {
      isEmailConfirmed = true;
    }
    return { message, isEmailConfirmed, isRecovery };
  }

  // Erro genérico
  if (error) {
    message = 'Erro ao processar o link. Tente novamente ou solicite um novo link.';
    return { message, isEmailConfirmed, isRecovery };
  }

  return { message, isEmailConfirmed, isRecovery };
}

/**
 * Processa código de autenticação e troca por sessão
 */
async function exchangeCodeForSession(
  supabase: ReturnType<typeof createSupabaseClient>,
  code: string,
  type: string | null
): Promise<{ success: boolean; error?: any; user?: any; session?: any }> {
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Erro ao trocar código por sessão:', {
          error: error.message,
          code: error.code,
          type,
        });
      }
      return { success: false, error };
    }

    if (!data?.session) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Sessão não criada após exchangeCodeForSession');
      }
      return { success: false, error: { message: 'Sessão não criada' } };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Sessão criada com sucesso:', {
        userId: data.user?.id,
        type,
        hasSession: !!data.session,
      });
    }

    return { success: true, user: data.user, session: data.session };
  } catch (err: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Exceção ao trocar código por sessão:', err);
    }
    return { success: false, error: err };
  }
}

/**
 * Determina para onde redirecionar após autenticação bem-sucedida
 */
function getRedirectUrl(
  type: string | null,
  next: string,
  origin: string
): string {
  // Password reset sempre vai para update-password
  if (type === 'recovery' || next === '/update-password' || next === '/reset-password') {
    // Decodificar next se estiver codificado
    const decodedNext = next ? decodeURIComponent(next) : next;
    const isUpdatePassword = decodedNext === '/update-password' || decodedNext === 'update-password';
    
    // Sempre usar /update-password para recovery
    const url = `${origin}/update-password`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 URL de redirecionamento (recovery):', url, {
        type,
        next,
        decodedNext,
        isUpdatePassword,
        origin,
      });
    }
    return url;
  }

  // Confirmação de email ou login normal
  // Garantir que next seja uma rota válida
  const validNext = next && next.startsWith('/') ? next : '/';
  const url = `${origin}${validNext}`;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔗 URL de redirecionamento:', url, { type, next: validNext, origin });
  }
  
  return url;
}

/**
 * Processa erros de PKCE ou link já usado
 */
async function handlePKCEError(
  error: any,
  type: string | null,
  next: string,
  origin: string,
  supabase: ReturnType<typeof createSupabaseClient>
): Promise<NextResponse> {
  const isLinkUsedOrExpired =
    error?.message?.includes('PKCE') ||
    error?.message?.includes('code verifier') ||
    error?.message?.includes('already been used') ||
    error?.message?.includes('expired') ||
    error?.message?.includes('invalid');

  if (!isLinkUsedOrExpired) {
    return NextResponse.redirect(
      `${origin}/login?error=auth-code-error&message=${encodeURIComponent(error?.message || 'Erro ao autenticar')}`
    );
  }

  // Confirmação de email (signup ou sem type)
  if (type === 'signup' || !type) {
    // Verificar se usuário já tem sessão ativa
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Usuário já logado - redirecionar para home
      return NextResponse.redirect(`${origin}/?email-confirmed=true`);
    }

    // Email já confirmado mas sem sessão - redirecionar para login
    const message = 'Este link já foi utilizado. Seu email já está confirmado! Faça login com suas credenciais para continuar.';
    return NextResponse.redirect(
      `${origin}/login?email-confirmed=true&message=${encodeURIComponent(message)}`
    );
  }

  // Password reset
  if (type === 'recovery' || next === '/update-password' || next === '/reset-password') {
    const message = 'Link expirado ou já utilizado. Solicite um novo link de redefinição de senha.';
    return NextResponse.redirect(
      `${origin}/forgot-password?error=${encodeURIComponent(message)}`
    );
  }

  // Outros casos - assumir confirmação de email
  const message = 'Este link já foi utilizado. Se seu email já foi confirmado, faça login normalmente.';
  return NextResponse.redirect(
    `${origin}/login?email-confirmed=true&message=${encodeURIComponent(message)}`
  );
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;
  
  // Normalizar origin - remover www se presente para consistência
  let origin = requestUrl.origin;
  if (origin.includes('www.')) {
    origin = origin.replace('www.', '');
  }
  
  // Em produção, garantir que usa HTTPS
  if (process.env.NODE_ENV === 'production' && origin.startsWith('http://')) {
    origin = origin.replace('http://', 'https://');
  }

  // Log completo da requisição para debug
  if (process.env.NODE_ENV === 'development') {
    console.log('📥 Callback recebido:', {
      url: requestUrl.toString(),
      origin: origin,
      originalOrigin: requestUrl.origin,
      code: searchParams.get('code') ? 'presente' : 'ausente',
      type: searchParams.get('type'),
      next: searchParams.get('next'),
      error: searchParams.get('error'),
      errorCode: searchParams.get('error_code'),
      allParams: Object.fromEntries(searchParams.entries()),
    });
  }

  // Extrair parâmetros da URL
  const params: CallbackParams = {
    code: searchParams.get('code'),
    type: searchParams.get('type'),
    next: searchParams.get('next') ?? '/',
    error: searchParams.get('error'),
    errorCode: searchParams.get('error_code'),
    errorDescription: searchParams.get('error_description'),
  };

  const response = NextResponse.next();
  const supabase = createSupabaseClient(request, response);

  // ==========================================
  // CENÁRIO 1: Erros explícitos do Supabase
  // ==========================================
  if (params.error || params.errorCode) {
    const { message, isEmailConfirmed, isRecovery } = processAuthError(
      params.error,
      params.errorCode,
      params.errorDescription,
      params.type
    );

    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Erro no callback:', {
        error: params.error,
        errorCode: params.errorCode,
        errorDescription: params.errorDescription,
        type: params.type,
      });
    }

    // Password reset sempre vai para forgot-password
    if (isRecovery) {
      return NextResponse.redirect(
        `${origin}/forgot-password?error=${encodeURIComponent(message)}`
      );
    }

    // Confirmação de email já confirmado
    if (isEmailConfirmed) {
      return NextResponse.redirect(
        `${origin}/login?email-confirmed=true&message=${encodeURIComponent(message)}`
      );
    }

    // Outros erros
    return NextResponse.redirect(
      `${origin}/login?error=auth-error&message=${encodeURIComponent(message)}`
    );
  }

  // ==========================================
  // CENÁRIO 2: Código de autenticação presente
  // ==========================================
  if (params.code) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Processando código de autenticação:', {
        type: params.type,
        next: params.next,
        hasCode: !!params.code,
      });
    }

    const result = await exchangeCodeForSession(supabase, params.code, params.type);

    // Log detalhado do resultado
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Resultado do exchangeCodeForSession:', {
        success: result.success,
        hasSession: !!result.session,
        hasUser: !!result.user,
        error: result.error?.message,
        errorCode: result.error?.code,
        type: params.type,
      });
    }

    // Sucesso: sessão criada
    if (result.success && result.session) {
      // Para recovery, verificar se a sessão está acessível
      if (params.type === 'recovery') {
        // Aguardar um momento para garantir que cookies foram salvos
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verificar se a sessão está acessível
        const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession();
        
        if (verifyError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('⚠️ Erro ao verificar sessão após criação:', verifyError);
          }
          const message = 'Erro ao processar link de redefinição. Tente solicitar um novo link.';
          return NextResponse.redirect(
            `${origin}/forgot-password?error=${encodeURIComponent(message)}`
          );
        }

        if (!verifySession) {
          if (process.env.NODE_ENV === 'development') {
            console.error('⚠️ Sessão não encontrada após criação (recovery)');
            console.log('📋 Dados da sessão criada:', {
              hasSession: !!result.session,
              userId: result.user?.id,
            });
          }
          // Mesmo sem sessão verificável, tentar redirecionar - o cliente pode ter a sessão
          // A página update-password fará a verificação final
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Sessão verificada com sucesso (recovery)');
          }
        }
      }

      const redirectUrl = getRedirectUrl(params.type, params.next, origin);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Redirecionando para:', redirectUrl, { 
          type: params.type,
          next: params.next,
          hasSession: !!result.session,
          origin,
          redirectUrl,
        });
      }
      
      // Garantir que os headers de cookies sejam enviados
      // Usar redirect absoluto para garantir que funciona
      try {
        const redirectResponse = NextResponse.redirect(redirectUrl, { 
          headers: response.headers,
        });
        
        // Garantir que cookies sejam preservados no redirect
        response.cookies.getAll().forEach(cookie => {
          redirectResponse.cookies.set(cookie.name, cookie.value, {
            ...cookie,
            sameSite: 'lax',
            path: '/',
            httpOnly: false,
          });
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Redirect response criado com sucesso');
        }
        
        return redirectResponse;
      } catch (redirectError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Erro ao criar redirect:', redirectError);
        }
        // Fallback: redirecionar para forgot-password com erro
        return NextResponse.redirect(
          `${origin}/forgot-password?error=${encodeURIComponent('Erro ao processar redirecionamento. Tente novamente.')}`
        );
      }
      
    }

    // Erro: processar tipo de erro
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Erro ao trocar código por sessão:', {
        error: result.error,
        message: result.error?.message,
        code: result.error?.code,
        status: result.error?.status,
        type: params.type,
      });
    }

    // Erro de PKCE ou link já usado
    return await handlePKCEError(
      result.error,
      params.type,
      params.next,
      origin,
      supabase
    );
  }

  // ==========================================
  // CENÁRIO 3: Sem código nem erro (URL inválida)
  // ==========================================
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Callback sem código nem erro - URL inválida:', requestUrl.toString());
  }
  
  // Se for recovery mas sem código, pode ser que o link já foi usado
  if (params.type === 'recovery') {
    return NextResponse.redirect(
      `${origin}/forgot-password?error=${encodeURIComponent('Link inválido ou já utilizado. Solicite um novo link de redefinição.')}`
    );
  }
  
  return NextResponse.redirect(
    `${origin}/login?error=no-code&message=${encodeURIComponent('Link inválido. Verifique o link recebido por email.')}`
  );
}
