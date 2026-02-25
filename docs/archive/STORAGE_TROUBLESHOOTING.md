# 🔧 Troubleshooting - Erro de Permissão no Upload de Avatar

Se você está recebendo o erro **"Erro de permissão. Verifique se o bucket está configurado corretamente e as políticas RLS estão ativas."**, siga este guia passo a passo.

## ✅ Checklist de Verificação

### 1. Verificar se o Bucket Existe

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Vá para **Storage** → **Buckets**
3. Verifique se existe um bucket chamado **`avatars`** (exatamente assim, minúsculas)
4. Se não existir, crie:
   - Clique em **New bucket**
   - **Name:** `avatars`
   - **Public bucket:** ✅ **MARCADO** (obrigatório)
   - **File size limit:** 2 MB
   - Clique em **Create bucket**

### 2. Verificar se o Bucket é Público

1. No **Storage** → **Buckets**, clique no bucket `avatars`
2. Verifique se a opção **Public bucket** está **ativada**
3. Se não estiver, ative e salve

### 3. Verificar se as Políticas RLS Foram Criadas

1. No Dashboard, vá para **Storage** → **Policies**
2. Você deve ver **4 políticas** para o bucket `avatars`:
   - ✅ **Users can upload own avatars** (INSERT)
   - ✅ **Users can update own avatars** (UPDATE)
   - ✅ **Users can delete own avatars** (DELETE)
   - ✅ **Anyone can view avatars** (SELECT)

Se não ver todas as 4 políticas, execute o script SQL novamente.

### 4. Executar o Script SQL das Políticas

1. Acesse o **SQL Editor** no Dashboard
2. Abra o arquivo `storage_policies.sql`
3. **Copie TODO o conteúdo** do arquivo
4. Cole no SQL Editor
5. Clique em **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
6. Verifique se apareceu a mensagem de sucesso

### 5. Verificar a Estrutura de Pastas no Código

O código deve salvar os arquivos na estrutura:
```
avatars/{userId}/{fileName}
```

**Verifique no código** (`src/app/profile/page.tsx` linha 121):
```typescript
const filePath = `avatars/${user.id}/${fileName}`;
```

Se estiver diferente, corrija para essa estrutura.

## 🔍 Diagnóstico Avançado

### Verificar Erro Específico no Console

1. Abra o Console do navegador (F12)
2. Tente fazer upload de uma imagem
3. Procure por erros no console
4. O erro deve mostrar detalhes como:
   - `new row violates row-level security policy`
   - `permission denied`
   - `bucket not found`

### Testar Manualmente no Supabase

1. No Dashboard, vá para **Storage** → **avatars**
2. Tente criar uma pasta manualmente com o ID do seu usuário
3. Se não conseguir, pode ser um problema de permissão mais profundo

### Verificar se o Usuário Está Autenticado

1. No Console do navegador, execute:
```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);
```

2. Se `user` for `null`, você não está autenticado
3. Faça login novamente e tente o upload

## 🛠️ Soluções Comuns

### Solução 1: Recriar as Políticas

1. No **SQL Editor**, execute:
```sql
-- Remover todas as políticas do Storage
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
```

2. Depois execute o script completo de `storage_policies.sql` novamente

### Solução 2: Verificar se RLS está Habilitado no Storage

Por padrão, o Storage tem RLS habilitado. Mas vamos verificar:

1. No Dashboard, vá para **Storage** → **Policies**
2. Verifique se há uma mensagem sobre RLS estar desabilitado
3. Se estiver desabilitado, habilite

**Nota:** O Supabase Storage sempre tem RLS ativo, não é possível desabilitar.

### Solução 3: Criar Políticas Mais Permissivas (Temporário para Teste)

**⚠️ ATENÇÃO:** Isso é apenas para teste. Use políticas mais restritivas em produção.

```sql
-- Política temporária para teste (permissiva demais)
DROP POLICY IF EXISTS "Test: Allow authenticated uploads" ON storage.objects;

CREATE POLICY "Test: Allow authenticated uploads"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');
```

Se isso funcionar, o problema é nas políticas específicas. Volte para as políticas corretas.

### Solução 4: Verificar o ID do Usuário

A política valida que `(storage.foldername(name))[1] = auth.uid()::text`

Isso significa que a primeira pasta deve ser exatamente o ID do usuário.

**Exemplo:**
- ✅ Correto: `avatars/123e4567-e89b-12d3-a456-426614174000/image.jpg`
- ❌ Errado: `avatars/image.jpg` (sem pasta do usuário)
- ❌ Errado: `avatars/user-123/image.jpg` (ID diferente)

## 📝 Checklist Final

Antes de reportar o problema, confirme:

- [ ] Bucket `avatars` existe e é público
- [ ] 4 políticas RLS foram criadas no Storage
- [ ] Script SQL foi executado sem erros
- [ ] Usuário está autenticado (logado)
- [ ] Código usa estrutura `avatars/${user.id}/${fileName}`
- [ ] Console do navegador mostra erro específico
- [ ] Tentou recriar as políticas
- [ ] Tentou fazer logout e login novamente

## 🔗 Links Úteis

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Storage API Reference](https://supabase.com/docs/reference/javascript/storage)

## 📞 Ainda com Problemas?

Se após seguir todos os passos o erro persistir, colete:

1. **Erro completo do console** (F12 → Console)
2. **ID do usuário** (exibido no console)
3. **Nome exato do bucket** (deve ser `avatars`)
4. **Screenshot das políticas** (Storage → Policies)
5. **Screenshot da configuração do bucket** (deve estar público)

Com essas informações, podemos identificar o problema específico.
