# Comparativo: Mercado Pago vs Pagar.me (VIOS Labs)

Documento de decisão considerando o **modelo atual** do e-commerce VIOS Labs: Stripe (cartão 1x) + Mercado Pago (PIX + cartão 2x/3x), Next.js, Supabase, reserva de estoque e webhooks para criar pedido e enviar confirmação.

---

## 1. Modelo atual (resumo)

| Aspecto                      | Implementação                                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Cartão à vista (1x)**      | Stripe Checkout (redirecionamento)                                                                              |
| **PIX**                      | Mercado Pago (preferência → link/QR)                                                                            |
| **Cartão parcelado (2x/3x)** | Mercado Pago (preferência → Checkout Pro)                                                                       |
| **Fluxo**                    | Formulário de dados (CPF, telefone, endereço, e-mail) → API cria preferência/sessão → redireciona ao gateway    |
| **Webhooks**                 | Stripe: `checkout.session.completed`; MP: `payment` aprovado → criar `orders`, confirmar reserva, enviar e-mail |
| **Estoque**                  | Reserva na intenção de compra; confirmação no webhook de pagamento aprovado                                     |

---

## 2. Mercado Pago (atual)

### Vantagens no nosso contexto

- **Já integrado:** PIX + parcelado 2x/3x, preferência, webhook, metadata (fiscal/entrega), desconto 5% PIX.
- **Checkout Pro:** Experiência conhecida pelo usuário (marca forte no Brasil).
- **PIX:** Geração de link/QR nativa; aprovação rápida; suporte a expiração (ex.: 24h).
- **Documentação e SDK:** SDK oficial em Node/TS; documentação em PT-BR.
- **Sem loja física:** Não exige vínculo com Mercado Livre; conta “só gateway” funciona.

### Desvantagens / pontos de atenção

- **Taxas:** Crédito ~3,49%; parcelado 4,49% + ~0,99%/mês; PIX costuma ter taxa menor (verificar no painel).
- **Repasse:** Prazo típico 14–30 dias (depende do contrato).
- **Webhook:** Comportamento GET + POST, `preference_id` às vezes via `order` ou `external_reference`; metadata essencial (ex.: `customer_email`) para criar pedido e e-mail.
- **Depreciações:** Avisos como `url.parse()` vêm de dependência, não do nosso código.

### Esforço para manter

- Baixo: fluxo já implementado e documentado (`MERCADOPAGO_WEBHOOK_PRODUCAO.md`, fallbacks de e-mail, etc.).

---

## 3. Pagar.me (Stone)

### Visão geral

- Gateway da Stone focado em e-commerce; API REST (v2/v3); postbacks (webhooks) com assinatura HMAC.
- Suporta: cartão (à vista e parcelado), PIX, boleto, recorrência, split de pagamento.

### Vantagens em relação ao nosso modelo

- **Taxas (referência genérica):** Débito/crédito podem ser ligeiramente diferentes do MP (ex.: débito ~1,89%; crédito ~3,79%); parcelado ~4,19% + taxas. _Sempre validar no contrato atual Pagar.me._
- **API estruturada:** Modelo “order + charge” bem definido; postbacks por evento (`order.paid`, etc.).
- **PCI/antifraude:** Infraestrutura preparada para PCI e antifraude.
- **Atendimento:** Stone costuma oferecer suporte comercial/contas.

### Desvantagens / esforço para nós

- **Nada integrado hoje:** Tudo que hoje está no Mercado Pago (preferência, PIX, parcelado, webhook, metadata, e-mail, reserva) teria de ser replicado com Pagar.me.
- **Dois fluxos de cartão:** Hoje: Stripe 1x + MP 2x/3x. Com Pagar.me: ou unifica cartão na Pagar.me (1x + 2x/3x) e pode aposentar Stripe, ou mantém Stripe 1x + Pagar.me PIX/parcelado (duas integrações de cartão).
- **PIX:** Pagar.me tem PIX; detalhes de UX (QR, link, expiração) e de webhook precisam ser mapeados igual ao que fizemos no MP.
- **Webhooks:** Postback com `X-Hub-Signature`; validação HMAC; eventos (order created/paid/canceled, etc.) a tratar e mapear para: criar `orders`, confirmar reserva, enviar e-mail.
- **Documentação:** Boa, mas em PT-BR; curva de adoção para quem já tem MP implementado.

### Esforço para adotar Pagar.me (no lugar do MP)

- **Alto:** Nova API de checkout (criar order/charge), nova tela/fluxo de PIX e parcelado, novo webhook, mesma lógica de negócio (reserva, pedido, e-mail, dados fiscais/entrega). Estimativa: vários dias de dev + testes + homologação.

---

## 4. Comparativo direto (para o nosso modelo)

| Critério                         | Mercado Pago                                   | Pagar.me                                                   |
| -------------------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| **PIX**                          | ✅ Integrado (preferência + link/QR)           | ✅ Suportado (integrar do zero)                            |
| **Cartão parcelado 2x/3x**       | ✅ Integrado (Checkout Pro)                    | ✅ Suportado (integrar do zero)                            |
| **Taxas (ordem de grandeza)**    | ~3,49% crédito; parcelado 4,49% + ~0,99%/mês   | Ligeiramente diferentes por método (confirmar no contrato) |
| **Repasse**                      | 14–30 dias                                     | ~30 dias (típico)                                          |
| **Webhook / Postback**           | GET + POST; `preference_id` com fallbacks      | POST com assinatura; modelo order/charge claro             |
| **Integração atual VIOS**        | Completa (checkout, metadata, e-mail, reserva) | Nenhuma                                                    |
| **Manutenção**                   | Baixa                                          | N/A hoje                                                   |
| **Custo de migração**            | N/A                                            | Alto (nova API, novo webhook, testes)                      |
| **Marca / confiança do usuário** | Muito forte no Brasil                          | Conhecida (Stone)                                          |
| **Documentação / SDK**           | Boa, SDK Node                                  | Boa, API REST                                              |

