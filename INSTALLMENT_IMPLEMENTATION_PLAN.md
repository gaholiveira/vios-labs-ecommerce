# 💳 Plano de Implementação - Parcelamento 3x Sem Juros

**Data:** 26 de Janeiro de 2026  
**Objetivo:** Implementar parcelamento em até 3x sem juros para pagamentos com cartão

---

## 📋 Análise da Situação

### Limitação do Stripe

- ❌ **Stripe Checkout não suporta parcelamento nativo no Brasil**
- ✅ Stripe suporta apenas: Boleto, Cartão à vista, Pix (quando disponível)
- ✅ Stripe tem installments apenas para: Japão, México, Mastercard Installments (limitado)

### Soluções Disponíveis

#### **Opção 1: Solução Híbrida (RECOMENDADA)** ⭐

- **Cartão à vista** → Stripe (mantém atual)
- **Cartão parcelado (2x ou 3x)** → Mercado Pago
- **PIX** → Mercado Pago (já planejado)

**Vantagens:**

- ✅ Reutiliza plano híbrido já criado
- ✅ Robusto e escalável
- ✅ Melhor experiência (cliente escolhe antes do checkout)
- ✅ Mantém Stripe para à vista (mais barato)

#### **Opção 2: Mercado Pago para Todos os Cartões**

- Todos os pagamentos com cartão → Mercado Pago
- Stripe apenas para Boleto

**Vantagens:**

- ✅ Simples de implementar
- ✅ Uma única integração para cartões

**Desvantagens:**

- ❌ Taxa do Mercado Pago pode ser maior que Stripe
- ❌ Perde benefícios do Stripe (melhor UX, menor taxa)

#### **Opção 3: Stripe Payment Intents Manual**

- Criar Payment Intents manualmente
- Gerenciar parcelamento no backend

**Desvantagens:**

- ❌ Complexo de implementar
- ❌ Não há suporte nativo do Stripe para Brasil
- ❌ Requer lógica customizada de parcelamento
- ❌ Não recomendado

---

## 🎯 Solução Recomendada: Opção 1 (Híbrida)

### Arquitetura Proposta

```
┌─────────────────┐
│  CartDrawer     │
│  (Frontend)     │
└────────┬────────┘
         │
         │ 1. Usuário escolhe método de pagamento:
         │    - Cartão à vista (Stripe)
         │    - Cartão parcelado 2x (Mercado Pago)
         │    - Cartão parcelado 3x (Mercado Pago)
         │    - PIX (Mercado Pago)
         │
         ▼
┌─────────────────┐
│  /api/checkout   │
│  (Backend)      │
└────────┬────────┘
         │
         ├─► 2a. Se Cartão à vista → Stripe
         │         - Mantém lógica atual
         │
         ├─► 2b. Se Cartão parcelado → Mercado Pago
         │         - Cria preferência com installments
         │         - Configura 2x ou 3x sem juros
         │
         └─► 2c. Se PIX → Mercado Pago
                   - Cria preferência PIX
```

---

## 📦 Implementação Detalhada

### **FASE 1: Frontend - Seleção de Parcelamento**

#### 1.1 Modificar `CartDrawer`

**Arquivo:** `src/components/CartDrawer.tsx`

**Mudanças:**

- Adicionar estado `installmentOption: '1x' | '2x' | '3x' | null`
- Criar componente de seleção de parcelamento
- Modificar `handleCheckout()` para incluir `installmentOption`
- Determinar gateway baseado na escolha:
  - `1x` → Stripe
  - `2x` ou `3x` → Mercado Pago

**UI Sugerida:**

```
┌─────────────────────────────────┐
│  Forma de Pagamento            │
│                                 │
│  Cartão de Crédito             │
│  ┌───────────────────────────┐ │
│  │ ○ 1x sem juros            │ │
│  │ ● 2x sem juros            │ │
│  │ ○ 3x sem juros            │ │
│  └───────────────────────────┘ │
│                                 │
│  [Finalizar Compra]            │
└─────────────────────────────────┘
```

---

### **FASE 2: Backend - API de Checkout**

#### 2.1 Modificar `/api/checkout`

**Arquivo:** `src/app/api/checkout/route.ts`

**Mudanças:**

- Adicionar `installmentOption: '1x' | '2x' | '3x'` no body
- Router para direcionar:
  - `installmentOption === '1x'` → Stripe (lógica atual)
  - `installmentOption === '2x' ou '3x'` → Mercado Pago

**Estrutura:**

```typescript
interface CheckoutRequestBody {
  items: CartItem[];
  userId?: string;
  customerEmail?: string;
  paymentMethod: "pix" | "card"; // Já existe no plano híbrido
  installmentOption?: "1x" | "2x" | "3x"; // NOVO
}
```

#### 2.2 Criar `/api/checkout/mercadopago` (se ainda não existir)

**Arquivo:** `src/app/api/checkout/mercadopago/route.ts`

**Funcionalidades:**

