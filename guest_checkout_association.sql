-- ============================================
-- GUEST CHECKOUT - ASSOCIAÇÃO DE PEDIDOS
-- ============================================
-- Script para atualizar políticas RLS e criar função de associação
-- Execute este script no SQL Editor do Supabase após database_setup_complete.sql
-- ============================================

-- ============================================
-- 1. REMOVER POLÍTICAS ANTIGAS DE ORDERS
-- ============================================
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders by user_id or email" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own pending orders" ON public.orders;

-- ============================================
-- 2. FUNÇÃO AUXILIAR PARA OBTER EMAIL DO USUÁRIO
-- ============================================
-- Cria uma função SECURITY DEFINER que pode acessar auth.users
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 3. NOVAS POLÍTICAS RLS PARA ORDERS
-- ============================================
-- Permite que usuários vejam pedidos associados ao seu user_id
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
-- 4. REMOVER POLÍTICAS ANTIGAS DE ORDER_ITEMS
-- ============================================
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items by user_id or email" ON public.order_items;

-- ============================================
-- 5. NOVAS POLÍTICAS RLS PARA ORDER_ITEMS
-- ============================================
-- Permite que usuários vejam itens de pedidos que podem acessar (por user_id ou email)
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

-- ============================================
-- 6. FUNÇÃO PARA ASSOCIAR PEDIDOS DE GUEST AO USUÁRIO
-- ============================================
-- Esta função associa pedidos de guest checkout ao user_id quando o usuário cria conta ou faz login
CREATE OR REPLACE FUNCTION public.associate_guest_orders()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário tem um email, procurar pedidos de guest checkout com esse email
  IF NEW.email IS NOT NULL THEN
    UPDATE public.orders
    SET user_id = NEW.id
    WHERE customer_email = NEW.email
      AND user_id IS NULL; -- Apenas pedidos que ainda não foram associados
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. TRIGGER PARA ASSOCIAR PEDIDOS AUTOMATICAMENTE
-- ============================================
-- Executa a função quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_user_created_associate_orders ON auth.users;
CREATE TRIGGER on_user_created_associate_orders
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.associate_guest_orders();

-- ============================================
-- 8. FUNÇÃO AUXILIAR PARA ASSOCIAR PEDIDOS MANUALMENTE
-- ============================================
-- Esta função pode ser chamada manualmente se necessário (por exemplo, após login)
CREATE OR REPLACE FUNCTION public.associate_my_guest_orders()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
  user_email TEXT;
BEGIN
  -- Obter o email do usuário autenticado
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  IF user_email IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Associar pedidos de guest checkout ao usuário
  UPDATE public.orders
  SET user_id = auth.uid()
  WHERE customer_email = user_email
    AND user_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON FUNCTION public.get_user_email() IS 'Retorna o email do usuário autenticado (usado em políticas RLS)';
COMMENT ON FUNCTION public.associate_guest_orders() IS 'Associa automaticamente pedidos de guest checkout ao usuário quando a conta é criada';
COMMENT ON FUNCTION public.associate_my_guest_orders() IS 'Associa pedidos de guest checkout ao usuário autenticado manualmente (pode ser chamada após login)';
