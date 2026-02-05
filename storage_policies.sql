-- ============================================
-- POLÍTICAS RLS PARA STORAGE - AVATARS
-- VIOS LABS - Configuração de Upload de Avatares
-- ============================================

-- IMPORTANTE: Antes de executar este script:
-- 1. Crie o bucket 'avatars' no Supabase Dashboard (Storage → New bucket)
-- 2. Configure o bucket como PÚBLICO
-- 3. Defina o limite de tamanho (recomendado: 2 MB)

-- ============================================
-- REMOVER POLÍTICAS EXISTENTES (evita duplicação)
-- ============================================

DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- ============================================
-- POLÍTICA 1: UPLOAD (INSERT)
-- ============================================
-- Permite que usuários autenticados façam upload de avatares
-- APENAS na sua própria pasta: avatars/{userId}/{fileName}

CREATE POLICY "Users can upload own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- POLÍTICA 2: ATUALIZAR (UPDATE)
-- ============================================
-- Permite que usuários autenticados atualizem avatares
-- APENAS na sua própria pasta: avatars/{userId}/{fileName}

CREATE POLICY "Users can update own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- POLÍTICA 3: DELETAR (DELETE)
-- ============================================
-- Permite que usuários autenticados deletem avatares
-- APENAS na sua própria pasta: avatars/{userId}/{fileName}

CREATE POLICY "Users can delete own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- POLÍTICA 4: VISUALIZAR (SELECT) - PÚBLICA
-- ============================================
-- Permite que qualquer pessoa (autenticada ou não) visualize avatares
-- Isso é necessário para que as URLs públicas funcionem
-- e as imagens possam ser exibidas no site

CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================
-- EXPLICAÇÃO DA VALIDAÇÃO
-- ============================================
-- 
-- A função (storage.foldername(name))[1] extrai o primeiro nível da pasta
-- Exemplo: avatars/123e4567-e89b-12d3-a456-426614174000/image.jpg
--          Retorna: "123e4567-e89b-12d3-a456-426614174000"
-- 
-- auth.uid()::text retorna o ID do usuário autenticado como string
-- 
-- A comparação garante que o usuário só pode fazer upload/update/delete
-- na pasta que corresponde ao seu próprio ID de usuário.
-- 
-- ============================================
-- ESTRUTURA DE PASTAS OBRIGATÓRIA
-- ============================================
-- 
-- avatars/
--   └── {userId}/
--       └── {fileName}
-- 
-- Exemplo:
-- avatars/
--   └── 123e4567-e89b-12d3-a456-426614174000/
--       └── 1704067200000.jpg
-- 
-- O código da aplicação DEVE usar esta estrutura:
-- const filePath = `avatars/${user.id}/${fileName}`;
-- 
-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- 
-- Após executar este script, verifique:
-- 1. Storage → Policies → Deve ver 4 políticas para 'avatars'
-- 2. Teste o upload na aplicação (/profile)
-- 3. Verifique se os arquivos são salvos em avatars/{userId}/
-- 
-- ============================================
