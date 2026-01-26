/**
 * Utilitários de autenticação centralizados
 * Funções reutilizáveis para gerenciar autenticação em toda a aplicação
 */

import { createClient } from '@/utils/supabase/client';

/**
 * Verifica se um erro de autenticação indica email não confirmado
 */
export function isEmailNotConfirmedError(error: unknown): boolean {
  if (!error) return false;
  
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as { message?: string; status?: number };
    const errorMessage = errorObj.message?.toLowerCase() || '';
    const errorCode = errorObj.status?.toString() || '';
    
    // Códigos e mensagens que indicam email não confirmado
    return (
      errorMessage.includes('email not confirmed') ||
      errorMessage.includes('email_not_confirmed') ||
      errorMessage.includes('confirmation') ||
      errorCode === '401' ||
      errorObj.status === 401
    );
  }
  
  return false;
}

/**
 * Reenvia email de confirmação usando API route
 */
export async function resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/auth/resend-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Erro ao reenviar email' };
    }

    return { success: true, message: data.message };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao reenviar email';
    return { success: false, error: errorMessage };
  }
}

/**
 * Faz logout do usuário
 */
export async function handleLogout(): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Erro ao fazer logout:', error);
    }
    
    // Sempre redirecionar, mesmo se houver erro
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  } catch (err) {
    console.error('Exceção ao fazer logout:', err);
    // Mesmo com erro, tentar redirecionar
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
}

import type { User } from '@supabase/supabase-js';

/**
 * Verifica se o usuário está autenticado
 */
export async function checkAuth(): Promise<{ user: User | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    return { user, error: error?.message || null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar autenticação';
    return { user: null, error: errorMessage };
  }
}
