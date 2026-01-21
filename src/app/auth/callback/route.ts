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
): Promise<{ success: boolean; error?: any; user?: any }> {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return { success: false, error };
  }

  if (!data?.session) {
    return { success: false, error: { message: 'Sessão não criada' } };
  }

  return { success: true, user: data.user };
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
    return `${origin}/update-password`;
  }

  // Confirmação de email ou login normal
  return `${origin}${next}`;
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
  const origin = requestUrl.origin;

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
    const result = await exchangeCodeForSession(supabase, params.code, params.type);

    // Sucesso: sessão criada
    if (result.success) {
      const redirectUrl = getRedirectUrl(params.type, params.next, origin);
      return NextResponse.redirect(redirectUrl, { headers: response.headers });
    }

    // Erro: processar tipo de erro
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Erro ao trocar código por sessão:', result.error);
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
  return NextResponse.redirect(
    `${origin}/login?error=no-code&message=${encodeURIComponent('Link inválido. Verifique o link recebido por email.')}`
  );
}
