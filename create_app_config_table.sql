-- ============================================
-- TABELA APP_CONFIG - Controle de Configurações da Aplicação
-- ============================================
-- Esta tabela armazena configurações globais da aplicação,
-- como o controle de abertura de vendas (sales_open)
-- ============================================

-- Criar tabela app_config
CREATE TABLE IF NOT EXISTS public.app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índice para busca rápida por chave
CREATE INDEX IF NOT EXISTS idx_app_config_key ON public.app_config(key);

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS set_updated_at_app_config ON public.app_config;
CREATE TRIGGER set_updated_at_app_config
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Inserir configuração inicial: sales_open = false
INSERT INTO public.app_config (key, value, description)
VALUES (
  'sales_open',
  'false'::jsonb,
  'Controla se as vendas do Lote Zero estão abertas. true = vendas abertas, false = em breve'
)
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler (para verificar se as vendas estão abertas)
CREATE POLICY "Todos podem ler app_config"
  ON public.app_config
  FOR SELECT
  TO public
  USING (true);

-- Política: Apenas service_role pode inserir/atualizar (via dashboard/admin)
-- Para permitir atualização via dashboard do Supabase, você pode criar uma política específica
-- ou usar o service_role para fazer atualizações
CREATE POLICY "Apenas service_role pode atualizar app_config"
  ON public.app_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comentário na tabela
COMMENT ON TABLE public.app_config IS 'Configurações globais da aplicação VIOS LABS';
COMMENT ON COLUMN public.app_config.key IS 'Chave única da configuração (ex: sales_open)';
COMMENT ON COLUMN public.app_config.value IS 'Valor da configuração em formato JSONB (pode ser boolean, string, number, etc)';
COMMENT ON COLUMN public.app_config.description IS 'Descrição do que a configuração controla';
