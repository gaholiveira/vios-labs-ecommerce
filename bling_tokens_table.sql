-- ============================================
-- TABELA BLING_TOKENS - Tokens OAuth Bling (refresh automático)
-- ============================================
-- Armazena access_token e refresh_token para renovação automática.
-- Uma única linha (id = 1). Acesso apenas via service_role.
-- ============================================

CREATE TABLE IF NOT EXISTS public.bling_tokens (
  id INT PRIMARY KEY DEFAULT 1,
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT bling_tokens_single_row CHECK (id = 1)
);

COMMENT ON TABLE public.bling_tokens IS 'Tokens OAuth Bling para renovação automática (uso interno)';

-- RLS: apenas service_role acessa (backend); anon/authenticated não têm política = sem acesso
ALTER TABLE public.bling_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas service_role acessa bling_tokens"
  ON public.bling_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