- ✅ Validar carrinho (reutilizar funções existentes)
- ✅ Reservar estoque (mesma lógica do Stripe)
- ✅ Criar preferência de pagamento no Mercado Pago
- ✅ Configurar installments baseado em `installmentOption`:
  ```typescript
  payment_methods: {
    installments: installmentOption === '2x' ? 2 : 3,
    excluded_payment_types: [{ id: 'ticket' }], // Excluir boleto
    excluded_payment_methods: [], // Permitir todos os cartões
  },
  ```
- ✅ Retornar `init_point` (URL de pagamento)

**Exemplo de Configuração:**

```typescript
const preference = {
  items: [...],
  payer: {
    email: customerEmail,
    identification: { type: 'CPF', number: cpf }, // Se disponível
  },
  payment_methods: {
    installments: installmentOption === '2x' ? 2 : 3,
    excluded_payment_types: [{ id: 'ticket' }],
  },
  back_urls: {
    success: successUrl,
    failure: failureUrl,
    pending: pendingUrl,
  },
  auto_return: 'approved',
  notification_url: webhookUrl,
  metadata: {
    order_id: orderId,
    user_id: userId,
    installment_option: installmentOption,
  },
};
```

---

### **FASE 3: Webhook Mercado Pago**

#### 3.1 Criar `/api/webhooks/mercadopago`

**Arquivo:** `src/app/api/webhooks/mercadopago/route.ts`

**Funcionalidades:**

- ✅ Validar assinatura do webhook (X-Signature)
- ✅ Processar eventos de pagamento
- ✅ Capturar número de parcelas do pagamento
- ✅ Confirmar reserva de estoque
- ✅ Criar pedido no banco (incluir `installment_count`)
- ✅ Atualizar estoque
- ✅ Enviar email de confirmação

---

### **FASE 4: Banco de Dados**

#### 4.1 Modificar Tabela `orders`

**Arquivo:** SQL migration

**Adicionar colunas:**

```sql
ALTER TABLE orders
ADD COLUMN installment_count INTEGER DEFAULT 1
CHECK (installment_count IN (1, 2, 3));

ALTER TABLE orders
ADD COLUMN installment_amount DECIMAL(10, 2); -- Valor de cada parcela

CREATE INDEX idx_orders_installment_count ON orders(installment_count);
```

**Benefícios:**

- Rastrear parcelas por pedido
- Analytics de conversão por número de parcelas
- Facilita suporte e gestão financeira

---

## 🎨 UI/UX Recomendada

### Seleção de Parcelamento

**Opção A: Radio Buttons Simples (Recomendado)**

```
┌─────────────────────────────────┐
│  Parcelamento                   │
│                                 │
│  ○ 1x sem juros  R$ 797,00     │
│  ● 2x sem juros  R$ 398,50     │
│  ○ 3x sem juros  R$ 265,67     │
│                                 │
└─────────────────────────────────┘
```

**Opção B: Cards Selecionáveis**

```
┌─────────────────────────────────┐
│  Como deseja pagar?             │
│                                 │
│  ┌──────────┐  ┌──────────┐   │
│  │  1x      │  │  2x       │   │
│  │ R$797,00 │  │ R$398,50  │   │
│  │          │  │          │   │
│  └──────────┘  └──────────┘   │
│                                 │
│  ┌──────────┐                  │
│  │  3x      │                  │
│  │ R$265,67 │                  │
│  │          │                  │
│  └──────────┘                  │
└─────────────────────────────────┘
```

---

## 🔒 Validações e Segurança

### Validações Necessárias

1. **Valor Mínimo para Parcelamento**
   - Definir valor mínimo (ex: R$ 50,00) para permitir parcelamento
   - Abaixo do mínimo, apenas à vista

2. **Validação de Parcelas**
   - Verificar se valor permite parcelamento escolhido
   - Calcular valor por parcela corretamente

3. **Segurança Mercado Pago**
   - Validar X-Signature no webhook
   - Verificar status do pagamento
   - Idempotência (evitar processar 2x)

---

## 📊 Fluxo de Dados

### Checkout Cartão Parcelado (2x ou 3x)

```
1. Usuário seleciona "2x sem juros" ou "3x sem juros"
2. Frontend → POST /api/checkout {
     paymentMethod: 'card',
     installmentOption: '2x' ou '3x',
     ...
   }
3. Backend:
   - Valida carrinho
   - Reserva estoque
   - Cria preferência MP com installments
   - Retorna init_point
4. Frontend → Redireciona para init_point
5. Usuário paga no MP (com parcelamento configurado)
6. MP → POST /api/webhooks/mercadopago
7. Backend:
   - Valida assinatura
   - Confirma reserva
   - Cria pedido (com installment_count)
   - Envia email
8. MP → Redireciona para /checkout/success
```

### Checkout Cartão à Vista (1x)

