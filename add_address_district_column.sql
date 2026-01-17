-- ============================================
-- ADICIONAR COLUNA address_district (BAIRRO)
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Este script adiciona a coluna "address_district" (Bairro) na tabela profiles
-- ============================================

-- Adicionar coluna address_district se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'address_district'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN address_district TEXT;
    
    RAISE NOTICE 'Coluna address_district adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna address_district já existe na tabela profiles.';
  END IF;
END $$;

-- Verificar se a coluna foi adicionada
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'address_district';
