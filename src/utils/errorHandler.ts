/**
 * Formata erros do Supabase para exibição ao usuário
 */
export interface SupabaseError {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}

export function formatDatabaseError(error: unknown): string {
  if (!error) {
    return 'Erro desconhecido. Tente novamente.';
  }

  // Se já é uma string, retornar (mas verificar se é genérica)
  if (typeof error === 'string') {
    if (error.includes('Database error')) {
      return 'Erro no banco de dados. Verifique o console para mais detalhes.';
    }
    return error;
  }

  // Se é um Error object
  if (error instanceof Error) {
    if (error.message.includes('Database error')) {
      return `Erro no banco de dados: ${error.message}. Verifique o console para mais detalhes.`;
    }
    return error.message;
  }

  // Se é um objeto com propriedades conhecidas
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as SupabaseError & { status?: number };
    
    // Se tem message, usar ela
    if (errorObj.message) {
      const messageLower = errorObj.message.toLowerCase();
      
      // Rate limit - prioridade alta
      if (
        messageLower.includes('rate limit') ||
        messageLower.includes('rate_limit') ||
        messageLower.includes('too many requests') ||
        messageLower.includes('email rate limit exceeded')
      ) {
        return 'Muitas solicitações foram feitas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente. Isso ajuda a proteger nosso sistema contra abusos.';
      }
      
      // Mensagens comuns do Supabase com traduções amigáveis
      if (errorObj.message.includes('already registered') || errorObj.message.includes('already exists')) {
        return 'Este e-mail já está cadastrado. Tente fazer login.';
      }
      
      if (errorObj.message.includes('password')) {
        return 'A senha não atende aos requisitos de segurança.';
      }
      
      if (errorObj.message.includes('email')) {
        return 'E-mail inválido. Verifique e tente novamente.';
      }

      if (errorObj.message.includes('duplicate key')) {
        return 'Este registro já existe no banco de dados.';
      }

      if (errorObj.message.includes('foreign key')) {
        return 'Erro de referência: registro relacionado não encontrado.';
      }

      if (errorObj.message.includes('permission denied') || errorObj.message.includes('row-level security')) {
        return 'Permissão negada. Verifique as políticas de segurança do banco de dados.';
      }

      // Retornar a mensagem original se não for um erro conhecido
      return errorObj.message;
    }
    
    // Verificar também no código e status
    if (errorObj.code === 'rate_limit_exceeded' || errorObj.status === 429) {
      return 'Muitas solicitações foram feitas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente. Isso ajuda a proteger nosso sistema contra abusos.';
    }

    // Se tem details, usar details + hint
    const details = errorObj.details || '';
    const hint = errorObj.hint || '';
    const code = errorObj.code || '';

    if (details || hint) {
      return `${details || 'Erro no banco de dados'}${hint ? ` (${hint})` : ''}${code ? ` [Código: ${code}]` : ''}`;
    }
  }

  // Fallback: converter objeto para string para debug
  return `Erro: ${JSON.stringify(error)}`;
}

/**
 * Loga erro detalhado no console para debug
 */
export function logDatabaseError(context: string, error: unknown) {
  console.group(`❌ Erro de Banco de Dados: ${context}`);
  
  // Se o erro é uma string, mostrar diretamente
  if (typeof error === 'string') {
    console.error('Tipo: String');
    console.error('Mensagem:', error);
    console.error('⚠️ Erro recebido como string - pode ser uma mensagem genérica');
  } 
  // Se é um objeto com propriedades conhecidas
  else if (error && typeof error === 'object') {
    const errorObj = error as SupabaseError & { status?: number };
    console.error('Tipo: Objeto');
    console.error('Mensagem:', errorObj.message || '(sem mensagem)');
    console.error('Detalhes:', errorObj.details || '(sem detalhes)');
    console.error('Hint:', errorObj.hint || '(sem hint)');
    console.error('Código:', errorObj.code || '(sem código)');
    console.error('Status:', errorObj.status || '(sem status)');
    console.error('Erro completo:', error);
    
    // Se é um erro do Supabase, mostrar informações adicionais
    if (errorObj.message && errorObj.message.includes('Database error')) {
      console.warn('⚠️ Este parece ser um erro genérico. Verifique:');
      console.warn('  1. Se as tabelas foram criadas corretamente no Supabase');
      console.warn('  2. Se as políticas RLS estão configuradas');
      console.warn('  3. Se as variáveis de ambiente estão corretas');
      console.warn('  4. Verifique os logs do Supabase no dashboard');
    }
  }
  // Se é um Error object
  else if (error instanceof Error) {
    console.error('Tipo: Error');
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('Nome:', error.name);
  }
  // Outros tipos
  else {
    console.error('Tipo:', typeof error);
    console.error('Valor:', error);
    console.error('Stringify:', JSON.stringify(error, null, 2));
  }
  
  console.groupEnd();
}
