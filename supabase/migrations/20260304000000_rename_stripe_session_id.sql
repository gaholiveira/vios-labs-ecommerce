-- Migration: Renomear stripe_session_id → payment_order_id
-- A coluna armazena IDs do Pagar.me (ex: or_xyz123), não do Stripe.
-- O nome antigo causava confusão e dificultava o onboarding.
--
-- IMPORTANTE: Aplicar esta migration ANTES ou junto ao deploy do código atualizado.
-- Execute no Supabase SQL Editor ou via supabase db push.

-- Renomear coluna na tabela orders
ALTER TABLE public.orders
  RENAME COLUMN stripe_session_id TO payment_order_id;

-- Renomear coluna na tabela inventory_reservations (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory_reservations'
      AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE public.inventory_reservations
      RENAME COLUMN stripe_session_id TO payment_order_id;
  END IF;
END $$;

-- Recriar função release_reservation com o novo nome de coluna (se necessário)
-- Execute: \df release_reservation no psql para verificar a assinatura atual
-- e atualize conforme necessário.
