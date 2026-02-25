-- ============================================
-- MELHORIAS NO SISTEMA DE RESERVA DE ESTOQUE
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Data: 25 de Janeiro de 2026
-- ============================================

-- ============================================
-- 1. REDUZIR TIMEOUT DE RESERVA (1h → 30min)
-- ============================================
-- Reduz o tempo de expiração de reservas de 1 hora para 30 minutos
-- Isso libera estoque mais rapidamente para produtos de alta demanda
-- ============================================

CREATE OR REPLACE FUNCTION reserve_inventory(
  p_product_id TEXT,
  p_quantity INTEGER,
  p_stripe_session_id TEXT,
  p_customer_email TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_available_stock INTEGER;
  v_reservation_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Verificar estoque disponível
  SELECT (stock_quantity - reserved_quantity) INTO v_available_stock
  FROM inventory
  WHERE product_id = p_product_id
  FOR UPDATE; -- Lock para evitar race conditions
  
  -- Validar se há estoque suficiente
  IF v_available_stock IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Product not found in inventory'
    );
  END IF;
  
  IF v_available_stock < p_quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient stock',
      'available', v_available_stock,
      'requested', p_quantity
    );
  END IF;
  
  -- Definir expiração (30 minutos a partir de agora - REDUZIDO DE 1 HORA)
  -- 30 minutos é tempo suficiente para checkout típico (15-20 min)
  -- E libera estoque mais rápido para produtos de alta demanda
  v_expires_at := NOW() + INTERVAL '30 minutes';
  
  -- Criar reserva
  INSERT INTO inventory_reservations (
    product_id,
    quantity,
    stripe_session_id,
    customer_email,
    user_id,
    expires_at,
    status
  ) VALUES (
    p_product_id,
    p_quantity,
    p_stripe_session_id,
    p_customer_email,
    p_user_id,
    v_expires_at,
    'active'
  ) RETURNING id INTO v_reservation_id;
  
  -- Incrementar reserved_quantity no inventory
  UPDATE inventory
  SET reserved_quantity = reserved_quantity + p_quantity
  WHERE product_id = p_product_id;
  
  -- Log da movimentação
  INSERT INTO inventory_movements (
    product_id,
    movement_type,
    quantity_change,
    quantity_before,
    quantity_after,
    reference_id,
    reason,
    created_by
  ) VALUES (
    p_product_id,
    'reservation',
    -p_quantity,
    v_available_stock,
    v_available_stock - p_quantity,
    v_reservation_id::TEXT,
    'Checkout reservation',
    COALESCE(p_user_id::TEXT, 'guest')
  );
  
  RETURN json_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'expires_at', v_expires_at
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. MELHORAR FUNÇÃO DE LIBERAÇÃO DE RESERVA
-- ============================================
-- Adiciona suporte para liberar múltiplas reservas por session_id
-- ============================================

CREATE OR REPLACE FUNCTION release_reservation(
  p_stripe_session_id TEXT,
  p_reason TEXT DEFAULT 'Manual cancellation'
)
RETURNS JSON AS $$
DECLARE
  v_reservation_record RECORD;
  v_released_count INTEGER := 0;
BEGIN
  -- Buscar todas as reservas ativas com esse session_id
  FOR v_reservation_record IN
    SELECT *
    FROM inventory_reservations
    WHERE stripe_session_id = p_stripe_session_id
      AND status = 'active'
    FOR UPDATE
  LOOP
    -- Decrementar reserved_quantity (libera estoque)
    UPDATE inventory
    SET reserved_quantity = reserved_quantity - v_reservation_record.quantity
    WHERE product_id = v_reservation_record.product_id;
    
    -- Marcar reserva como cancelled
    UPDATE inventory_reservations
    SET status = 'cancelled',
        completed_at = NOW()
    WHERE id = v_reservation_record.id;
    
    -- Log da movimentação
    INSERT INTO inventory_movements (
      product_id,
      movement_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reference_id,
      reason,
      created_by
    )
    SELECT
      v_reservation_record.product_id,
      'reservation_release',
      v_reservation_record.quantity,
      (i.stock_quantity - i.reserved_quantity) - v_reservation_record.quantity,
      (i.stock_quantity - i.reserved_quantity),
      v_reservation_record.id::TEXT,
      p_reason,
      'system'
    FROM inventory i
    WHERE i.product_id = v_reservation_record.product_id;
    
    v_released_count := v_released_count + 1;
  END LOOP;
  
  IF v_released_count = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Reservation not found or already processed'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'released_count', v_released_count,
    'message', format('Released %s reservation(s)', v_released_count)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================

COMMENT ON FUNCTION reserve_inventory IS 'Reserva estoque durante checkout. Timeout: 30 minutos (reduzido de 1 hora para melhor performance).';
COMMENT ON FUNCTION release_reservation IS 'Libera reservas de estoque. Agora suporta múltiplas reservas por session_id.';

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- 
-- PRÓXIMOS PASSOS:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se não há erros
-- 3. Teste o fluxo de checkout
-- 4. Configure cleanup automático (ver INVENTORY_RESERVATION_IMPROVEMENTS.md)
-- 
-- ============================================
