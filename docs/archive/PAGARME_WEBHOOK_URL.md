# URL do webhook Pagar.me

Use esta URL ao configurar o webhook no **dashboard da Pagar.me / Mundipagg**:

## Produção (domínio final)

Se o seu domínio **redireciona** `vioslabs.com.br` → `www.vioslabs.com.br` (resposta 307), use a URL **com www** para evitar redirect (webhooks devem receber 200, não 307):

```
https://www.vioslabs.com.br/api/webhooks/pagarme
```

Se não houver redirect, pode usar:

```
https://vioslabs.com.br/api/webhooks/pagarme
```

## Outros ambientes

- **Vercel (preview):** `https://SEU_PROJETO.vercel.app/api/webhooks/pagarme`
- **Local (ngrok):** `https://SEU_SUBDOMINIO.ngrok.io/api/webhooks/pagarme`

---

## Como configurar no Pagar.me

1. Acesse o **dashboard** da Pagar.me (ou Mundipagg).
2. Vá em **Webhooks** / **Notificações** / **Integrações**.
3. **Crie um novo webhook** (ou edite o existente).
4. Em **URL do webhook**, cole exatamente (sem barra no final):
   - **Recomendado (evita 307):** `https://www.vioslabs.com.br/api/webhooks/pagarme`
   - Ou `https://vioslabs.com.br/api/webhooks/pagarme` se o servidor não redirecionar para www
5. **Eventos** — marque pelo menos:
   - **order.paid** (pedido pago — PIX ou cartão)
6. Salve.

---

## O que o webhook faz

Quando o Pagar.me envia `order.paid` para essa URL:

1. Cria o pedido na tabela `orders` no Supabase.
2. Cria os itens em `order_items`.
3. Confirma a reserva de estoque (`confirm_reservation`).
4. Envia o e-mail de confirmação (Resend).

---

## Se aparecer 307 (redirect)

Se a Pagar.me mostrar resposta `{"redirect": "https://www.vioslabs.com.br/...", "status": "307"}`:
- O servidor está redirecionando **sem www** → **com www**. Troque a URL no dashboard para **com www**:  
  `https://www.vioslabs.com.br/api/webhooks/pagarme`  
Assim a requisição cai direto na URL final e retorna 200.

## Se não funcionar

1. **Confirme a URL** no dashboard (HTTPS, sem `/` no final, use **www** se houver 307).
2. **Veja os logs** (Vercel → seu projeto → Logs, ou terminal se `pnpm dev`):
   - `[PAGARME WEBHOOK] Recebido:` — mostra se a requisição chegou e o `type` do evento.
   - Se `type` não for `order.paid`, o webhook responde 200 mas não cria pedido (adicione o evento correto no dashboard).
3. **Teste a URL** (opcional):  
   `curl -X POST https://vioslabs.com.br/api/webhooks/pagarme -H "Content-Type: application/json" -d '{"type":"order.paid","data":{"id":"test"}}'`  
   Deve retornar 200 (e não criará pedido real porque `data` é mínimo).
