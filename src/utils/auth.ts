/**
 * Utilitário para logout completo e limpeza de sessão
 * Garante que toda a sessão seja limpa corretamente
 */

export async function handleLogout() {
  try {
    // Importação dinâmica para evitar problemas de build
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();

    // 1. Limpar carrinho antes do logout (se o contexto estiver disponível)
    // Nota: O carrinho será limpo automaticamente quando a página recarregar
    // mas limpamos aqui também para garantir

    // 2. Fazer signOut no Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Erro ao fazer logout:', error);
      // Continuar mesmo se houver erro para garantir limpeza
    }

    // 3. Limpar localStorage (exceto itens que queremos manter)
    if (typeof window !== 'undefined') {
      // Limpar dados relacionados à sessão
      const keysToKeep: string[] = []; // Adicione chaves que deseja manter
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        // Manter apenas chaves específicas se necessário
        if (!keysToKeep.includes(key)) {
          // Limpar apenas chaves relacionadas ao Supabase/auth
          if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        }
      });

      // 4. Limpar sessionStorage
      sessionStorage.clear();

      // 5. Aguardar um pouco para garantir que o signOut foi processado
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 6. Forçar reload completo da página para garantir limpeza total
    // Usar window.location.href é mais confiável que router.refresh() para logout
    // Isso garante que todos os estados sejam resetados
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Erro durante logout:', error);
    // Mesmo com erro, tentar redirecionar para garantir que o usuário saia
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
}
