# Integração Pagar.me — VIOS Labs

Este documento descreve o fluxo de pagamento **transparente** da VIOS Labs usando **apenas o Pagar.me** como gateway: checkout dentro do site (a cara da VIOS), PIX e cartão de crédito (à vista e parcelado), e o que configurar no dashboard do Pagar.me.

---

## 1. Visão geral do fluxo

1. **Carrinho** → Cliente escolhe PIX ou cartão (1x, 2x ou 3x).
2. **Formulário** → Coleta e-mail, CPF, telefone e endereço de entrega (obrigatório para Pagar.me PSP).
3. **Reserva de estoque** → Backend reserva itens no Supabase antes de criar o pedido no Pagar.me.
4. **Criação do pedido** → `POST /api/checkout/pagarme` cria o pedido na API v5 do Pagar.me com:
   - **PIX**: uma charge com `payment_method: "pix"`. A API retorna QR Code e link; o front exibe e o cliente paga no app do banco.
   - **Cartão**: uma charge com `payment_method: "credit_card"` e `card_token` (token gerado no front pelo **tokenizecard.js**, sem trafegar número do cartão no servidor).
5. **Webhook** → Pagar.me envia `order.paid` (ou `charge.paid`) para `POST /api/webhooks/pagarme`. O backend:
   - Cria o pedido e os itens no Supabase.
   - Confirma a reserva de estoque (`confirm_reservation` com o ID do pedido Pagar.me).
   - Envia e-mail de confirmação.

O cliente **nunca** sai do site para pagar; a experiência é 100% “checkout transparente” com a identidade visual da VIOS.

**Cartão (padrão e-commerce Pagar.me):** escolha de parcelas (1x, 2x, 3x) no resumo; detecção de bandeira (Visa, Mastercard, Elo, Amex) e formatação do número/validade (MM/AA).

---

## 2. O que fazer no Pagar.me (Dashboard)

### 2.1 Conta e ambiente

