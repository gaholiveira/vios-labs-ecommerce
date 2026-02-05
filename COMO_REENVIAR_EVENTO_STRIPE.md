# 🔄 Como Reenviar Evento do Stripe para Testar

## ✅ Sim, você pode reenviar eventos!

O Stripe permite reenviar eventos que falharam ou testar eventos específicos.

## 📋 Passo a Passo

### Opção 1: Reenviar Evento que Falhou

1. **Acesse o Stripe Dashboard**
   - Vá em [dashboard.stripe.com](https://dashboard.stripe.com)
   - Faça login

2. **Navegue até Webhooks**
   - Menu lateral → **Developers** → **Webhooks**
   - Clique no webhook configurado

3. **Veja os Eventos**
   - Aba **Events** (ou clique em "View events")
   - Procure pelo evento `checkout.session.completed` que falhou
   - Eventos com erro aparecem com status vermelho (4xx, 5xx, ou 307)

4. **Reenviar o Evento**
   - Clique no evento que falhou
   - No topo da página, clique em **"Replay event"** ou **"Send again"**
   - O Stripe vai tentar enviar o evento novamente para seu webhook

### Opção 2: Enviar Evento de Teste

1. **Acesse Webhooks**
   - Dashboard → **Developers** → **Webhooks**
   - Clique no webhook

2. **Enviar Teste**
   - Clique no botão **"Send test webhook"** (ou ícone de teste)
   - Selecione o evento: **`checkout.session.completed`**
   - Clique em **"Send test webhook"**

3. **Verificar Resultado**
   - O Stripe vai mostrar o status da requisição
   - ✅ **200** = Sucesso
   - ❌ **307** = Ainda há problema de URL/redirect
   - ❌ **4xx/5xx** = Outro erro (ver mensagem)

## ⚠️ Importante

### Eventos Reais vs Testes

- **Eventos Reais**: São eventos de pedidos reais que já aconteceram
  - Reenviar um evento real pode criar **pedidos duplicados** se não houver verificação de duplicatas
  - O código já tem proteção contra duplicatas (verifica `stripe_session_id`)

- **Eventos de Teste**: São eventos simulados
  - Não criam pedidos reais
  - Úteis para testar se o webhook está funcionando

## 🧪 Teste Recomendado

Para testar sem risco:

1. **Use "Send test webhook"** primeiro
   - Isso testa se o webhook está funcionando
   - Não cria pedidos reais

2. **Se o teste funcionar (200)**, então:
   - Faça um novo pedido teste real
   - Ou reenvie um evento real que falhou

## 🔍 Verificar se Funcionou

Após reenviar o evento:

1. **Verifique no Stripe**
   - Veja se o status mudou para **200** (sucesso)
   - Veja a resposta do webhook

2. **Verifique no Supabase**
   - Acesse a tabela `orders`
   - Procure pelo pedido criado
   - Verifique se tem `customer_email` e `stripe_session_id`

## ⚠️ Cuidado com Duplicatas

O código já tem proteção:

```typescript
// Verifica se já existe pedido com esse stripe_session_id
const { data: existingOrder } = await supabaseAdmin
  .from('orders')
  .select('id')
  .eq('stripe_session_id', session.id)
  .maybeSingle();

if (existingOrder) {
  // Pedido já existe - evitar duplicatas
  return;
}
```

Mas se você reenviar o mesmo evento múltiplas vezes, pode criar múltiplas tentativas. O código deve prevenir duplicatas, mas é melhor testar com eventos de teste primeiro.

## 📝 Checklist

Antes de reenviar:

- [ ] Schema da tabela `orders` foi atualizado (tem `customer_email` e `stripe_session_id`)
- [ ] Middleware não interfere mais no webhook (código atualizado)
- [ ] URL do webhook está correta (sem trailing slash, HTTPS)
- [ ] Variáveis de ambiente estão configuradas na Vercel
- [ ] Teste com "Send test webhook" primeiro

## 💡 Dica

Se você reenviar um evento real e ele criar um pedido duplicado (improvável devido à proteção), você pode:

1. Verificar na tabela `orders` se há duplicatas
2. Deletar manualmente pedidos duplicados no Supabase
3. Ou adicionar uma verificação adicional no código

Mas o código atual já deve prevenir isso! ✅
