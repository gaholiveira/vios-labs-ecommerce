-- ============================================
-- CORREÇÃO: Atualizar pedidos com customer_email NULL
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- ATENÇÃO: Este script NÃO pode recuperar emails de pedidos já criados
-- Ele apenas identifica pedidos sem email para verificação manual
-- ============================================

-- 1. Verificar pedidos sem customer_email
SELECT 
  id,
  user_id,
  customer_email,
  stripe_session_id,
  status,
  total_amount,
  created_at
FROM public.orders
WHERE customer_email IS NULL
ORDER BY created_at DESC;

-- 2. Para pedidos COM user_id mas SEM customer_email
-- Atualizar com o email do usuário (se disponível)
UPDATE public.orders
SET customer_email = (
  SELECT email 
  FROM auth.users 
  WHERE id = orders.user_id
)
WHERE customer_email IS NULL 
  AND user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = orders.user_id 
    AND email IS NOT NULL
  );

-- 3. Verificar quantos pedidos ainda estão sem email
SELECT 
  COUNT(*) as pedidos_sem_email,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as com_user_id,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as guest_checkout_sem_email
FROM public.orders
WHERE customer_email IS NULL;

-- NOTA: Pedidos de guest checkout (user_id NULL) sem customer_email
-- precisam ser atualizados manualmente com o email correto do Stripe Dashboard
-- ou precisam ser recriados através de um novo checkout

-- Para ver detalhes de um pedido específico no Stripe:
-- 1. Acesse o Stripe Dashboard
-- 2. Vá para Checkout Sessions
-- 3. Procure pelo stripe_session_id
-- 4. Veja o customer_email na sessão
-- 5. Execute:
-- UPDATE public.orders 
-- SET customer_email = 'email@exemplo.com' 
-- WHERE stripe_session_id = 'cs_test_...';
