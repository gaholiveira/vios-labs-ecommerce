-- Adiciona campos de rastreio de envio à tabela orders
-- Preenchidos pelo webhook do Bling quando o pedido é marcado como enviado.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_code    TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url     TEXT,
  ADD COLUMN IF NOT EXISTS tracking_carrier TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at       TIMESTAMPTZ;

-- Índice para busca por código de rastreio (reconciliação e suporte)
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code
  ON public.orders (tracking_code)
  WHERE tracking_code IS NOT NULL;

COMMENT ON COLUMN public.orders.tracking_code    IS 'Código de rastreio (ex: BR123456789BR)';
COMMENT ON COLUMN public.orders.tracking_url     IS 'URL de rastreio da transportadora';
COMMENT ON COLUMN public.orders.tracking_carrier IS 'Nome da transportadora (ex: Correios, Jadlog)';
COMMENT ON COLUMN public.orders.shipped_at       IS 'Data/hora em que o pedido foi despachado';
