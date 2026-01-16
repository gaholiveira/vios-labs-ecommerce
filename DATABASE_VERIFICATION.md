# 🔍 Guia de Verificação do Banco de Dados

## 📋 Como Garantir que o Banco está Completamente Adaptado

### ✅ Solução para o Erro "column created_at does not exist"

O erro ocorre quando a tabela `profiles` já existe mas não tem as colunas `created_at` ou `updated_at`, e o trigger tenta usar essas colunas.

**Solução:** Use o script `database_setup_final.sql` que:
1. ✅ Cria as colunas se não existirem
2. ✅ Atualiza valores NULL existentes
3. ✅ Cria triggers apenas após garantir que tudo existe
4. ✅ Inclui verificação final

---

## 🚀 Passo a Passo para Adaptar o Banco

### 1. **Execute o Script SQL Final**

Execute `database_setup_final.sql` no SQL Editor do Supabase:

```sql
-- O script está em: database_setup_final.sql
-- Copie e cole todo o conteúdo no SQL Editor do Supabase
```

**O script faz automaticamente:**
- ✅ Cria tabelas se não existirem
- ✅ Adiciona colunas faltantes se a tabela já existir
- ✅ Atualiza valores NULL
- ✅ Cria triggers apenas após garantir que tudo está pronto
- ✅ Verifica se tudo foi configurado corretamente

---

### 2. **Verifique a Execução**

Após executar, você deve ver uma mensagem no final:

```
NOTICE: ✓ Configuração do banco de dados concluída com sucesso!
```

Se houver erros, eles serão exibidos no console do Supabase.

---

### 3. **Verificação Manual (Opcional)**

Execute estas queries para verificar:

#### **Verificar estrutura da tabela profiles:**

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;
```

**Deve ter as colunas:**
- `id` (UUID)
- `full_name` (TEXT)
- `phone` (TEXT)
- `address_street` (TEXT)
- `address_city` (TEXT)
- `address_postcode` (TEXT)
- `address_country` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE) ⚠️ **Importante!**
- `updated_at` (TIMESTAMP WITH TIME ZONE) ⚠️ **Importante!**

#### **Verificar se o trigger existe:**

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**Deve retornar 1 linha** com o trigger.

#### **Verificar se a função existe:**

```sql
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

**Deve retornar 1 linha** com a função.

#### **Verificar políticas RLS:**

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'profiles';
```

**Deve retornar 3 políticas:**
- `Users can view own profile`
- `Users can insert own profile`
- `Users can update own profile`

---

### 4. **Testar o Sistema**

#### **Teste 1: Criar um usuário**

1. Crie uma conta nova no seu app
2. Verifique no Supabase Dashboard → Authentication → Users
3. Verifique no Supabase Dashboard → Table Editor → `profiles`
4. O perfil deve ser criado automaticamente pelo trigger

#### **Teste 2: Verificar se o perfil foi criado**

Execute no SQL Editor:

```sql
SELECT * FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;
```

**Verifique:**
- ✅ `created_at` não é NULL
- ✅ `updated_at` não é NULL
- ✅ `address_country` é 'Brasil'
- ✅ `id` corresponde a um usuário em `auth.users`

#### **Teste 3: Verificar RLS**

Execute como usuário autenticado (via API ou aplicação):

```sql
-- Isso só funciona se você estiver autenticado
SELECT * FROM public.profiles WHERE id = auth.uid();
```

**Deve retornar:**
- ✅ Apenas o perfil do usuário logado
- ✅ Não deve retornar perfis de outros usuários

---

### 5. **Problemas Comuns e Soluções**

#### ❌ **Erro: "column created_at does not exist"**

**Causa:** A tabela `profiles` existe mas não tem as colunas `created_at` ou `updated_at`.

**Solução:**
```sql
-- Execute no SQL Editor
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

-- Atualizar registros existentes
UPDATE public.profiles 
SET created_at = TIMEZONE('utc'::text, NOW())
WHERE created_at IS NULL;