---

## 5. Recomendação para VIOS Labs

- **Manter Mercado Pago** para PIX e cartão 2x/3x faz sentido porque:
  1. Já está integrado, testado e documentado (incluindo webhook, metadata, e-mail, fallbacks).
  2. O custo de migrar para Pagar.me é alto e as taxas não costumam ser dramaticamente melhores a ponto de justificar sozinhas a troca.
  3. A experiência do usuário (Checkout Pro, PIX) já está estável.

- **Considerar Pagar.me** no futuro se:
  - Houver **proposta comercial** da Stone (taxas/repasse) muito mais vantajosa que a do MP, **e**
  - A estratégia for unificar **todo** o pagamento (cartão 1x + parcelado + PIX) em um único gateway, eventualmente aposentando o Stripe.

- **Não recomendado** trocar MP por Pagar.me apenas por comparação genérica de taxas, sem ganho claro de produto ou custo, dado o esforço atual de integração.

---

## 6. Aposentar o Stripe: Pagar.me é a mais robusta e dá a cara da VIOS?

**Resposta curta:** Sim. Para **unificar tudo em um único gateway** (cartão 1x + parcelado + PIX) e ter **checkout 100% com a cara da VIOS** (sem redirecionar para página de terceiros), o **Pagar.me** é a opção mais alinhada a isso.

### Por que “cara da VIOS”?

| Gateway                                 | Como fica o checkout                                                                                                          | “Cara da VIOS”                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Stripe (atual)**                      | Redireciona para Stripe Checkout (página deles).                                                                              | ❌ Marca Stripe na hora do pagamento.                                         |
| **Mercado Pago (Checkout Pro)**         | Redireciona para página do Mercado Pago.                                                                                      | ❌ Marca MP na hora do pagamento.                                             |
| **Mercado Pago (Bricks)**               | Componentes (cartão, PIX) **embed no seu site**. Cliente não sai do vioslabs.com.br.                                          | ⚠️ Parcial: você escolhe cores/layout, mas os blocos são do MP.               |
| **Mercado Pago (API / Transparente)**   | Você monta o fluxo inteiro no seu site (formulário, PIX, etc.) e chama a API.                                                 | ✅ Total: 100% seu domínio e design.                                          |
| **Pagar.me (checkout hospedado)**       | Página do Pagar.me com **logo e cores customizáveis**.                                                                        | ⚠️ Parcial: ainda é URL deles, com sua marca em cima.                         |
| **Pagar.me (API + formulário próprio)** | Formulário no **seu site** → token/card_hash no front → backend chama API (order/charge). PIX via API. Zero redirecionamento. | ✅ **Total: 100% cara da VIOS** — domínio, layout, copy e identidade só seus. |

O Pagar.me é desenhado para esse uso: você **não é obrigado** a usar a página deles. Dá para fazer **todo** o checkout no vioslabs.com.br (cartão 1x, parcelado, PIX) com formulário e telas suas; o backend só usa a API para criar transação/charge e receber postbacks. Ou seja: **máxima “cara da VIOS”** é possível e é o modelo natural deles.

### Por que “mais robusta” nesse cenário?

- **API explícita:** Modelo “order + charge” bem definido; ciclo de vida claro (criar pedido → cobrar → postback pago).
- **Postbacks:** Webhooks com assinatura (HMAC), eventos por ordem/cobrança; fácil mapear para: criar `orders`, confirmar reserva, enviar e-mail (como hoje com Stripe + MP).
- **Infraestrutura Stone:** PCI, antifraude, suporte; adequado para e-commerce sério.
- **Um único gateway:** Cartão à vista, parcelado e PIX na mesma API e no mesmo fluxo de postback — simplifica lógica e manutenção ao aposentar o Stripe.

O Mercado Pago também é robusto (Bricks, API Transparente, boa documentação). A diferença é que o **Pagar.me** é mais “API-first”: o default é você construir o checkout; no MP o default é Checkout Pro (redirecionamento) e Bricks/Transparente exigem escolher esse caminho. Para **“tudo no meu site, minha cara”**, Pagar.me encaixa de forma mais direta.

### Conclusão

- **Para aposentar o Stripe e ter checkout com a cara da VIOS (sem redirecionar):**  
  **Pagar.me** é a opção **mais robusta e mais alinhada**: um único gateway, API para cartão (1x e parcelado) + PIX, postbacks claros, e checkout 100% no seu domínio com seu design.

- **Se quiser manter algo pronto e só “menos marca do MP”:**  
  Dá para evoluir com **Mercado Pago Bricks** (embed no site, sem redirecionar), mantendo Stripe ou não. É menos “100% sua cara” que um checkout próprio com Pagar.me, mas com menos esforço de construção de tela.

- **Recomendação:** Se a prioridade é **identidade de marca (cara da VIOS) + aposentar Stripe em um só gateway**, **Pagar.me** é a escolha mais consistente. O esforço é alto (nova integração, formulários, postbacks), mas o resultado é um checkout único, robusto e totalmente seu.

---

## 7. Referências

- Mercado Pago: [developers.mercadopago](https://www.mercadopago.com.br/developers)
- Pagar.me: [pagar.me](https://www.pagar.me/), [docs.pagar.me](https://docs.pagar.me/) (webhooks, postback, checkout)
- Taxas: sempre conferir no contrato e no painel de cada gateway (valores variam por plano e volume).
