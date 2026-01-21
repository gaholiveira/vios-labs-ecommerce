# 🔍 Diagnóstico: Pedidos não Salvos no Supabase

## ⚠️ Problema Reportado
Pedido de teste realizado, mas não foi salvo no Supabase.

---

## 📋 Checklist de Diagnóstico

### 1. ✅ Verificar se o Checkout foi Concluído

**Passos:**
1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/test/payments)
2. Verifique se o pagamento aparece na lista
3. Confirme o status do pagamento

**Status Esperado:** `succeeded` ou `complete`

---

### 2. 🔐 Verificar Configuração do Webhook no Stripe

**O webhook está configurado no Stripe?**

#### Para Desenvolvimento Local:
```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Fazer login
stripe login

# Escutar webhooks localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**IMPORTANTE:** O Stripe CLI irá fornecer um `whsec_...` que você deve adicionar como `STRIPE_WEBHOOK_SECRET` no `.env.local`

#### Para Produção (Vercel):
1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em **"Add endpoint"**
3. Configure:
   - **URL do Endpoint:** `https://vioslabs.com.br/api/webhooks/stripe`
   - **Eventos a escutar:**
     - ✅ `checkout.session.completed`
     - ✅ `payment_intent.succeeded`
4. Copie o **Signing Secret** (começa com `whsec_...`)
5. Adicione nas variáveis de ambiente da Vercel:
   - Nome: `STRIPE_WEBHOOK_SECRET`
   - Valor: `whsec_xxxxx...`

---

### 3. 🔑 Verificar Variáveis de Ambiente

Verifique se todas as variáveis necessárias estão configuradas:

```bash
# .env.local (desenvolvimento)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

**Como verificar:**
```bash
# No terminal do projeto
echo $STRIPE_WEBHOOK_SECRET
echo $SUPABASE_SERVICE_ROLE_KEY
```

---

### 4. 📊 Verificar Logs do Webhook

#### Desenvolvimento Local:
```bash
# Verificar logs no terminal onde o dev server está rodando
# Procure por:
# ❌ Error messages
# ✅ Success messages
```

#### Produção (Vercel):
```bash
# Via Vercel CLI
vercel logs --follow

# Ou acesse: https://vercel.com/seu-projeto/logs
```

#### Stripe Dashboard:
1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique no seu endpoint
3. Verifique a aba **"Events"**
4. Procure pelo evento `checkout.session.completed`
5. Verifique o **Response** (deve ser `200 OK`)

---

### 5. 🗄️ Verificar Tabela do Supabase

**Verificar manualmente se o pedido existe:**

```sql
-- No SQL Editor do Supabase
SELECT * FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar por session_id específico
SELECT * FROM orders 
WHERE stripe_session_id = 'cs_test_xxxxx';
```

---

### 6. 🔍 Possíveis Causas e Soluções

#### Causa 1: Webhook Não Configurado
**Sintoma:** Pagamento aparece no Stripe, mas webhook não é chamado

**Solução:**
- Configure o webhook no Stripe Dashboard (Produção)
- Use Stripe CLI (Desenvolvimento)

---

#### Causa 2: STRIPE_WEBHOOK_SECRET Incorreto
**Sintoma:** Erro `Webhook signature verification failed`

**Solução:**
```bash
# Verifique se o secret está correto
# Desenvolvimento: Use o secret do Stripe CLI
# Produção: Use o secret do Stripe Dashboard
```

---

#### Causa 3: SUPABASE_SERVICE_ROLE_KEY Incorreto
**Sintoma:** Erro ao criar pedido no Supabase

**Solução:**
1. Acesse: Supabase Dashboard → Settings → API
2. Copie **Service Role Key** (⚠️ Nunca exponha no client!)
3. Atualize no `.env.local` ou Vercel

---

#### Causa 4: RLS (Row Level Security) Bloqueando Inserção
**Sintoma:** Webhook retorna erro de permissão

**Solução:**
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies 
WHERE tablename IN ('orders', 'order_items');

-- Se necessário, criar política para service_role
-- (O service_role já deve ter acesso total por padrão)
```

---

#### Causa 5: Tabela `orders` Não Existe ou Estrutura Incorreta
**Sintoma:** Erro `relation "orders" does not exist`

**Solução:**
```sql
-- Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('orders', 'order_items');

-- Se não existir, rodar o script de setup do banco
```

---

## 🚀 Teste Rápido de Webhook

### Teste Manual via Stripe CLI:

```bash
# 1. Disparar um evento de teste
stripe trigger checkout.session.completed

# 2. Verificar os logs do webhook
# Deve aparecer no terminal do dev server

# 3. Verificar no Supabase se o pedido foi criado
```

---

## 📞 Debug Avançado

### Adicionar Logs Temporários no Webhook

Edite: `src/app/api/webhooks/stripe/route.ts`

```typescript
export async function POST(req: NextRequest) {
  console.log('🔔 Webhook received!');
  
  try {
    const body = await req.text();
    console.log('📦 Body length:', body.length);
    
    const signature = req.headers.get('stripe-signature');
    console.log('✍️ Signature present:', !!signature);
    
    // ... resto do código
  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error);
    // ... resto do código
  }
}
```

---

## ✅ Checklist Final

- [ ] Webhook está configurado no Stripe Dashboard (Produção)
- [ ] Stripe CLI está rodando (Desenvolvimento Local)
- [ ] `STRIPE_WEBHOOK_SECRET` está correto no `.env.local`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` está correto
- [ ] Tabelas `orders` e `order_items` existem no Supabase
- [ ] Logs do webhook não mostram erros
- [ ] Evento `checkout.session.completed` está sendo enviado pelo Stripe

---

## 🆘 Ainda Não Funciona?

**Compartilhe as seguintes informações:**

1. **Logs do webhook** (últimas 20 linhas)
2. **Response do Stripe** (no Dashboard → Webhooks → Events)
3. **Erro específico** (se houver)
4. **Ambiente** (desenvolvimento local ou produção)
5. **Output de:**
   ```bash
   stripe listen --print-secret
   ```

---

## 📚 Recursos Adicionais

- [Documentação Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Supabase Service Role](https://supabase.com/docs/guides/api#the-service_role-key)
