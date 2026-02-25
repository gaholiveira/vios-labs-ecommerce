-- ============================================
-- ADICIONAR CAMPO PHONE NA TABELA VIP_LIST
-- ============================================
-- Script para adicionar campo de WhatsApp/Telefone na lista VIP
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna phone se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vip_list' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.vip_list 
    ADD COLUMN phone TEXT;
    
    RAISE NOTICE '✅ Coluna phone adicionada à tabela vip_list';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna phone já existe na tabela vip_list';
  END IF;
END $$;

-- Criar índice para pesquisas por telefone
CREATE INDEX IF NOT EXISTS idx_vip_list_phone 
ON public.vip_list(phone) 
WHERE phone IS NOT NULL;

-- Verificar estrutura atualizada
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'vip_list'
ORDER BY ordinal_position;

-- Comentário na coluna
COMMENT ON COLUMN public.vip_list.phone IS 'WhatsApp ou telefone de contato do VIP';

-- ✅ Script concluído! A coluna phone foi adicionada à tabela vip_list com sucesso!
