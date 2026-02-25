-- ============================================================================
-- CORREÇÃO: Remover constraint UNIQUE de stripe_session_id
-- ============================================================================
-- A constraint UNIQUE impede múltiplas reservas para a mesma sessão de checkout
-- (necessário para kits com múltiplos produtos)
-- ============================================================================

-- 1. Remover a constraint UNIQUE existente
ALTER TABLE inventory_reservations 
DROP CONSTRAINT IF EXISTS inventory_reservations_stripe_session_id_key;

-- 2. Criar um índice (não único) para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_stripe_session_id 
ON inventory_reservations(stripe_session_id);

-- 3. Verificar se a alteração foi aplicada
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'inventory_reservations'::regclass
  AND conname LIKE '%stripe_session%';
