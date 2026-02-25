-- ============================================
-- DIAGNÓSTICO DE STORAGE - VERIFICAÇÃO DE POLÍTICAS
-- VIOS LABS - Script para verificar configuração do Storage
-- ============================================
-- Execute este script para verificar se tudo está configurado corretamente
-- ============================================

-- 1. Verificar se o bucket 'avatars' existe
SELECT 
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'avatars';

-- 2. Verificar todas as políticas RLS do Storage para o bucket 'avatars'
SELECT 
  policyname as policy_name,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- 3. Verificar todas as políticas do Storage (todas as operações)
SELECT 
  policyname as policy_name,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Visualização'
    WHEN cmd = 'INSERT' THEN 'Upload'
    WHEN cmd = 'UPDATE' THEN 'Atualização'
    WHEN cmd = 'DELETE' THEN 'Exclusão'
    ELSE cmd::text
  END as operacao_portugues
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname, cmd;

-- 4. Verificar se o Storage tem RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage'
  AND tablename = 'objects';

-- 5. Verificar estrutura atual de arquivos no bucket (se houver)
SELECT 
  name as file_path,
  bucket_id,
  created_at,
  updated_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- INTERPRETAÇÃO DOS RESULTADOS
-- ============================================
-- 
-- 1. BUCKET:
--    - Deve existir um bucket chamado 'avatars'
--    - is_public deve ser TRUE
--    - file_size_limit deve ser 2097152 (2 MB) ou maior
-- 
-- 2. POLÍTICAS:
--    - Deve existir 4 políticas com nomes que contêm 'avatar':
--      * Users can upload own avatars (INSERT)
--      * Users can update own avatars (UPDATE)
--      * Users can delete own avatars (DELETE)
--      * Anyone can view avatars (SELECT)
-- 
-- 3. RLS:
--    - rls_enabled deve ser TRUE
-- 
-- 4. ARQUIVOS:
--    - Se houver arquivos, devem estar na estrutura avatars/{userId}/
-- 
-- ============================================
-- PROBLEMAS COMUNS E SOLUÇÕES
-- ============================================
-- 
-- PROBLEMA 1: Bucket não existe
-- SOLUÇÃO: Crie o bucket 'avatars' no Dashboard (Storage → New bucket)
-- 
-- PROBLEMA 2: Bucket não é público
-- SOLUÇÃO: Marque o bucket como público nas configurações
-- 
-- PROBLEMA 3: Políticas não existem
-- SOLUÇÃO: Execute o script storage_policies.sql
-- 
-- PROBLEMA 4: RLS não está habilitado
-- SOLUÇÃO: RLS sempre está habilitado no Storage (não pode desabilitar)
-- 
-- PROBLEMA 5: Políticas com sintaxe errada
-- SOLUÇÃO: Execute o script storage_policies.sql novamente
-- 
-- ============================================
