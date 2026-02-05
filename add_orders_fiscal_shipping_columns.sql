-- ============================================================================
-- COLUNAS FISCAL E ENTREGA NA TABELA ORDERS
-- ============================================================================
-- Permite puxar de um só lugar: CPF, nome, telefone e endereço para NF-e e entrega.
-- Execute no SQL Editor do Supabase.
-- ============================================================================

-- CPF (pode já existir se add_cpf_to_orders.sql foi aplicado)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_cpf TEXT;

-- Nome do cliente
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Telefone
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Endereço de entrega
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_cep TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_street TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_number TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_complement TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_neighborhood TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_city TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_state TEXT;

-- Comentários
COMMENT ON COLUMN public.orders.customer_cpf IS 'CPF do cliente (fiscal/NF-e)';
COMMENT ON COLUMN public.orders.customer_name IS 'Nome completo do cliente';
COMMENT ON COLUMN public.orders.customer_phone IS 'Telefone do cliente (entrega/contato)';
COMMENT ON COLUMN public.orders.shipping_cep IS 'CEP do endereço de entrega';
COMMENT ON COLUMN public.orders.shipping_street IS 'Logradouro';
COMMENT ON COLUMN public.orders.shipping_number IS 'Número';
COMMENT ON COLUMN public.orders.shipping_complement IS 'Complemento';
COMMENT ON COLUMN public.orders.shipping_neighborhood IS 'Bairro';
COMMENT ON COLUMN public.orders.shipping_city IS 'Cidade';
COMMENT ON COLUMN public.orders.shipping_state IS 'UF (2 caracteres)';
