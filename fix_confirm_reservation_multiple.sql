-- ============================================================================
-- CORREÇÃO: confirm_reservation processar TODAS as reservas do session_id
-- ============================================================================
-- Necessário para:
-- - Stripe: carrinho com vários itens (várias reservas, mesmo session.id)
-- - Mercado Pago: carrinho com vários itens (várias reservas, mesmo preference_id)
-- ============================================================================
-- Execute no SQL Editor do Supabase
-- ============================================================================

CREATE OR REPLACE FUNCTION confirm_reservation(
  p_stripe_session_id TEXT,
  p_order_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_reservation_record RECORD;
  v_confirmed_count INTEGER := 0;
BEGIN
  -- Processar TODAS as reservas ativas com esse session_id (ou preference_id)
  FOR v_reservation_record IN
    SELECT *
    FROM inventory_reservations
    WHERE stripe_session_id = p_stripe_session_id
      AND status = 'active'
    FOR UPDATE
  LOOP
    -- Decrementar stock_quantity (efetiva a venda)
    UPDATE inventory
    SET stock_quantity = stock_quantity - v_reservation_record.quantity,
        reserved_quantity = reserved_quantity - v_reservation_record.quantity
    WHERE product_id = v_reservation_record.product_id;
    
    -- Marcar reserva como completed
    UPDATE inventory_reservations
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = v_reservation_record.id;
    
    -- Log da movimentação (venda)
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
      'sale',
      -v_reservation_record.quantity,
      i.stock_quantity + v_reservation_record.quantity,
      i.stock_quantity,
      p_order_id,
      'Order confirmed',
      COALESCE(v_reservation_record.user_id::TEXT, 'guest')
    FROM inventory i
    WHERE i.product_id = v_reservation_record.product_id;
    
    v_confirmed_count := v_confirmed_count + 1;
  END LOOP;
  
  IF v_confirmed_count = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Reservation not found or already processed'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'confirmed_count', v_confirmed_count,
    'message', format('Confirmed %s reservation(s)', v_confirmed_count)
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION confirm_reservation(TEXT, TEXT) IS 'Confirma todas as reservas ativas para o session_id (Stripe) ou preference_id (Mercado Pago). Necessário para carrinhos com múltiplos itens.';
