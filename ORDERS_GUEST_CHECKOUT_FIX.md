# 🔧 Correção: Pedidos não aparecem no Supabase (Guest Checkout)

## 🐛 Problema Identificado

Ao fazer um pedido teste em produção com **checkout de convidado** (guest checkout), o pedido não aparece na tabela `orders` do Supabase.

## 🔍 Causa Raiz

O schema atual da tabela `orders` **não suporta guest checkout**:

1. ❌ `user_id` é `NOT NULL` (obrigatório)
2. ❌ Não existe coluna `customer_email`
3. ❌ Não existe coluna `stripe_session_id`

Mas o webhook do Stripe tenta:
- Inserir `user_id: null` (para guest checkout) → **FALHA** (viola NOT NULL)
- Inserir `customer_email` → **FALHA** (coluna não existe)
- Inserir `stripe_session_id` → **FALHA** (coluna não existe)

## ✅ Solução

Execute o script SQL `FIX_ORDERS_GUEST_CHECKOUT.sql` no Supabase para atualizar o schema.

### Passo a Passo

1. **Acesse o Supabase Dashboard**
   - Vá em [app.supabase.com](https://app.supabase.com)
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Menu lateral → **SQL Editor**
   - Clique em **New Query**

3. **Execute o Script**
   - Abra o arquivo `FIX_ORDERS_GUEST_CHECKOUT.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em **Run** (ou `Ctrl+Enter` / `Cmd+Enter`)

4. **Verificar Resultado**
   - O script mostrará estatísticas dos pedidos
   - Verifique se não há erros

## 📋 O que o Script Faz

1. ✅ Torna `user_id` opcional (nullable) - permite guest checkout
2. ✅ Adiciona coluna `customer_email` - obrigatória para guest checkout
3. ✅ Adiciona coluna `stripe_session_id` - para rastreamento e evitar duplicatas
4. ✅ Cria índices para performance
5. ✅ Adiciona constraint para garantir que sempre temos `user_id` OU `customer_email`
6. ✅ Preenche `customer_email` em pedidos antigos que têm `user_id`

## 🔍 Verificações Pós-Correção

### 1. Verificar Schema
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

Deve mostrar:
- `user_id`: `uuid`, `YES` (nullable)
- `customer_email`: `text`, `YES` (nullable, mas constraint garante que pelo menos um existe)
- `stripe_session_id`: `text`, `YES` (nullable)

### 2. Verificar Pedidos Existentes
```sql
SELECT 
  id,
  user_id,
  customer_email,
  stripe_session_id,
  status,
  total_amount,
  created_at
FROM public.orders
ORDER BY created_at DESC
LIMIT 10;
```

### 3. Testar Webhook

Após executar o script, faça um novo pedido teste:
1. Faça checkout como convidado (sem login)
2. Use um email válido
3. Complete o pagamento
4. Verifique se o pedido aparece na tabela `orders`

## 🚨 Possíveis Erros Adicionais

### Erro 1: Webhook não está sendo chamado
**Sintoma**: Pedido não aparece mesmo após correção do schema

**Verificar**:
1. Dashboard Stripe → **Developers** → **Webhooks**
2. Verifique se o endpoint está configurado: `https://seu-dominio.com/api/webhooks/stripe`
3. Verifique se o webhook está recebendo eventos `checkout.session.completed`
4. Verifique os logs do webhook no Stripe Dashboard

### Erro 2: STRIPE_WEBHOOK_SECRET incorreto
**Sintoma**: Webhook retorna erro 400 "Webhook signature verification failed"

**Solução**:
1. Dashboard Stripe → **Developers** → **Webhooks**
2. Clique no webhook
3. Copie o **Signing secret**
4. Adicione na Vercel como `STRIPE_WEBHOOK_SECRET`

### Erro 3: SUPABASE_SERVICE_ROLE_KEY incorreto
**Sintoma**: Webhook retorna erro ao criar pedido

**Solução**:
1. Dashboard Supabase → **Settings** → **API**
2. Copie o **service_role key** (não o anon key!)
3. Adicione na Vercel como `SUPABASE_SERVICE_ROLE_KEY`

### Erro 4: Políticas RLS bloqueando inserção
**Sintoma**: Webhook retorna erro de permissão

**Solução**:
O webhook usa `SUPABASE_SERVICE_ROLE_KEY` que **bypassa RLS**. Se ainda houver erro, verifique:
1. Se a chave está correta
2. Se o cliente Supabase está usando `serviceRoleKey` e não `anonKey`

## 📝 Checklist de Verificação

- [ ] Script `FIX_ORDERS_GUEST_CHECKOUT.sql` executado com sucesso
- [ ] Tabela `orders` tem `user_id` nullable
- [ ] Tabela `orders` tem coluna `customer_email`
- [ ] Tabela `orders` tem coluna `stripe_session_id`
- [ ] Índices criados corretamente
- [ ] Constraint `check_user_or_email` criada
- [ ] `STRIPE_WEBHOOK_SECRET` configurado na Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado na Vercel
- [ ] Webhook configurado no Stripe Dashboard
- [ ] Teste de pedido guest checkout realizado
- [ ] Pedido aparece na tabela `orders`

## 🔗 Arquivos Relacionados

- `FIX_ORDERS_GUEST_CHECKOUT.sql` - Script de correção do schema
- `src/app/api/webhooks/stripe/route.ts` - Webhook que processa pedidos
- `src/app/api/checkout/route.ts` - Criação da sessão de checkout
- `GUEST_CHECKOUT_FLOW.md` - Documentação completa do fluxo

## 📞 Próximos Passos

Após executar o script:
1. Faça um novo pedido teste
2. Verifique os logs do webhook no Stripe Dashboard
3. Verifique os logs da Vercel (se disponível)
4. Verifique se o pedido aparece na tabela `orders`

Se o problema persistir, verifique os logs detalhados do webhook para identificar o erro exato.