UPDATE public.profiles 
SET updated_at = TIMEZONE('utc'::text, NOW())
WHERE updated_at IS NULL;
```

#### ❌ **Erro: "trigger already exists"**

**Causa:** O trigger já existe de uma execução anterior.

**Solução:** O script `database_setup_final.sql` já remove triggers existentes antes de criar. Mas se quiser fazer manualmente:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_orders ON public.orders;
```

Depois execute o script completo novamente.

#### ❌ **Erro: "permission denied"**

**Causa:** As políticas RLS estão bloqueando o acesso.

**Solução:** 
1. Verifique se você está autenticado
2. Verifique se `auth.uid()` corresponde ao `user_id`
3. Verifique se as políticas foram criadas corretamente

---

### 6. **Script de Verificação Completa**

Execute este script para verificar tudo:

```sql
-- Verificação completa do banco de dados
DO $$ 
DECLARE
  v_table_exists BOOLEAN;
  v_cols_exist BOOLEAN;
  v_trigger_exists BOOLEAN;
  v_function_exists BOOLEAN;
  v_policies_exist BOOLEAN;
BEGIN
  -- Verificar se a tabela profiles existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) INTO v_table_exists;

  -- Verificar se as colunas created_at e updated_at existem
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name IN ('created_at', 'updated_at')
    GROUP BY table_name
    HAVING COUNT(*) = 2
  ) INTO v_cols_exist;

  -- Verificar se o trigger existe
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) INTO v_trigger_exists;

  -- Verificar se a função existe
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user'
  ) INTO v_function_exists;

  -- Verificar se as políticas RLS existem
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname IN (
      'Users can view own profile',
      'Users can insert own profile',
      'Users can update own profile'
    )
    GROUP BY tablename
    HAVING COUNT(*) = 3
  ) INTO v_policies_exist;

  -- Mostrar resultados
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICAÇÃO DO BANCO DE DADOS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tabela profiles existe: %', v_table_exists;
  RAISE NOTICE 'Colunas created_at e updated_at existem: %', v_cols_exist;
  RAISE NOTICE 'Trigger on_auth_user_created existe: %', v_trigger_exists;
  RAISE NOTICE 'Função handle_new_user existe: %', v_function_exists;
  RAISE NOTICE 'Políticas RLS existem (3): %', v_policies_exist;
  RAISE NOTICE '========================================';

  IF v_table_exists AND v_cols_exist AND v_trigger_exists AND v_function_exists AND v_policies_exist THEN
    RAISE NOTICE '✅ TUDO CONFIGURADO CORRETAMENTE!';
  ELSE
    RAISE WARNING '⚠️ ALGUMAS CONFIGURAÇÕES ESTÃO FALTANDO. Execute database_setup_final.sql';
  END IF;
END $$;
```

---

## 📝 Checklist Final

Antes de considerar o banco completamente adaptado, verifique:

- [ ] Tabela `profiles` existe
- [ ] Tabela `profiles` tem colunas `created_at` e `updated_at`
- [ ] Tabela `profiles` tem coluna `address_country` com padrão 'Brasil'
- [ ] Trigger `on_auth_user_created` existe
- [ ] Função `handle_new_user` existe
- [ ] 3 políticas RLS existem na tabela `profiles`
- [ ] RLS está habilitado em todas as tabelas
- [ ] Índices foram criados
- [ ] Teste de criação de usuário funciona
- [ ] Perfil é criado automaticamente ao criar usuário

---

## 🎯 Resumo

Para garantir que o banco está completamente adaptado:

1. ✅ **Execute `database_setup_final.sql`** - Ele faz tudo automaticamente
2. ✅ **Verifique a mensagem de sucesso** - Deve aparecer "✓ Configuração concluída"
3. ✅ **Teste criando um usuário** - Verifique se o perfil é criado automaticamente
4. ✅ **Execute o script de verificação** (opcional) - Para confirmar tudo

O script `database_setup_final.sql` é **completamente idempotente** - você pode executá-lo quantas vezes quiser sem causar problemas!
