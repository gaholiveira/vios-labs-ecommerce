-- ============================================
-- ADICIONAR COLUNA product_image À TABELA order_items
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Adicionar coluna product_image se não existir
ALTER TABLE public.order_items 
  ADD COLUMN IF NOT EXISTS product_image TEXT;

-- 2. Adicionar comentário para documentação
COMMENT ON COLUMN public.order_items.product_image IS 'URL da imagem do produto no momento do pedido';

-- 3. Verificar se a coluna foi adicionada
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items' 
  AND table_schema = 'public'
  AND column_name = 'product_image';

-- 4. Verificar pedidos existentes sem imagem
SELECT 
  COUNT(*) as total_itens,
  COUNT(product_image) as com_imagem,
  COUNT(*) - COUNT(product_image) as sem_imagem
FROM public.order_items;
