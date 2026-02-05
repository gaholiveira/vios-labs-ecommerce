import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API Route para reenviar email de confirmação
 * POST /api/auth/resend-confirmation
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Reenviar email de confirmação
    // Estratégia: Tentar usar resend se disponível, senão usar signUp com senha temporária
    const origin = request.headers.get('origin') || new URL(request.url).origin;
    
    // Tentar método resend primeiro (se disponível na versão do Supabase)
    try {
      // @ts-ignore - resend pode não estar disponível em todas as versões
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (!resendError) {
        return NextResponse.json({
          success: true,
          message: 'Email de confirmação reenviado. Verifique sua caixa de entrada e spam.',
        });
      }

      // Se resend não funcionar, continuar com fallback
    } catch {
      // Método resend não disponível, usar fallback
    }

    // Fallback: Usar signUp com senha temporária
    // Isso enviará email de confirmação se o usuário existir e não estiver confirmado
    // Se o usuário já estiver confirmado, retornará erro mas não criará conta duplicada
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Senha temporária única
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          resend_confirmation: true,
        },
      },
    });

    if (error) {
      // Tratamento específico para rate limit
      const isRateLimit = 
        error.message?.toLowerCase().includes('rate limit') ||
        error.message?.toLowerCase().includes('rate_limit') ||
        error.message?.toLowerCase().includes('too many requests') ||
        error.message?.toLowerCase().includes('email rate limit exceeded') ||
        error.code === 'rate_limit_exceeded' ||
        error.status === 429;
      
      if (isRateLimit) {
        return NextResponse.json(
          { 
            error: 'Muitas solicitações foram feitas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente. Isso ajuda a proteger nosso sistema contra abusos.',
            rateLimit: true,
          },
          { status: 429 }
        );
      }
      
      // Se o erro for que o usuário já está confirmado ou registrado
      if (
        error.message?.includes('already confirmed') ||
        error.message?.includes('already registered') ||
        error.message?.includes('User already registered') ||
        error.message?.includes('already exists')
      ) {
        // Retornar sucesso genérico para segurança (não expor se email está confirmado)
        return NextResponse.json({
          success: true,
          message: 'Se o email estiver cadastrado e não confirmado, você receberá um email em breve. Verifique sua caixa de entrada e spam.',
        });
      }

      // Outros erros
      return NextResponse.json(
        { error: error.message || 'Erro ao reenviar email' },
        { status: 400 }
      );
    }

    // Sucesso - email enviado
    return NextResponse.json({
      success: true,
      message: 'Email de confirmação enviado. Verifique sua caixa de entrada e spam.',
    });
  } catch (err: any) {
    console.error('Erro ao reenviar confirmação:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
