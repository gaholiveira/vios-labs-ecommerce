-- Tabela para captura de abandono de checkout
-- Registra e-mail/telefone preenchidos no checkout antes da finalização do pedido.
-- O cron /api/cron/email-sequence processa os abandons 1h após a captura.
--
-- Fluxo:
--   1. Cliente preenche o e-mail no checkout → onBlur → POST /api/checkout/abandon
--   2. Se o campo de telefone for preenchido, o registro é atualizado
--   3. Ao finalizar o pedido (order.paid), o registro é marcado como converted
--   4. Cron: 1h após captured_at, se status = 'pending', envia e-mail de abandono

CREATE TABLE IF NOT EXISTS public.checkout_abandons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  phone         TEXT,
  cart_items    JSONB,           -- snapshot do carrinho no momento da captura
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  send_at       TIMESTAMPTZ NOT NULL,  -- captured_at + 1h
  sent_at       TIMESTAMPTZ,
  converted_at  TIMESTAMPTZ,          -- preenchido quando order é criado com este e-mail
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sent', 'converted', 'failed')),
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para o cron (busca abandons pendentes com send_at vencido)
CREATE INDEX IF NOT EXISTS idx_checkout_abandons_pending
  ON public.checkout_abandons (status, send_at)
  WHERE status = 'pending';

-- Índice por e-mail para upsert eficiente e marcação de conversão
CREATE INDEX IF NOT EXISTS idx_checkout_abandons_email
  ON public.checkout_abandons (email);

-- RLS: acesso exclusivo via service role (getSupabaseAdmin)
ALTER TABLE public.checkout_abandons ENABLE ROW LEVEL SECURITY;
