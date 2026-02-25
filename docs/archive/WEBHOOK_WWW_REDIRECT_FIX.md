# 🔧 Correção: Erro 307 - Redirect www vs não-www

## 🐛 Problema Identificado

O Stripe está tentando acessar:
```
https://www.vioslabs.com.br/api/webhooks/stripe
```

Mas está sendo redirecionado (erro 307). Isso indica problema de configuração de domínio (www vs não-www).

## 🔍 Análise do Erro

**Resposta do webhook:**
```json
{
  "redirect": "https://www.vioslabs.com.br/api/webhooks/stripe",
  "status": "307"
}
```

Isso significa que:
- O Stripe está enviando para `www.vioslabs.com.br`
- O servidor está redirecionando (provavelmente de www para não-www ou vice-versa)
- O webhook não consegue processar porque está sendo redirecionado

## ✅ Solução

### Opção 1: Configurar URL sem www no Stripe (Recomendado)

1. **Acesse Stripe Dashboard**
   - Vá em [dashboard.stripe.com](https://dashboard.stripe.com)
   - **Developers** → **Webhooks**

2. **Edite o Webhook**
   - Clique no webhook configurado
   - Clique em **"Edit"** ou **"Settings"**

3. **Atualize a Endpoint URL**
   - **URL ANTIGA (com www):**
     ```
     https://www.vioslabs.com.br/api/webhooks/stripe
     ```
   
   - **URL NOVA (sem www):**
     ```
     https://vioslabs.com.br/api/webhooks/stripe
     ```

4. **Salve as alterações**

### Opção 2: Configurar URL com www no Stripe

Se seu domínio redireciona de não-www para www, use:

```
https://www.vioslabs.com.br/api/webhooks/stripe
```

**Mas verifique na Vercel qual é o domínio principal.**

## 🔍 Como Verificar Qual Domínio Usar

### Na Vercel:

1. Acesse [Vercel Dashboard](https://vercel.com)
2. Seu projeto → **Settings** → **Domains**
3. Veja qual domínio está marcado como **Primary**:
   - Se `vioslabs.com.br` (sem www) = use sem www
   - Se `www.vioslabs.com.br` (com www) = use com www

### Teste Manual:

Teste ambas as URLs para ver qual funciona:

```bash
# Teste sem www
curl -X POST https://vioslabs.com.br/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Teste com www
curl -X POST https://www.vioslabs.com.br/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

A que retornar erro de assinatura (não 307) é a correta.

## ⚠️ Importante

**Webhooks NÃO podem ser redirecionados!**

- O Stripe envia requisições POST com corpo raw
- Redirecionamentos (307) perdem o corpo da requisição
- A assinatura do webhook fica inválida após redirect

**Solução:** Use a URL que NÃO redireciona.

## 📋 Checklist

- [ ] Verificar qual domínio é primary na Vercel
- [ ] Atualizar URL do webhook no Stripe para usar o domínio correto
- [ ] Testar webhook novamente
- [ ] Verificar se status mudou de 307 para 200
- [ ] Verificar se pedido aparece no Supabase

## 🧪 Após Corrigir

1. **Reenvie o evento** no Stripe Dashboard
2. **Verifique o status** - deve ser 200 agora
3. **Verifique no Supabase** - pedido deve aparecer na tabela `orders`

## 💡 Dica

Se você não souber qual domínio usar, teste ambos:

1. Configure no Stripe: `https://vioslabs.com.br/api/webhooks/stripe`
2. Envie teste
3. Se ainda der 307, mude para: `https://www.vioslabs.com.br/api/webhooks/stripe`
4. Envie teste novamente

A URL que funcionar (status 200) é a correta! ✅
