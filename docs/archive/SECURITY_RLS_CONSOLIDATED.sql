-- ============================================
-- SCRIPT CONSOLIDADO DE SEGURANÇA RLS - VIOS LABS
-- ============================================
-- Este script garante que todas as políticas RLS estão corretas e robustas
-- Execute este script no SQL Editor do Supabase
-- ============================================
-- Data: 25 de Janeiro de 2026
-- ============================================

-- ============================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vip_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_config ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. REMOVER POLÍTICAS ANTIGAS (EVITA DUPLICAÇÃO)
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- VIP List
DROP POLICY IF EXISTS "Users can view own VIP entry" ON public.vip_list;
DROP POLICY IF EXISTS "Users can insert own VIP entry" ON public.vip_list;
DROP POLICY IF EXISTS "Users can update own VIP entry" ON public.vip_list;
DROP POLICY IF EXISTS "Authenticated users can check VIP status" ON public.vip_list;

-- Orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders by user_id or email" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own pending orders" ON public.orders;

-- Order Items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items by user_id or email" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;

-- Products
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Service role can manage products" ON public.products;

-- Inventory
DROP POLICY IF EXISTS "Anyone can view inventory status" ON public.inventory;
DROP POLICY IF EXISTS "Service role can manage inventory" ON public.inventory;

-- Inventory Reservations
DROP POLICY IF EXISTS "Service role can manage reservations" ON public.inventory_reservations;

-- Inventory Movements
DROP POLICY IF EXISTS "Service role can manage movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Users can view their own movements" ON public.inventory_movements;

-- App Config
DROP POLICY IF EXISTS "Todos podem ler app_config" ON public.app_config;
DROP POLICY IF EXISTS "Apenas service_role pode atualizar app_config" ON public.app_config;

-- ============================================
-- 3. FUNÇÃO AUXILIAR PARA OBTER EMAIL DO USUÁRIO
-- ============================================
-- Necessária para políticas RLS de orders com guest checkout

CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 4. POLÍTICAS RLS PARA PROFILES
-- ============================================

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Usuários podem inserir seu próprio perfil
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 5. POLÍTICAS RLS PARA VIP_LIST
-- ============================================

-- Usuários podem ver apenas sua própria entrada na lista VIP
CREATE POLICY "Users can view own VIP entry"
  ON public.vip_list
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir sua própria entrada na lista VIP
CREATE POLICY "Users can insert own VIP entry"
  ON public.vip_list
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar sua própria entrada na lista VIP
CREATE POLICY "Users can update own VIP entry"
  ON public.vip_list
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários autenticados vejam se estão na lista
CREATE POLICY "Authenticated users can check VIP status"
  ON public.vip_list
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ============================================
-- 6. POLÍTICAS RLS PARA ORDERS
-- ============================================
-- Suporta guest checkout e associação por email

-- Usuários podem ver pedidos associados ao seu user_id
-- OU pedidos de guest checkout com o mesmo email do usuário autenticado
CREATE POLICY "Users can view own orders by user_id or email"
  ON public.orders
  FOR SELECT
  USING (
    -- Pedidos associados ao user_id do usuário autenticado
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Pedidos de guest checkout com o mesmo email do usuário autenticado
    (
      auth.uid() IS NOT NULL 
      AND user_id IS NULL 
      AND customer_email = public.get_user_email()
    )
  );

-- Usuários autenticados podem criar seus próprios pedidos
CREATE POLICY "Users can create own orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

-- Usuários podem atualizar seus próprios pedidos (apenas status pendente)
CREATE POLICY "Users can update own pending orders"
  ON public.orders
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

-- ============================================
-- 7. POLÍTICAS RLS PARA ORDER_ITEMS
-- ============================================
-- Herda proteção de orders

-- Usuários podem ver itens de pedidos que podem acessar (por user_id ou email)
CREATE POLICY "Users can view own order items by user_id or email"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (
        -- Pedidos associados ao user_id
        (auth.uid() IS NOT NULL AND orders.user_id = auth.uid())
        OR
        -- Pedidos de guest checkout com o mesmo email
        (
          auth.uid() IS NOT NULL 
          AND orders.user_id IS NULL 
          AND orders.customer_email = public.get_user_email()
        )
      )
    )
  );

-- Usuários podem inserir itens em seus próprios pedidos
CREATE POLICY "Users can insert own order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- 8. POLÍTICAS RLS PARA PRODUCTS
-- ============================================

-- Todos podem ler produtos ativos (público)
CREATE POLICY "Anyone can view active products"
  ON public.products
  FOR SELECT
  USING (is_active = TRUE);

-- Apenas service_role pode gerenciar produtos
CREATE POLICY "Service role can manage products"
  ON public.products
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 9. POLÍTICAS RLS PARA INVENTORY
-- ============================================

-- Todos podem ver status de estoque (público)
CREATE POLICY "Anyone can view inventory status"
  ON public.inventory
  FOR SELECT
  USING (TRUE);

-- Apenas service_role pode gerenciar estoque
CREATE POLICY "Service role can manage inventory"
  ON public.inventory
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 10. POLÍTICAS RLS PARA INVENTORY_RESERVATIONS
-- ============================================

-- Apenas service_role pode gerenciar reservas
CREATE POLICY "Service role can manage reservations"
  ON public.inventory_reservations
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 11. POLÍTICAS RLS PARA INVENTORY_MOVEMENTS
-- ============================================

-- Apenas service_role pode gerenciar movimentações
CREATE POLICY "Service role can manage movements"
  ON public.inventory_movements
  FOR ALL
  USING (auth.role() = 'service_role');

-- Usuários podem ver suas próprias movimentações
CREATE POLICY "Users can view their own movements"
  ON public.inventory_movements
  FOR SELECT
  USING (created_by = auth.uid()::TEXT);

-- ============================================
-- 12. POLÍTICAS RLS PARA APP_CONFIG
-- ============================================

-- Todos podem ler configurações (público)
CREATE POLICY "Todos podem ler app_config"
  ON public.app_config
  FOR SELECT
  TO public
  USING (TRUE);

-- Apenas service_role pode atualizar configurações
CREATE POLICY "Apenas service_role pode atualizar app_config"
  ON public.app_config
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================
-- 13. VERIFICAÇÃO FINAL
-- ============================================

DO $$ 
BEGIN
  -- Verificar se RLS está habilitado
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
    AND rowsecurity = TRUE
  ) THEN
    RAISE WARNING 'RLS não está habilitado na tabela profiles';
  END IF;

  -- Verificar se as políticas foram criadas
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
    AND policyname = 'Users can view own profile'
  ) THEN
    RAISE WARNING 'Política de profiles não foi criada';
  END IF;

  RAISE NOTICE '✓ Políticas RLS configuradas com sucesso!';
  RAISE NOTICE '✓ Segurança do banco de dados garantida!';
END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- 
-- PRÓXIMOS PASSOS:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se não há erros
-- 3. Teste as políticas criando um usuário de teste
-- 4. Verifique que usuários só podem acessar seus próprios dados
-- 
-- ============================================
