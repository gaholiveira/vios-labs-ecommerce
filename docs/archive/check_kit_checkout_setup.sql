-- ============================================================================
-- SCRIPT DE VERIFICAÇÃO E CORREÇÃO PARA CHECKOUT DE KITS
-- ============================================================================
-- Execute este script no SQL Editor do Supabase para verificar e corrigir
-- problemas com o checkout de kits
-- ============================================================================

-- 1. Verificar se os produtos existem na tabela inventory
SELECT 
  product_id,
  stock_quantity,
  reserved_quantity,
  (stock_quantity - reserved_quantity) as available_quantity
FROM inventory
WHERE product_id IN ('prod_1', 'prod_2', 'prod_3', 'prod_4', 'prod_5')
ORDER BY product_id;

-- 2. Se os produtos não existirem, criar registros de inventory
INSERT INTO inventory (product_id, stock_quantity, reserved_quantity)
VALUES 
  ('prod_1', 100, 0),
  ('prod_2', 100, 0),
  ('prod_3', 100, 0),
  ('prod_4', 100, 0),
  ('prod_5', 100, 0)
ON CONFLICT (product_id) DO NOTHING;

-- 3. Verificar se a função reserve_inventory existe
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'reserve_inventory';

-- 4. Se a função não existir, você precisa executar o script:
-- inventory_system_setup.sql ou INVENTORY_RESERVATION_IMPROVEMENTS.sql
-- no SQL Editor do Supabase

-- 5. Verificar se os produtos existem na tabela products
SELECT 
  id,
  name,
  price,
  is_active
FROM products
WHERE id IN ('prod_1', 'prod_2', 'prod_3', 'prod_4', 'prod_5')
ORDER BY id;

-- 6. Se os produtos não existirem na tabela products, criar:
INSERT INTO products (id, name, description, price, category, is_active)
VALUES 
  ('prod_1', 'Vios Glow', 'Suplemento de alta performance', 219.00, 'Suplemento', true),
  ('prod_2', 'Vios Sleep', 'Solução para sono profundo', 179.00, 'Suplemento', true),
  ('prod_3', 'Vios Mag3', 'Tripla infusão de magnésio', 167.00, 'Suplemento', true),
  ('prod_4', 'Vios Pulse', 'Performance física e mental', 197.00, 'Suplemento', true),
  ('prod_5', 'Vios Move', 'Preservação da mobilidade', 189.00, 'Suplemento', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Verificar se há reservas ativas que podem estar bloqueando
SELECT 
  ir.id,
  ir.product_id,
  ir.quantity,
  ir.status,
  ir.expires_at,
  ir.stripe_session_id
FROM inventory_reservations ir
WHERE ir.status = 'active'
  AND ir.expires_at > NOW()
ORDER BY ir.created_at DESC
LIMIT 10;
