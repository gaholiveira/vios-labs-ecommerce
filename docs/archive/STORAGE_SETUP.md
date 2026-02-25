# 📦 Guia de Configuração do Supabase Storage - VIOS LABS

Este guia explica como configurar o Supabase Storage para permitir upload de avatares de usuários.

## 📋 Pré-requisitos

1. Conta no Supabase criada
2. Projeto Supabase criado
3. Acesso ao Dashboard do Supabase

## 🚀 Passo a Passo

### 1. Criar o Bucket 'avatars'

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**
4. Clique em **New bucket**
5. Preencha:
   - **Name:** `avatars`
   - **Public bucket:** ✅ **SIM** (precisa estar público para URLs públicas)
   - **File size limit:** 2 MB (ou o limite desejado)
   - **Allowed MIME types:** `image/*` (opcional, mas recomendado)
6. Clique em **Create bucket**

### 2. Configurar Políticas RLS (Row Level Security)

1. No Dashboard do Supabase, vá para **Storage** → **Policies**
2. Ou acesse o **SQL Editor** e execute o script abaixo:

#### Script SQL para Políticas RLS do Storage

```sql
-- ============================================
-- POLÍTICAS RLS PARA STORAGE - AVATARS
-- ============================================

-- Remover políticas existentes (evita duplicação)
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- 1. Usuários podem fazer upload de avatares APENAS na sua própria pasta
CREATE POLICY "Users can upload own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Usuários podem atualizar avatares APENAS na sua própria pasta
CREATE POLICY "Users can update own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Usuários podem deletar avatares APENAS na sua própria pasta
CREATE POLICY "Users can delete own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Qualquer pessoa (autenticada ou não) pode visualizar avatares
-- Isso permite que as URLs públicas funcionem para exibir imagens
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### 3. Explicação das Políticas

#### Estrutura de Pastas Obrigatória

As políticas exigem que os arquivos sejam salvos na estrutura:
```
avatars/
  └── {userId}/
      └── {fileName}
```

Exemplo:
```
avatars/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── 1704067200000.jpg
```

#### Validação de Segurança

A função `(storage.foldername(name))[1]` extrai o primeiro nível da pasta (o `userId`) e compara com `auth.uid()::text` (o ID do usuário autenticado). Isso garante que:

- ✅ Usuários só podem fazer upload na sua própria pasta
- ✅ Usuários não podem acessar pastas de outros usuários
- ✅ URLs públicas funcionam para visualização (política de SELECT pública)

### 4. Verificar Configuração

Após executar o script, verifique:

1. **Bucket criado:**
   - Vá para **Storage** → **Buckets**
   - Confirme que `avatars` está listado e é público

2. **Políticas criadas:**
   - Vá para **Storage** → **Policies**
   - Você deve ver 4 políticas para o bucket `avatars`

3. **Testar upload:**
   - Acesse a página `/profile`
   - Tente fazer upload de uma imagem de avatar
   - Deve funcionar sem erros de permissão

## ⚠️ Troubleshooting

### Erro: "Erro de permissão. Verifique se o bucket está configurado corretamente."

**Causas possíveis:**

1. **Bucket não existe**
   - ✅ Solução: Crie o bucket `avatars` conforme passo 1

2. **Políticas RLS não foram criadas**
   - ✅ Solução: Execute o script SQL do passo 2

3. **Estrutura de pastas incorreta**
   - ✅ Solução: Certifique-se de que o código salva em `avatars/${userId}/${fileName}`
   - Verifique o código em `src/app/profile/page.tsx` linha 121

4. **Bucket não é público**
   - ✅ Solução: Marque o bucket como público nas configurações

5. **Usuário não está autenticado**
   - ✅ Solução: Certifique-se de estar logado ao tentar fazer upload

### Erro: "Bucket de avatares não encontrado"

- ✅ Verifique se o bucket `avatars` foi criado corretamente
- ✅ Confirme o nome exato do bucket (deve ser `avatars`, não `avatar`)

### Erro: "new row violates row-level security"

- ✅ Execute novamente o script SQL das políticas RLS
- ✅ Verifique se o usuário está autenticado (`auth.uid()` não é nulo)
- ✅ Confirme que a estrutura de pastas está correta: `avatars/${userId}/...`

### URLs públicas não funcionam

- ✅ Certifique-se de que o bucket é público
- ✅ Verifique se a política "Anyone can view avatars" foi criada
- ✅ Confirme que está usando `getPublicUrl()` no código

## 📝 Notas Importantes

1. **Segurança:**
   - As políticas RLS garantem que usuários só possam modificar seus próprios avatares
   - A visualização é pública para permitir exibição de imagens

2. **Estrutura de Pastas:**
   - A estrutura `avatars/${userId}/` é **obrigatória** para as políticas funcionarem
   - Não altere a estrutura sem atualizar as políticas RLS

3. **Limites:**
   - Tamanho máximo: 2 MB (configurável no bucket)
   - Tipos permitidos: Imagens (`image/*`)

4. **Backup:**
   - O Supabase Storage não faz backup automático
   - Considere implementar backup manual para avatares importantes

## 🔗 Links Úteis

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Storage API Reference](https://supabase.com/docs/reference/javascript/storage)

## ✅ Checklist de Configuração

- [ ] Bucket `avatars` criado e configurado como público
- [ ] Limite de tamanho configurado (2 MB)
- [ ] Políticas RLS criadas via SQL Editor
- [ ] Política de INSERT para upload própria pasta
- [ ] Política de UPDATE para atualizar própria pasta
- [ ] Política de DELETE para deletar própria pasta
- [ ] Política de SELECT pública para visualização
- [ ] Código usando estrutura `avatars/${userId}/${fileName}`
- [ ] Teste de upload realizado com sucesso
- [ ] URLs públicas funcionando para visualização

## 🧪 Testar Configuração

1. **Login:**
   - Faça login na aplicação

2. **Acessar perfil:**
   - Vá para `/profile`

3. **Upload de avatar:**
   - Clique em "Alterar Foto"
   - Selecione uma imagem (max 2 MB)
   - Confirme que o upload funciona sem erros

4. **Verificar no Storage:**
   - Vá para **Storage** → **Buckets** → `avatars`
   - Você deve ver uma pasta com o ID do usuário
   - Dentro da pasta, deve estar o arquivo de avatar

5. **Verificar exibição:**
   - O avatar deve aparecer na página de perfil
   - A URL da imagem deve ser pública e acessível