```
1. Usuário seleciona "1x sem juros"
2. Frontend → POST /api/checkout {
     paymentMethod: 'card',
     installmentOption: '1x',
     ...
   }
3. Backend:
   - Valida carrinho
   - Reserva estoque
   - Cria sessão Stripe (lógica atual)
   - Retorna session.url
4. Frontend → Redireciona para session.url
5. Usuário paga no Stripe
6. Stripe → POST /api/webhooks/stripe
7. Backend:
   - Processa evento
   - Confirma reserva
   - Cria pedido (installment_count = 1)
   - Envia email
8. Stripe → Redireciona para /checkout/success
```

---

## 💰 Cálculo de Parcelas

### Função Helper

```typescript
function calculateInstallmentAmount(
  totalAmount: number,
  installments: number,
): number {
  // Arredondar para 2 casas decimais
  return Math.round((totalAmount / installments) * 100) / 100;
}

// Exemplo:
// Total: R$ 797,00
// 2x: R$ 398,50 cada
// 3x: R$ 265,67 cada (última parcela pode ter diferença de centavos)
```

### Tratamento de Centavos

```typescript
function calculateInstallments(totalAmount: number) {
  const twoInstallments = calculateInstallmentAmount(totalAmount, 2);
  const threeInstallments = calculateInstallmentAmount(totalAmount, 3);

  // Ajustar última parcela para compensar diferenças de arredondamento
  const threeInstallmentsLast = totalAmount - threeInstallments * 2;

  return {
    "1x": totalAmount,
    "2x": twoInstallments,
    "3x": {
      first: threeInstallments,
      second: threeInstallments,
      third: threeInstallmentsLast, // Pode ter diferença de centavos
    },
  };
}
```

---

## ✅ Checklist de Implementação

### Setup

- [ ] Instalar `mercadopago` SDK (se ainda não instalado)
- [ ] Adicionar variáveis de ambiente do Mercado Pago
- [ ] Configurar webhook no dashboard do MP

### Frontend

- [ ] Criar componente de seleção de parcelamento
- [ ] Modificar `CartDrawer` para incluir seleção
- [ ] Atualizar `handleCheckout()` para incluir `installmentOption`
- [ ] Exibir valores por parcela

### Backend

- [ ] Modificar `/api/checkout` para aceitar `installmentOption`
- [ ] Criar/modificar `/api/checkout/mercadopago` com installments
- [ ] Configurar installments no Mercado Pago (2x e 3x)
- [ ] Atualizar webhook para capturar número de parcelas

### Banco de Dados

- [ ] Adicionar coluna `installment_count` em `orders`
- [ ] Adicionar coluna `installment_amount` em `orders`
- [ ] Criar índices

### Testes

- [ ] Testar checkout 1x (Stripe)
- [ ] Testar checkout 2x (Mercado Pago)
- [ ] Testar checkout 3x (Mercado Pago)
- [ ] Testar webhooks
- [ ] Testar cálculo de parcelas
- [ ] Testar valor mínimo

---

## 🚀 Ordem de Implementação Recomendada

1. **FASE 1** - Frontend (seleção de parcelamento)
2. **FASE 4** - Banco de dados (migration)
3. **FASE 2** - Backend (modificar checkout, criar MP com installments)
4. **FASE 3** - Webhook (capturar parcelas)
5. **Testes** - Validar fluxo completo

---

## ⚠️ Considerações Importantes

### 1. Valor Mínimo

- Definir valor mínimo para permitir parcelamento (ex: R$ 50,00)
- Abaixo do mínimo, apenas à vista disponível

### 2. Taxas

- Verificar taxas do Mercado Pago para parcelamento
- Comparar com taxas do Stripe (à vista)
- Considerar custo adicional nas decisões de negócio

### 3. Experiência do Usuário

- Mostrar valor por parcela claramente
- Indicar "sem juros" quando aplicável
- Exibir total de forma destacada

### 4. Analytics

- Rastrear conversão por número de parcelas
- Métricas de abandono por método
- Taxa de sucesso por gateway

---

## 📚 Recursos

### Mercado Pago

- [SDK Node.js](https://www.mercadopago.com.br/developers/pt/docs/sdk/server-side/nodejs)
- [Installments](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/payment-methods/installments)
- [Preferências](https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post)

### Stripe

- [Payment Methods](https://docs.stripe.com/payments/checkout/payment-methods)
- [Brazil Payment Methods](https://docs.stripe.com/payments/payment-methods/overview#brazil)

---

## ✅ Recomendação Final

**Implementar Opção 1 (Híbrida):**

- ✅ **Cartão à vista (1x)** → Stripe (mantém atual, melhor taxa)
- ✅ **Cartão parcelado (2x ou 3x)** → Mercado Pago (suporta installments)
- ✅ **PIX** → Mercado Pago (já planejado)

**Benefícios:**

- Reutiliza plano híbrido já criado
- Melhor experiência (cliente escolhe antes do checkout)
- Mantém Stripe para à vista (mais barato)
- Escalável e robusto

---

**Status:** 📋 **PLANO PRONTO PARA IMPLEMENTAÇÃO**

**Última atualização:** 26 de Janeiro de 2026
