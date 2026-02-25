-- ============================================
-- ATUALIZAR IMAGENS DE PRODUTOS EM PEDIDOS ANTIGOS
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- IMPORTANTE: Substitua 'https://vioslabs.com.br' pelo seu domínio se diferente
-- Ou use 'https://www.vioslabs.com.br' se usar www

-- 1. Verificar quantos itens precisam ser atualizados
SELECT 
  COUNT(*) as total_sem_imagem,
  COUNT(DISTINCT product_id) as produtos_afetados
FROM public.order_items
WHERE product_image IS NULL;

-- 2. Ver quais produtos estão sem imagem
SELECT 
  product_id,
  product_name,
  COUNT(*) as quantidade
FROM public.order_items
WHERE product_image IS NULL
GROUP BY product_id, product_name
ORDER BY quantidade DESC;

-- 3. Atualizar imagens baseado no product_id
-- (Mapeia cada product_id para sua imagem correspondente)
UPDATE public.order_items
SET product_image = CASE
  WHEN product_id = 'prod_1' THEN 'https://www.vioslabs.com.br/images/products/glow.jpeg'
  WHEN product_id = 'prod_2' THEN 'https://www.vioslabs.com.br/images/products/sleep.jpeg'
  WHEN product_id = 'prod_3' THEN 'https://www.vioslabs.com.br/images/products/mag3.jpeg'
  WHEN product_id = 'prod_4' THEN 'https://www.vioslabs.com.br/images/products/pulse.jpeg'
  WHEN product_id = 'prod_5' THEN 'https://www.vioslabs.com.br/images/products/move.jpeg'
  ELSE NULL -- Produtos desconhecidos permanecem NULL
END
WHERE product_image IS NULL
  AND product_id IN ('prod_1', 'prod_2', 'prod_3', 'prod_4', 'prod_5');

-- 4. Verificar resultado
SELECT 
  COUNT(*) as total,
  COUNT(product_image) as com_imagem,
  COUNT(*) - COUNT(product_image) as sem_imagem
FROM public.order_items;

-- 5. Ver alguns exemplos de itens atualizados
SELECT 
  id,
  product_id,
  product_name,
  product_image,
  created_at
FROM public.order_items
WHERE product_image IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