- Acesse o [Dashboard Pagar.me](https://dashboard.pagar.me/) e faça login.
- Use **ambiente de testes** para desenvolvimento e **produção** para loja ao vivo.
- Anote:
  - **Chave secreta (Secret Key)** — usada **apenas no servidor** (Next.js), nunca no front.
  - **Chave pública (Public Key)** — usada no front **somente** para o tokenizecard.js (tokenização de cartão).

### 2.2 Cadastro de domínio (obrigatório para tokenizecard)

Para o tokenizecard.js funcionar (cartão no checkout transparente), o domínio da loja precisa estar cadastrado:

1. No dashboard: **Configurações** (ou **Integrações**) → **Domínios** (ou **Tokenizecard**).
2. Adicione:
   - Em desenvolvimento: `http://localhost:3000`
   - Em produção: `https://vioslabs.com.br` (e `https://www.vioslabs.com.br` se usar)
3. Salve. Sem isso, a criação de token de cartão pode ser bloqueada.

Referência: [Configurando a Dashboard – Cadastro de domínio](https://docs.pagar.me/docs/configurando-a-dashboard-nuvemshop#configura%C3%A7%C3%A3o-de-dom%C3%ADnio).

### 2.3 Webhooks

1. No dashboard: **Webhooks** (ou **Notificações**).
2. Crie um novo webhook:
   - **URL**: `https://seu-dominio.com/api/webhooks/pagarme`  
     Em produção: `https://vioslabs.com.br/api/webhooks/pagarme`
   - **Eventos** (mínimo necessário):
     - `order.paid` — pedido pago (PIX ou cartão).
     - Opcionalmente: `charge.paid`, `charge.payment_failed`, `order.payment_failed` para logs e retentativas.
3. **Secret** (se o Pagar.me gerar): guarde em variável de ambiente `PAGARME_WEBHOOK_SECRET` e use no backend para validar a assinatura do POST (recomendado).

### 2.4 Meios de pagamento

- No dashboard, confirme que **PIX** e **Cartão de crédito** estão ativos para a sua conta.
- Se aparecer "PIX não disponível para este pedido", verifique:
  1. **PIX habilitado** no dashboard Pagar.me (Configurações / Meios de pagamento).
  2. Em **ambiente de testes**, use chaves de **teste**; em produção, chaves **live**.
  3. Com `pnpm dev`, veja o terminal: se o QR não vier na resposta, o log `[PAGARME CHECKOUT] PIX sem QR` mostra a estrutura retornada pela API (útil para debug).
- Parcelamento (2x, 3x) segue as regras da sua adesão (gateway/PSP).

---

## 3. Variáveis de ambiente

No `.env` (e na Vercel/hosting), configure:

```env
# Pagar.me (obrigatório para checkout)
PAGARME_SECRET_KEY=sk_test_...   # ou sk_live_... em produção
NEXT_PUBLIC_PAGARME_PUBLIC_KEY=pk_test_...   # ou pk_live_... (usado no tokenizecard no front)

# Webhook (opcional; use se o dashboard Pagar.me gerar um secret para a URL)
PAGARME_WEBHOOK_SECRET=whsec_...
```

**Nota:** O nome da chave no dashboard Pagar.me pode ser "Chave secreta" / "Secret Key" e "Chave pública" / "Public Key". Use a chave de **teste** em desenvolvimento e a de **produção** em produção.

- **Nunca** exponha `PAGARME_SECRET_KEY` no front (nem em `NEXT_PUBLIC_*`).
- `NEXT_PUBLIC_PAGARME_PUBLIC_KEY` é usada no browser apenas para chamar a API de criação de token (tokenizecard), conforme documentação Pagar.me.

---

## 4. Fluxo técnico resumido

| Etapa | Quem     | Ação                                                                                                                      |
| ----- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1     | Front    | Usuário preenche dados e escolhe PIX ou cartão (1x/2x/3x).                                                                |
| 2     | Front    | Se cartão: carrega tokenizecard.js, usuário digita dados do cartão; o script gera um `card_token`.                        |
| 3     | Front    | Envia `POST /api/checkout/pagarme` com itens, dados do cliente/entrega e, se cartão, `card_token` e parcelas.             |
| 4     | Backend  | Valida carrinho, reserva estoque (Supabase), cria pedido no Pagar.me (API v5) com uma charge PIX ou credit_card.          |
| 5     | Backend  | Responde com `orderId` e, se PIX, `qr_code`, `qr_code_url` e `pix_copy_paste` (código copia-e-cola) para exibir no front. |
| 6     | Pagar.me | Para PIX: cliente paga; para cartão: processa e autoriza.                                                                 |
| 7     | Pagar.me | Envia webhook `order.paid` para `POST /api/webhooks/pagarme`.                                                             |
| 8     | Backend  | Cria `orders` e `order_items` no Supabase, confirma reserva com o ID do pedido Pagar.me, envia e-mail.                    |
| 9     | Front    | Redireciona para página de sucesso (ex.: `/checkout/success?order_id=...`).                                               |

---

## 5. Segurança e boas práticas

- **Cartão**: só trafegar `card_token` (tokenizecard.js). Nunca enviar número, CVV ou validade para o seu servidor.
- **Webhook**: validar assinatura com `PAGARME_WEBHOOK_SECRET` e processar cada evento de forma idempotente (evitar criar dois pedidos para o mesmo `order.paid`).
- **Reserva**: liberar reserva (release) se a criação do pedido no Pagar.me falhar ou se o pagamento falhar e você tratar cancelamento.
- **Valores**: enviar valores em **centavos** na API Pagar.me; no front exibir em reais.

---

## 6. Referências

- [Documentação Pagar.me](https://docs.pagar.me/docs)
- [API Reference – Criar pedido (v5)](https://docs.pagar.me/reference/criar-pedido-2)
- [Tokenizecard.js](https://docs.pagar.me/docs/tokenizecard) — tokenização de cartão no front
- [Criar token de cartão](https://docs.pagar.me/reference/criar-token-cart%C3%A3o-1) — endpoint usado pelo tokenizecard
- [Webhooks](https://docs.pagar.me/docs/webhooks) — eventos como `order.paid` e `charge.paid`

---

_Última atualização: janeiro de 2025 — VIOS Labs, checkout transparente com Pagar.me._
