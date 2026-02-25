-- ============================================
-- REVERTER GRANTS EXECUTADOS POR ENGANO
-- ============================================
-- Execute no SQL Editor do Supabase (projeto VIOS Labs)
-- Este script revoga as permissões amplas e restaura o padrão seguro
-- ============================================

-- 1. REVOGAR permissões amplas de anon em TODAS as tabelas
--    (anon com INSERT/UPDATE/DELETE em tudo é inseguro)
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;

-- 2. REVOGAR permissões amplas de authenticated (opcional; RLS já restringe)
--    Se o app quebrar após isso, rode a seção "GRANTS MÍNIMOS" abaixo
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM authenticated;

-- 3. REMOVER default privileges que aplicariam grants em tabelas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM authenticated;

-- 4. Manter USAGE no schema (necessário para acessar o schema)
--    (não alterar; já estava correto)
-- GRANT USAGE ON SCHEMA public TO anon;
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT USAGE ON SCHEMA public TO service_role;

-- ============================================
-- 5. GRANTS MÍNIMOS PARA VIOS LABS
-- ============================================
-- O RLS continua controlando quais linhas cada role vê.
-- Apenas as operações necessárias são concedidas.

-- anon: catálogo público, guest checkout, waitlist
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT ON public.vip_list TO anon;
GRANT SELECT ON public.app_config TO anon;

-- authenticated: perfis, pedidos, vip
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vip_list TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.app_config TO authenticated;

-- Tabelas que só service_role acessa (bling_tokens, inventory, etc.):
-- não conceder nada a anon/authenticated; RLS já bloqueia.
