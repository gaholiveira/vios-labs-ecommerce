# Checkout com provider dinâmico — a cara da VIOS

Checkout refatorado para **provider dinâmico**: Stripe (Elements) e Mercado Pago (Bricks) renderizados **no site**, sem redirecionamento para página de terceiros.

---

## Como fica o carrinho nesse modelo

O carrinho **continua igual** em onde vive e quando é limpo; só mudam os passos em cima dele.

| Aspecto                       | Comportamento                                                                                                                                                                                                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Onde vive**                 | `CartContext`: estado global (itens, `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, `isOpen`, `setIsOpen`).                                                                                                                                                                                             |
| **Drawer**                    | Continua abrindo ao adicionar produto (`setIsOpen(true)`). O painel lateral do carrinho é o mesmo; ao lado dele aparecem os overlays de checkout.                                                                                                                                                                      |
| **Fluxo visual**              | 1) Usuário com carrinho aberto → escolhe forma de pagamento → clica **Finalizar compra**. 2) Overlay do **formulário** (dados) aparece por cima. 3) Após enviar o form → overlay do **pagamento** (Stripe Elements ou MP Bricks) aparece. O drawer do carrinho pode ficar atrás (não é fechado ao iniciar o checkout). |
| **Quando o carrinho é limpo** | Só na **página de sucesso** (`/checkout/success`): `clearCart()` roda no `useEffect` ao montar a página. Se o usuário abandonar no form ou no step de pagamento, os itens permanecem no carrinho.                                                                                                                      |
| **Fechar overlay**            | Cancelar o form ou fechar o step de pagamento (X) remove o overlay e volta a exibir o drawer com os itens intactos. Fechar o **carrinho** (drawer) continua sendo clicar no backdrop ou no botão de fechar → `setIsOpen(false)`.                                                                                       |

Resumo: o carrinho (estado + drawer) não mudou de lugar; o novo modelo só acrescenta os passos de formulário e pagamento em overlays por cima, e a limpeza dos itens segue acontecendo apenas na página de sucesso.

---

## O que foi feito

1. **Tipos** (`src/types/checkout.ts`)
   - `PaymentProvider`: `"stripe" | "mercadopago"`
   - `CheckoutPaymentPayload`: `{ provider: "stripe"; clientSecret }` ou `{ provider: "mercadopago"; preferenceId; publicKey }`

2. **API Stripe embed** (`/api/checkout/create-payment-intent`)
   - Reserva estoque, cria `PaymentIntent` (valor, metadata: userId, customerEmail, items, checkoutData), atualiza reservas com `payment_intent.id`, retorna `{ clientSecret, paymentIntentId }`.
   - Usado para **cartão à vista (1x)** no fluxo embed.

3. **Webhook Stripe** (`payment_intent.succeeded`)
   - Cria pedido a partir dos metadata (items, checkoutData), confirma reserva, envia e-mail.

4. **API Mercado Pago**
   - Resposta passa a incluir `preferenceId` e `publicKey` (além de `url`) para uso no Bricks.
   - Variáveis de ambiente: `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` ou `MERCADOPAGO_PUBLIC_KEY`.

5. **Componente** `CheckoutPaymentStep` (`src/components/checkout/CheckoutPaymentStep.tsx`)
   - **Stripe:** `Elements` + `PaymentElement` + botão “Pagar” → `confirmPayment` → redireciona para `/checkout/success?session_id=pi_xxx`.
   - **Mercado Pago:** carrega `@mercadopago/sdk-react`, `initMercadoPago(publicKey)`, renderiza `<Payment initialization={{ preferenceId }} />`; em sucesso redireciona para `/checkout/success?session_id=preferenceId`.

6. **Fluxo no CartDrawer**
   - Sempre exibe o **formulário de dados** (e-mail, CPF, telefone, endereço) para todos os métodos.
   - Após enviar o formulário:
     - **Cartão 1x:** chama `create-payment-intent` → recebe `clientSecret` → mostra step de pagamento com **Stripe Elements**.
     - **PIX / Cartão 2x ou 3x:** chama `/api/checkout/mercadopago` → se houver `publicKey`, mostra step com **Mercado Pago Bricks**; senão, redireciona para `url` (comportamento anterior).

7. **Página de sucesso e verify**
   - Aceita `session_id` ou `payment_intent` na URL; a API `/api/orders/verify` aceita ambos para buscar o pedido.

---

## Dependências novas

No `package.json` foram adicionadas:

- `@stripe/react-stripe-js` (Stripe Elements)
- `@mercadopago/sdk-react` (Mercado Pago Bricks)

**Você precisa rodar:**

```bash
pnpm install
```

(ou `pnpm install --no-frozen-lockfile` se o lockfile estiver desatualizado)

---

## Variáveis de ambiente

| Variável                                                         | Uso                                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`                             | Stripe Elements (front). Obrigatória para checkout embed Stripe.                               |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` ou `MERCADOPAGO_PUBLIC_KEY` | Mercado Pago Bricks (front). Se não definida, o fluxo MP usa redirect (link) em vez do Bricks. |

---

## Comportamento atual

- **Cartão 1x:** formulário VIOS → step de pagamento com Stripe Elements no site → sucesso → `/checkout/success?session_id=pi_xxx`.
- **PIX / Cartão 2x ou 3x:** formulário VIOS → se `publicKey` estiver configurada, step com Mercado Pago Bricks no site; caso contrário, redirect para a página do Mercado Pago (como antes).

Checkout fica **a cara da VIOS**: dados e pagamento no mesmo domínio, com provider (Stripe ou Mercado Pago) escolhido dinamicamente conforme o método de pagamento.
