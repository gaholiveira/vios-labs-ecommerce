# 🔧 Correção: Erro de Banco de Dados ao Criar Usuário

## 📋 Problema Identificado

O erro "Database error saving new user" ocorria devido a uma **race condition** entre:
1. O **trigger automático** do banco de dados que cria o perfil quando um usuário é criado
2. O **código da aplicação** que também tentava criar o perfil manualmente

### Causas Raiz:

1. **Conflito de Timing**: O trigger `handle_new_user()` executa imediatamente após a criação do usuário, mas o código também tentava criar o perfil ao mesmo tempo
2. **Constraint Violation**: Tentativa de inserir um perfil que já existe (criado pelo trigger)
3. **Campos Incompletos**: O trigger criava o perfil com dados mínimos, mas o código tentava atualizar com dados completos antes do trigger terminar
4. **Falta de Tratamento de Erro**: Erros eram apenas logados no console, não mostrados ao usuário

## ✅ Solução Implementada

### 1. **Melhorias no Trigger do Banco** (`database_setup.sql`)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, address_country, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address_country', 'Brasil'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- ✅ Evita erro se o perfil já existir
  RETURN NEW;
END;
```

**Melhorias:**
- ✅ Inclui `phone` e `address_country` no trigger
- ✅ Usa `ON CONFLICT DO NOTHING` para evitar erros de duplicação
- ✅ Define "Brasil" como padrão para `address_country`

### 2. **Estratégia de Retry Inteligente** (`register/page.tsx` e `lote-zero/page.tsx`)

```typescript
// Aguardar 500ms para o trigger processar
await new Promise(resolve => setTimeout(resolve, 500));

// Usar UPSERT (atualiza se existe, cria se não existe)
const { error: profileError } = await supabase
  .from('profiles')
  .upsert({
    id: authData.user.id,
    full_name: formData.full_name.trim(),
    phone: phoneNumbers,
    address_country: "Brasil",
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'id' // ✅ Atualiza se já existe
  });
```

**Melhorias:**
- ✅ Aguarda 500ms antes de tentar atualizar (permite o trigger terminar)
- ✅ Usa `upsert` em vez de `insert` (evita conflitos)
- ✅ Retry com delay maior (1500ms) se houver erro
- ✅ Não bloqueia o fluxo se houver erro (perfil já foi criado pelo trigger)

### 3. **Tratamento de Erros Melhorado**

```typescript
if (authError) {
  let errorMessage = authError.message;
  if (authError.message.includes('already registered')) {
    errorMessage = 'Este e-mail já está cadastrado. Tente fazer login.';
  } else if (authError.message.includes('password')) {
    errorMessage = 'A senha não atende aos requisitos de segurança.';
  }
  setError(errorMessage); // ✅ Mostra erro amigável ao usuário
  return;
}
```

**Melhorias:**
- ✅ Mensagens de erro amigáveis e em português
- ✅ Validação se o usuário foi criado antes de continuar
- ✅ Logs detalhados no console para debug
- ✅ Tratamento de exceções genéricas

## 🎯 Fluxo Corrigido

### Antes (Problemático):
```
1. Criar usuário no Supabase Auth
2. Código tenta criar perfil IMEDIATAMENTE
3. Trigger também tenta criar perfil
4. ❌ CONFLITO: Ambos tentam criar ao mesmo tempo
5. Erro de constraint violation
```

### Depois (Corrigido):
```
1. Criar usuário no Supabase Auth
2. Trigger cria perfil automaticamente (com dados básicos)
3. Código aguarda 500ms
4. Código faz UPSERT (atualiza perfil existente)
5. ✅ SUCESSO: Perfil criado/atualizado sem conflitos
```

## 📝 Como Aplicar a Correção

### 1. Atualizar o Trigger no Supabase

Execute no SQL Editor do Supabase:

```sql
-- Atualizar a função do trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, address_country, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address_country', 'Brasil'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Código Já Atualizado

Os arquivos `register/page.tsx` e `lote-zero/page.tsx` já foram atualizados com as correções.

## 🔍 Verificação

Para verificar se está funcionando:

1. **Teste de Criação de Conta:**
   - Crie uma nova conta
   - Verifique se não há erros no console
   - Confirme que o perfil foi criado no banco

2. **Verificar no Supabase:**
   ```sql
   SELECT * FROM profiles 
   WHERE id = 'ID_DO_USUARIO_CRIADO';
   ```

3. **Logs do Console:**
   - Abra o DevTools (F12)
   - Verifique se não há erros relacionados a `profiles`

## 🚀 Benefícios da Solução

1. ✅ **Elimina Race Conditions**: Delay garante que o trigger termine primeiro
2. ✅ **Idempotente**: `ON CONFLICT DO NOTHING` e `upsert` previnem erros de duplicação
3. ✅ **Resiliente**: Retry logic garante que dados sejam salvos mesmo com problemas temporários
4. ✅ **User-Friendly**: Mensagens de erro claras e em português
5. ✅ **Robusto**: Não bloqueia o fluxo se houver erro (perfil já existe)

## 📚 Conceitos Aplicados

- **Race Condition**: Situação onde dois processos tentam modificar o mesmo recurso simultaneamente
- **Idempotência**: Operação que pode ser executada múltiplas vezes sem mudar o resultado
- **UPSERT**: Operação que atualiza se existe, ou insere se não existe
- **Trigger**: Função automática executada pelo banco em eventos específicos
- **Retry Pattern**: Tentar novamente após um delay quando há erro temporário
