# 🔧 Troubleshooting - Erro ao Buscar Pedidos

## ❌ Erro: "permission denied for table users" (Código 42501)

### Causa Provável

Este erro ocorre quando as políticas RLS tentam acessar `auth.users` diretamente, o que não é permitido pelo Supabase por questões de segurança. As políticas RLS não têm permissão para consultar a tabela `auth.users` diretamente.

### ✅ Solução

O script SQL `guest_checkout_association.sql` foi atualizado para usar uma função `SECURITY DEFINER` que pode acessar `auth.users` com as permissões adequadas.

**Execute o script SQL atualizado** `guest_checkout_association.sql` no Supabase.

#### Passo a Passo

1. **Acesse o Supabase Dashboard**
   - Vá para [https://app.supabase.com](https://app.supabase.com)
   - Selecione seu projeto
   - Clique em **SQL Editor** no menu lateral

2. **Execute o Script**
   - Abra o arquivo `guest_checkout_association.sql` do projeto
   - Copie **todo o conteúdo** do arquivo
   - Cole no SQL Editor do Supabase
   - Clique em **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

3. **Verificar Execução**
   - Verifique se a mensagem de sucesso apareceu
   - Se houver erros, verifique se as políticas antigas foram removidas primeiro

### 🔍 Verificar se as Políticas Estão Corretas

Execute esta query no SQL Editor do Supabase para verificar:

```sql
-- Verificar políticas RLS de orders
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'orders';
```

Você deve ver uma política chamada **"Users can view own orders by user_id or email"**.

### 🧪 Testar Após Correção

1. Faça login na aplicação
2. Acesse a página `/orders`
3. Verifique se os pedidos aparecem corretamente

### 🔍 O Que Foi Corrigido

A versão atualizada do script `guest_checkout_association.sql` agora:

1. **Cria função `get_user_email()`**: Função `SECURITY DEFINER` que pode acessar `auth.users`
2. **Usa a função nas políticas**: Substitui o acesso direto por `public.get_user_email()`
3. **Resolve o erro 42501**: Elimina o erro de permissão

### 📝 Outras Possíveis Causas

#### 1. Políticas RLS Não Habilitadas

Verifique se RLS está habilitado:

```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'orders';
```

Se `rowsecurity` for `false`, habilite:

```sql
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
```

#### 2. Função RPC Não Existe

Se a função `associate_my_guest_orders()` não existe, o script SQL precisa ser executado.

Execute o script `guest_checkout_association.sql` que cria essa função.

#### 3. Usuário Não Autenticado

O código verifica autenticação, mas se houver problemas:

- Verifique se o usuário está realmente autenticado
- Verifique se o token de autenticação é válido
- Tente fazer logout e login novamente

#### 4. Estrutura da Tabela Incorreta

Verifique se a tabela `orders` tem os campos necessários:

```sql
-- Verificar estrutura da tabela orders
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
AND table_schema = 'public';
```

Você deve ter:
- ✅ `user_id` (UUID, nullable) - para guest checkout
- ✅ `customer_email` (TEXT, NOT NULL) - obrigatório

### 🐛 Debug Adicional

Se o problema persistir, adicione logs adicionais:

1. Verifique os logs do navegador (Console)
2. Verifique os logs do servidor Next.js
3. Verifique os logs do Supabase Dashboard → Logs → Postgres Logs

### 📚 Arquivos Relacionados

- `guest_checkout_association.sql` - Script SQL para atualizar políticas
- `src/app/orders/page.tsx` - Página de pedidos
- `GUEST_CHECKOUT_FLOW.md` - Documentação completa do fluxo

### ✅ Checklist de Verificação

- [ ] Script `guest_checkout_association.sql` executado no Supabase
- [ ] Política RLS "Users can view own orders by user_id or email" existe
- [ ] RLS habilitado na tabela `orders`
- [ ] Tabela `orders` tem campos `user_id` (nullable) e `customer_email` (NOT NULL)
- [ ] Usuário está autenticado
- [ ] Função `associate_my_guest_orders()` existe

### 🆘 Se Nada Funcionar

1. **Verificar Permissões do Banco**
   - Certifique-se de que o usuário autenticado tem permissões adequadas

2. **Verificar Logs do Supabase**
   - Dashboard → Logs → Postgres Logs
   - Procure por erros relacionados a RLS

3. **Testar Query Diretamente**
   ```sql
   -- Testar se a política funciona (substitua o UUID pelo seu user_id)
   SELECT * FROM public.orders 
   WHERE user_id = 'SEU_USER_ID_AQUI'
   OR (user_id IS NULL AND customer_email = 'SEU_EMAIL_AQUI');
   ```

4. **Verificar se há Pedidos**
   ```sql
   -- Verificar se há pedidos na tabela (como admin)
   SELECT COUNT(*) FROM public.orders;
   ```
