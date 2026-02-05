-- ============================================================================
-- COLUNAS BLING NA TABELA ORDERS
-- ============================================================================
-- Rastreamento da sincronização com Bling (venda + NF-e).
-- Execute no SQL Editor do Supabase se quiser persistir status do Bling.
-- ============================================================================

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS bling_sale_id BIGINT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS bling_nfe_id BIGINT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS bling_sync_status TEXT DEFAULT 'pending';

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS bling_sync_error TEXT;

COMMENT ON COLUMN public.orders.bling_sale_id IS 'ID da venda no Bling';
COMMENT ON COLUMN public.orders.bling_nfe_id IS 'ID da NF-e no Bling (quando emitida)';
COMMENT ON COLUMN public.orders.bling_sync_status IS 'pending | sent | nfe_emitted | error';
COMMENT ON COLUMN public.orders.bling_sync_error IS 'Última mensagem de erro da sincronização Bling';
