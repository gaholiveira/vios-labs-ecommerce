# 🔧 Correção: Erro 307 no Webhook do Stripe

## 🐛 Problema

O webhook do Stripe está retornando erro **307 (Temporary Redirect)**.

## 🔍 Causas Comuns

### 1. **URL com Trailing Slash**
O Stripe pode estar enviando para `/api/webhooks/stripe/` (com barra final) e o Next.js está redirecionando.

**Solução**: Configure a URL no Stripe **sem trailing slash**:
```
✅ https://vioslabs.com.br/api/webhooks/stripe
❌ https://vioslabs.com.br/api/webhooks/stripe/
```

### 2. **HTTP vs HTTPS**
Se a URL estiver configurada como HTTP, o Vercel pode estar redirecionando para HTTPS.

**Solução**: Use sempre HTTPS:
```
✅ https://vioslabs.com.br/api/webhooks/stripe
❌ http://vioslabs.com.br/api/webhooks/stripe
```

### 3. **Redirecionamento do Next.js**
O Next.js pode estar redirecionando requisições GET para a rota.

**Solução**: Já adicionamos um handler GET que retorna 405 (Method Not Allowed).

## ✅ Correções Aplicadas

1. ✅ Adicionado handler GET que retorna 405 (previne redirects)
2. ✅ Configuração `runtime = 'nodejs'` mantida
3. ✅ Configuração `dynamic = 'force-dynamic'` mantida

## 🔧 Passos para Corrigir

### 1. Atualizar URL no Stripe Dashboard

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá em **Developers** → **Webhooks**
3. Clique no webhook configurado
4. Clique em **Edit** ou **Settings**
5. Verifique a **Endpoint URL**:

**URL CORRETA:**
```
https://vioslabs.com.br/api/webhooks/stripe
```

**Verifique:**
- ✅ Sem trailing slash (`/` no final)
- ✅ HTTPS (não HTTP)
- ✅ Domínio correto (`vioslabs.com.br`)

6. Salve as alterações

### 2. Testar o Webhook

Após atualizar a URL:

1. No Stripe Dashboard → Webhooks → Seu Webhook
2. Clique em **Send test webhook**
3. Selecione o evento: `checkout.session.completed`
4. Clique em **Send test webhook**
5. Verifique o status:
   - ✅ **200** = Sucesso
   - ❌ **307** = Ainda há problema de URL
   - ❌ **4xx/5xx** = Outro erro (ver mensagem)

### 3. Verificar Logs

Se ainda houver erro 307:

1. Stripe Dashboard → Webhooks → Seu Webhook → **Events**
2. Clique no evento que falhou
3. Veja a **Request URL** que o Stripe tentou usar
4. Compare com a URL configurada

**Possíveis problemas:**
- URL diferente da configurada
- Redirecionamento automático do Vercel
- Problema de DNS

## 🧪 Teste Manual

Você pode testar manualmente usando curl:

```bash
# Teste se a rota está acessível
curl -X POST https://vioslabs.com.br/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Resposta esperada:**
- Se retornar erro de assinatura = Rota está funcionando ✅
- Se retornar 307 = Ainda há problema de URL ❌

## 📋 Checklist

- [ ] URL no Stripe Dashboard está **sem trailing slash**
- [ ] URL usa **HTTPS** (não HTTP)
- [ ] Domínio está correto (`vioslabs.com.br`)
- [ ] Handler GET retorna 405 (código atualizado)
- [ ] Teste de webhook no Stripe retorna 200
- [ ] Eventos reais estão sendo processados

## 🔍 Debug Adicional

Se o erro 307 persistir:

### Verificar Redirecionamentos na Vercel

1. Vercel Dashboard → Seu Projeto → **Settings** → **Domains**
2. Verifique se há redirecionamentos configurados
3. Verifique se o domínio está apontando corretamente

### Verificar Middleware

O middleware do Next.js pode estar interferindo. Verifique `src/middleware.ts`:

```typescript
// O middleware NÃO deve redirecionar requisições para /api/webhooks/stripe
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks/stripe|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Nota**: O matcher já exclui `/api/webhooks/stripe` por padrão, mas verifique se não há outras regras interferindo.

## 💡 Dica

O erro 307 geralmente é resolvido ao:
1. Remover trailing slash da URL
2. Garantir que usa HTTPS
3. Testar o webhook novamente

Se após essas correções o erro persistir, pode ser um problema de configuração do Vercel ou DNS. Nesse caso, verifique os logs da Vercel para mais detalhes.
