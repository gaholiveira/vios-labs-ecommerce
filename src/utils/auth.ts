/**
 * Utilitários de autenticação centralizados
 * Funções reutilizáveis para gerenciar autenticação em toda a aplicação
 */

import { createClient } from '@/utils/supabase/client';

/**
 * Verifica se um erro de autenticação indica email não confirmado
 */
export function isEmailNotConfirmedError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.status?.toString() || '';
  
  // Códigos e mensagens que indicam email não confirmado
  return (
    errorMessage.includes('email not confirmed') ||
    errorMessage.includes('email_not_confirmed') ||
    errorMessage.includes('confirmation') ||
    errorCode === '401' ||
    error.status === 401
  );
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
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao reenviar email' };
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

/**
 * Verifica se o usuário está autenticado
 */
export async function checkAuth(): Promise<{ user: any | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    return { user, error: error?.message || null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Erro ao verificar autenticação' };
  }
}
