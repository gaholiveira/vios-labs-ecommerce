-- ============================================================================
-- ADICIONAR COLUNA CPF NA TABELA ORDERS
-- ============================================================================
-- Este script adiciona a coluna customer_cpf na tabela orders
-- para armazenar o CPF coletado no checkout (obrigatório para Nota Fiscal)
-- ============================================================================

-- Adicionar coluna customer_cpf (opcional, pois pode não estar disponível em todos os checkouts)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_cpf TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.orders.customer_cpf IS 'CPF do cliente coletado no checkout (obrigatório para emissão de Nota Fiscal)';

-- Criar índice para buscas por CPF (útil para relatórios fiscais)
CREATE INDEX IF NOT EXISTS idx_orders_customer_cpf 
ON public.orders(customer_cpf) 
WHERE customer_cpf IS NOT NULL;

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. A coluna é opcional (NULL permitido) porque:
--    - Checkouts antigos podem não ter CPF
--    - O Stripe pode não coletar CPF em alguns casos raros
--    - Permite migração gradual
--
-- 2. O CPF é coletado automaticamente pelo Stripe quando:
--    - tax_id_collection: { enabled: true } está configurado
--    - O checkout é para o Brasil (allowed_countries: ["BR"])
--
-- 3. O CPF está disponível no webhook em:
--    - session.customer_details.tax_ids (array)
--    - Tipo: 'br_cpf'
--
-- 4. Para emissão de Nota Fiscal:
--    - O CPF é obrigatório no Brasil
--    - Deve ser validado antes de emitir a NF-e
--    - Formato: XXX.XXX.XXX-XX (validado pelo Stripe)
-- ============================================================================
