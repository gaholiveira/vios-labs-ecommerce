-- Tabela de fila de e-mails da sequence pós-compra
-- Registra os e-mails agendados para cada pedido e controla o estado de envio.
--
-- Tipos disponíveis (sequence_type):
--   d3_check_in  → Dia 3: "Seus resultados estão começando" + link para avaliação
--   d7_reorder   → Dia 7: "Garanta seu próximo ciclo" + CTA de recompra

CREATE TABLE IF NOT EXISTS public.email_sequences (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name  TEXT,
  sequence_type  TEXT NOT NULL CHECK (sequence_type IN ('d3_check_in', 'd7_reorder')),
  product_names  TEXT[] NOT NULL DEFAULT '{}',
  product_ids    TEXT[] NOT NULL DEFAULT '{}',
  send_at        TIMESTAMPTZ NOT NULL,
  sent_at        TIMESTAMPTZ,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice principal para o cron (busca por pending + send_at)
CREATE INDEX IF NOT EXISTS idx_email_sequences_pending
  ON public.email_sequences (status, send_at)
  WHERE status = 'pending';

-- Evitar duplicatas: um tipo de e-mail por pedido
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_sequences_order_type
  ON public.email_sequences (order_id, sequence_type);

-- RLS: só a service role acessa (leitura/escrita via getSupabaseAdmin)
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
