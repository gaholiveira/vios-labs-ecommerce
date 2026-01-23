-- ============================================
-- CORREÇÃO: Atualizar tabela orders para suportar Guest Checkout
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Tornar user_id opcional (nullable) para suportar guest checkout
ALTER TABLE public.orders 
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Adicionar coluna customer_email (obrigatória para guest checkout)
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- 3. Adicionar coluna stripe_session_id (para rastreamento)
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE;

-- 4. Criar índice para customer_email (para busca rápida)
CREATE INDEX IF NOT EXISTS idx_orders_customer_email 
  ON public.orders(customer_email) 
  WHERE customer_email IS NOT NULL;

-- 5. Criar índice para stripe_session_id
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id 
  ON public.orders(stripe_session_id) 
  WHERE stripe_session_id IS NOT NULL;

-- 6. Atualizar índice de user_id para permitir NULL
DROP INDEX IF EXISTS idx_orders_user_id;
CREATE INDEX IF NOT EXISTS idx_orders_user_id 
  ON public.orders(user_id) 
  WHERE user_id IS NOT NULL;

-- 7. Adicionar constraint para garantir que pelo menos user_id OU customer_email existe
-- (Isso garante que sempre temos uma forma de identificar o cliente)
ALTER TABLE public.orders 
  ADD CONSTRAINT check_user_or_email 
  CHECK (user_id IS NOT NULL OR customer_email IS NOT NULL);

-- 8. Comentários para documentação
COMMENT ON COLUMN public.orders.user_id IS 'ID do usuário autenticado. NULL para pedidos de guest checkout.';
COMMENT ON COLUMN public.orders.customer_email IS 'Email do cliente. Obrigatório para guest checkout, opcional para usuários autenticados.';
COMMENT ON COLUMN public.orders.stripe_session_id IS 'ID da sessão do Stripe Checkout. Usado para evitar duplicatas e rastrear pedidos.';

-- 9. Verificar se há pedidos existentes sem customer_email e tentar preencher
-- (Apenas para pedidos com user_id, buscar email do auth.users)
UPDATE public.orders o
SET customer_email = (
  SELECT email 
  FROM auth.users 
  WHERE id = o.user_id
)
WHERE customer_email IS NULL 
  AND user_id IS NOT NULL;

-- 10. Verificar resultado
SELECT 
  COUNT(*) as total_pedidos,
  COUNT(user_id) as com_user_id,
  COUNT(customer_email) as com_email,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as guest_checkout
FROM public.orders;
