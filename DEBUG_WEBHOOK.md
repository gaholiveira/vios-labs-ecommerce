# 🐛 Debug: Pedido não aparece no Supabase

## ✅ O que está funcionando

Pelos logs, confirmamos que:
- ✅ Checkout API está funcionando
- ✅ Cálculo de frete está correto
- ✅ Reserva de estoque está funcionando
- ✅ Sessão do Stripe foi criada

## ❌ O que pode estar falhando

O pedido não aparece no Supabase, o que indica que o **webhook do Stripe não está processando** o evento `checkout.session.completed`.

## 🔍 Verificações Necessárias

### 1. Verificar se o Schema foi Atualizado

Execute este SQL no Supabase para verificar:

```sql
-- Verificar estrutura da tabela orders
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Deve mostrar:**
- `user_id`: `uuid`, `YES` (nullable) ✅
- `customer_email`: `text`, `YES` (nullable) ✅
- `stripe_session_id`: `text`, `YES` (nullable) ✅

**Se não mostrar essas colunas**, execute o script `FIX_ORDERS_GUEST_CHECKOUT.sql`.

### 2. Verificar Logs do Webhook no Stripe

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá em **Developers** → **Webhooks**
3. Clique no webhook configurado
4. Veja a aba **Events**
5. Procure pelo evento `checkout.session.completed` do seu pedido teste
6. Clique no evento para ver detalhes

**O que verificar:**
- ✅ Evento foi recebido pelo Stripe?
- ✅ Status do evento (200 = sucesso, 4xx/5xx = erro)
- ✅ Resposta do webhook (ver mensagem de erro se houver)

### 3. Verificar Configuração do Webhook

No Stripe Dashboard → Webhooks → Seu Webhook:

**Endpoint URL:**
```
https://vioslabs.com.br/api/webhooks/stripe
```

**Eventos habilitados:**
- ✅ `checkout.session.completed` (obrigatório)

**Signing secret:**
- Deve estar configurado na Vercel como `STRIPE_WEBHOOK_SECRET`

### 4. Verificar Variáveis de Ambiente na Vercel

Na Vercel, verifique se estão configuradas:

- ✅ `STRIPE_SECRET_KEY` - Chave secreta do Stripe
- ✅ `STRIPE_WEBHOOK_SECRET` - Signing secret do webhook (do Stripe Dashboard)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - URL do Supabase
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service role key (não anon key!)

### 5. Verificar Logs da Vercel (se disponível)

1. Acesse Vercel Dashboard
2. Seu projeto → **Functions**
3. Procure por `/api/webhooks/stripe`
4. Veja os logs de execução

**Procure por:**
- Erros de validação de assinatura
- Erros ao criar pedido no Supabase
- Erros de schema (coluna não existe)

## 🧪 Teste Manual do Webhook

Se quiser testar manualmente, você pode usar o Stripe CLI:

```bash
# Instalar Stripe CLI
# https://stripe.com/docs/stripe-cli

# Fazer login
stripe login

# Escutar eventos localmente (desenvolvimento)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Ou testar um evento específico
stripe trigger checkout.session.completed
```

## 📋 Checklist de Debug

- [ ] Schema da tabela `orders` foi atualizado (tem `customer_email` e `stripe_session_id`)
- [ ] Webhook está configurado no Stripe Dashboard
- [ ] Endpoint URL está correto: `https://vioslabs.com.br/api/webhooks/stripe`
- [ ] Evento `checkout.session.completed` está habilitado
- [ ] `STRIPE_WEBHOOK_SECRET` está configurado na Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` está configurado na Vercel
- [ ] Evento aparece nos logs do Stripe Dashboard
- [ ] Status do evento no Stripe (200 = sucesso)
- [ ] Logs da Vercel mostram execução do webhook

## 🔧 Próximos Passos

1. **Execute o script SQL** `FIX_ORDERS_GUEST_CHECKOUT.sql` se ainda não executou
2. **Verifique os logs do webhook** no Stripe Dashboard
3. **Compartilhe o erro específico** que aparece nos logs do Stripe
4. **Verifique se o evento foi recebido** pelo Stripe

## 💡 Dica

Se o evento não aparece no Stripe Dashboard, pode ser que:
- O webhook não está configurado
- O endpoint está incorreto
- O webhook foi desabilitado

Se o evento aparece mas com erro (status 4xx/5xx):
- Verifique a mensagem de erro específica
- Pode ser problema de schema (execute o script SQL)
- Pode ser problema de variáveis de ambiente
- Pode ser problema de permissões RLS

## 📞 Informações para Debug

Compartilhe:
1. Status do evento no Stripe Dashboard (200, 400, 500, etc.)
2. Mensagem de erro específica (se houver)
3. Resultado da query SQL de verificação do schema
4. Se o evento aparece nos logs do Stripe

Com essas informações, posso ajudar a identificar o problema exato!
