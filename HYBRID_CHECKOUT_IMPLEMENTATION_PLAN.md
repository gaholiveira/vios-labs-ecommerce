# 💳 Plano de Implementação - Checkout Híbrido (Mercado Pago PIX + Stripe)

**Data:** 26 de Janeiro de 2026  
**Objetivo:** Implementar solução híbrida permitindo PIX via Mercado Pago enquanto Stripe não libera PIX

---

## 📋 Resumo Executivo

### Situação Atual
- ✅ Stripe configurado e funcionando para cartões
- ✅ Sistema de reserva de estoque implementado
- ✅ Webhook do Stripe processando pagamentos
- ✅ Guest checkout funcionando
- ✅ CPF collection implementado
- ❌ PIX não disponível no Stripe (conta não liberada)

### Solução Proposta
- ✅ **Mercado Pago** para pagamentos via PIX
- ✅ **Stripe** para cartões de crédito/débito (mantém atual)
- ✅ Interface unificada com seleção de método de pagamento
- ✅ Mesma experiência de usuário
- ✅ Reserva de estoque para ambos
- ✅ Webhooks para ambos os gateways

---

## 🎯 Arquitetura da Solução

### Fluxo de Checkout Híbrido

```
┌─────────────────┐
│  CartDrawer     │
│  (Frontend)     │
└────────┬────────┘
         │
         │ 1. Usuário escolhe método de pagamento
         │    - PIX (Mercado Pago)
         │    - Cartão (Stripe)
         │
         ▼
┌─────────────────┐
│  /api/checkout   │
│  (Backend)      │
└────────┬────────┘
         │
         ├─► 2a. Se PIX → /api/checkout/mercadopago
         │         - Reserva estoque
         │         - Cria preferência MP
         │         - Retorna init_point
         │
         └─► 2b. Se Cartão → /api/checkout/stripe (atual)
                   - Reserva estoque
                   - Cria sessão Stripe
                   - Retorna session.url
         │
         ▼
┌─────────────────┐
│  Gateway        │
│  (MP ou Stripe) │
└────────┬────────┘
         │
         │ 3. Usuário paga
         │
         ▼
┌─────────────────┐
│  Webhook        │
│  (MP ou Stripe)  │
└────────┬────────┘
         │
         │ 4. Processa pagamento
         │    - Confirma reserva
         │    - Cria pedido
         │    - Atualiza estoque
         │    - Envia email
         │
         ▼
┌─────────────────┐
│  Success Page   │
└─────────────────┘
```

---

## 📦 Passo a Passo de Implementação

### **FASE 1: Setup e Configuração** ⚙️

#### 1.1 Instalar Dependências
```bash
pnpm add mercadopago
pnpm add -D @types/mercadopago
```

#### 1.2 Variáveis de Ambiente
Adicionar ao `.env`:
```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
MERCADOPAGO_PUBLIC_KEY=seu_public_key_aqui
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=seu_public_key_aqui

# Webhook URL (será configurado no dashboard do MP)
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

#### 1.3 Criar Cliente Mercado Pago
**Arquivo:** `src/lib/mercadopago.ts`
- Inicializar SDK do Mercado Pago
- Configurar timeout e retries
- Type-safe client

---

### **FASE 2: Backend - API Routes** 🔧

#### 2.1 Modificar `/api/checkout` (Rota Principal)
**Arquivo:** `src/app/api/checkout/route.ts`

**Mudanças:**
- Adicionar parâmetro `paymentMethod: 'pix' | 'card'` no body
- Router para direcionar:
  - `paymentMethod === 'pix'` → Chama lógica Mercado Pago
  - `paymentMethod === 'card'` → Mantém lógica Stripe atual
- Validações compartilhadas (carrinho, estoque, etc.)

**Estrutura:**
```typescript
interface CheckoutRequestBody {
  items: CartItem[];
  userId?: string;
  customerEmail?: string;
  paymentMethod: 'pix' | 'card'; // NOVO
}
```

#### 2.2 Criar `/api/checkout/mercadopago`
**Arquivo:** `src/app/api/checkout/mercadopago/route.ts`

**Funcionalidades:**
- ✅ Validar carrinho (reutilizar funções existentes)
- ✅ Reservar estoque (mesma lógica do Stripe)
- ✅ Criar preferência de pagamento no Mercado Pago
- ✅ Configurar PIX como método único
- ✅ Adicionar webhook URL
- ✅ Retornar `init_point` (URL de pagamento)
- ✅ Incluir CPF no payer (se disponível)
- ✅ Metadata para rastreamento

**Estrutura da Preferência:**
```typescript
{
  items: [...], // Produtos
  payer: {
    email: string,
    identification: { type: 'CPF', number: string }, // Se disponível
  },
  payment_methods: {
    excluded_payment_methods: [...], // Excluir tudo exceto PIX
    excluded_payment_types: [...],
    installments: 1, // PIX é à vista
  },
  back_urls: {
    success: string,
    failure: string,
    pending: string,
  },
  auto_return: 'approved', // Redirecionar automaticamente
  notification_url: string, // Webhook URL
  metadata: {
    order_id: string,
    user_id: string,
    // ... outros dados
  },
}
```

#### 2.3 Manter `/api/checkout` (Stripe) - Modificar
**Arquivo:** `src/app/api/checkout/route.ts`

**Mudanças:**
- Renomear função principal para `createStripeCheckout()`
- Manter toda lógica atual
- Adicionar verificação de `paymentMethod === 'card'`

---

### **FASE 3: Webhook Mercado Pago** 🔔

#### 3.1 Criar `/api/webhooks/mercadopago`
**Arquivo:** `src/app/api/webhooks/mercadopago/route.ts`

**Funcionalidades:**
- ✅ Validar assinatura do webhook (X-Signature header)
- ✅ Processar eventos:
  - `payment` (pagamento aprovado)
  - `merchant_order` (ordem criada)
- ✅ Confirmar reserva de estoque
- ✅ Criar pedido no banco (mesma estrutura do Stripe)
- ✅ Atualizar estoque
- ✅ Enviar email de confirmação
- ✅ Associar pedido a usuário (guest ou logado)

**Eventos Importantes:**
```typescript
// payment.approved - Pagamento aprovado
// payment.rejected - Pagamento rejeitado
// merchant_order - Ordem criada/atualizada
```

**Estrutura:**
- Validar X-Signature
- Processar notification_data
- Buscar payment/merchant_order
- Confirmar reserva
- Criar pedido
- Enviar email

---

### **FASE 4: Frontend - Seleção de Método** 🎨

#### 4.1 Modificar `CartDrawer`
**Arquivo:** `src/components/CartDrawer.tsx`

**Mudanças:**
- ✅ Adicionar estado `paymentMethod: 'pix' | 'card' | null`
- ✅ Criar componente de seleção de método
- ✅ Botões visuais para PIX e Cartão
- ✅ Modificar `handleCheckout()` para incluir `paymentMethod`
- ✅ Redirecionar para URL apropriada:
  - PIX → `init_point` do Mercado Pago
  - Cartão → `session.url` do Stripe

**UI Sugerida:**
```
┌─────────────────────────────────┐
│  Escolha a forma de pagamento  │
│                                 │
│  ┌──────────┐  ┌──────────┐   │
│  │   PIX    │  │  Cartão  │   │
│  │  [Icon]  │  │  [Icon]   │   │
│  │          │  │          │   │
│  └──────────┘  └──────────┘   │
│                                 │
│  [Finalizar Compra]            │
└─────────────────────────────────┘
```

#### 4.2 Criar Componente `PaymentMethodSelector`
**Arquivo:** `src/components/checkout/PaymentMethodSelector.tsx`

**Funcionalidades:**
- ✅ Radio buttons ou cards selecionáveis
- ✅ Ícones visuais (PIX e Cartão)
- ✅ Descrições curtas
- ✅ Estado visual de seleção
- ✅ Acessibilidade (ARIA labels)

---

### **FASE 5: Páginas de Sucesso/Falha** ✅

#### 5.1 Modificar `/checkout/success`
**Arquivo:** `src/app/checkout/success/page.tsx`

**Mudanças:**
- ✅ Detectar origem (Stripe ou Mercado Pago) via query params
- ✅ Buscar pedido no banco (mesma tabela `orders`)
- ✅ Exibir informações do pedido
- ✅ Mensagem específica para PIX (se aplicável)

#### 5.2 Criar `/checkout/pending` (Opcional)
**Arquivo:** `src/app/checkout/pending/page.tsx`

**Funcionalidades:**
- ✅ Para pagamentos PIX pendentes
- ✅ Exibir QR Code (se disponível)
- ✅ Instruções de pagamento
- ✅ Link para copiar código PIX

---

### **FASE 6: Banco de Dados** 🗄️

#### 6.1 Modificar Tabela `orders`
**Arquivo:** SQL migration

**Adicionar coluna:**
```sql
ALTER TABLE orders 
ADD COLUMN payment_gateway TEXT DEFAULT 'stripe' 
CHECK (payment_gateway IN ('stripe', 'mercadopago'));

ALTER TABLE orders 
ADD COLUMN payment_gateway_id TEXT; -- ID do pagamento no gateway

CREATE INDEX idx_orders_payment_gateway ON orders(payment_gateway);
CREATE INDEX idx_orders_payment_gateway_id ON orders(payment_gateway_id);
```

**Benefícios:**
- Rastrear origem do pagamento
- Facilitar suporte
- Analytics por gateway

#### 6.2 Manter Estrutura Atual
- ✅ Tabela `orders` (mesma estrutura)
- ✅ Tabela `order_items` (mesma estrutura)
- ✅ Tabela `inventory_reservations` (mesma estrutura)
- ✅ Sistema de reserva funciona para ambos

---

### **FASE 7: Validações e Segurança** 🔒

#### 7.1 Validações Compartilhadas
- ✅ Reutilizar `validateCartItems()`
- ✅ Reutilizar `validateSubtotal()`
- ✅ Reutilizar reserva de estoque
- ✅ Mesmas constantes de segurança

#### 7.2 Segurança Mercado Pago
- ✅ Validar X-Signature no webhook
- ✅ Verificar status do pagamento
- ✅ Idempotência (evitar processar 2x)
- ✅ Timeout e retries

#### 7.3 CPF Collection
- ✅ Incluir CPF no payer do Mercado Pago
- ✅ Mesma validação do Stripe
- ✅ Salvar no pedido

---

## 🎨 Sugestões de UX/UI

### 1. Seleção de Método de Pagamento

**Opção A: Cards Selecionáveis (Recomendado)**
```
┌─────────────────────────────────────┐
│  Como deseja pagar?                  │
│                                       │
│  ┌──────────────┐  ┌──────────────┐ │
│  │  💳 PIX      │  │  💳 Cartão   │ │
│  │              │  │              │ │
│  │  Aprovação   │  │  Visa, MC,   │ │
│  │  instantânea │  │  Elo, Amex   │ │
│  │              │  │              │ │
│  │  [Selecionado]│ │              │ │
│  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────┘
```

**Opção B: Radio Buttons Simples**
```
○ PIX - Aprovação instantânea
● Cartão de Crédito/Débito
```

### 2. Feedback Visual
- ✅ Loading state durante criação de checkout
- ✅ Mensagens de erro claras
- ✅ Confirmação visual de método selecionado

### 3. Mobile-First
- ✅ Cards grandes para toque fácil
- ✅ Ícones claros
- ✅ Texto legível

---

## 🔄 Fluxo de Dados

### Checkout PIX (Mercado Pago)
```
1. Usuário seleciona PIX
2. Frontend → POST /api/checkout { paymentMethod: 'pix', ... }
3. Backend:
   - Valida carrinho
   - Reserva estoque
   - Cria preferência MP
   - Retorna init_point
4. Frontend → Redireciona para init_point
5. Usuário paga no MP
6. MP → POST /api/webhooks/mercadopago
7. Backend:
   - Valida assinatura
   - Confirma reserva
   - Cria pedido
   - Envia email
8. MP → Redireciona para /checkout/success
```

### Checkout Cartão (Stripe) - Mantém Atual
```
1. Usuário seleciona Cartão
2. Frontend → POST /api/checkout { paymentMethod: 'card', ... }
3. Backend:
   - Valida carrinho
   - Reserva estoque
   - Cria sessão Stripe
   - Retorna session.url
4. Frontend → Redireciona para session.url
5. Usuário paga no Stripe
6. Stripe → POST /api/webhooks/stripe
7. Backend:
   - Processa evento
   - Confirma reserva
   - Cria pedido
   - Envia email
8. Stripe → Redireciona para /checkout/success
```

---

## 📝 Checklist de Implementação

### Setup
- [ ] Instalar `mercadopago` SDK
- [ ] Adicionar variáveis de ambiente
- [ ] Criar `src/lib/mercadopago.ts`
- [ ] Configurar webhook no dashboard do MP

### Backend
- [ ] Modificar `/api/checkout` para aceitar `paymentMethod`
- [ ] Criar `/api/checkout/mercadopago`
- [ ] Criar `/api/webhooks/mercadopago`
- [ ] Testar reserva de estoque para ambos
- [ ] Testar criação de pedidos para ambos

### Frontend
- [ ] Criar `PaymentMethodSelector` component
- [ ] Modificar `CartDrawer` para incluir seleção
- [ ] Atualizar `handleCheckout()` para ambos métodos
- [ ] Testar redirecionamentos

### Banco de Dados
- [ ] Adicionar coluna `payment_gateway` em `orders`
- [ ] Adicionar coluna `payment_gateway_id` em `orders`
- [ ] Criar índices
- [ ] Migrar dados existentes (se necessário)

### Testes
- [ ] Testar checkout PIX completo
- [ ] Testar checkout Cartão (regressão)
- [ ] Testar webhooks
- [ ] Testar reserva de estoque
- [ ] Testar guest checkout (ambos)
- [ ] Testar usuário logado (ambos)
- [ ] Testar CPF collection (ambos)

### Documentação
- [ ] Atualizar `.env.example`
- [ ] Documentar configuração do MP
- [ ] Documentar webhook setup
- [ ] Criar guia de troubleshooting

---

## ⚠️ Considerações Importantes

### 1. Reserva de Estoque
- ✅ **Mesma lógica** para ambos os gateways
- ✅ Reservar ANTES de criar checkout
- ✅ Liberar se checkout falhar
- ✅ Confirmar no webhook

### 2. Idempotência
- ✅ Verificar se pedido já existe antes de criar
- ✅ Usar `payment_gateway_id` como chave única
- ✅ Evitar processar webhook 2x

### 3. CPF Collection
- ✅ PIX: Incluir no `payer.identification`
- ✅ Cartão: Manter `custom_fields` do Stripe
- ✅ Salvar no mesmo campo `customer_cpf`

### 4. Email de Confirmação
- ✅ Reutilizar função existente
- ✅ Mesmo template para ambos
- ✅ Incluir método de pagamento no email

### 5. Analytics
- ✅ Rastrear conversão por método
- ✅ Métricas de abandono
- ✅ Taxa de sucesso por gateway

---

## 🚀 Ordem de Implementação Recomendada

1. **FASE 1** - Setup (dependências, env vars, cliente MP)
2. **FASE 6** - Banco de dados (migration)
3. **FASE 2** - Backend APIs (checkout MP, modificar checkout Stripe)
4. **FASE 3** - Webhook MP
5. **FASE 4** - Frontend (seleção de método)
6. **FASE 5** - Páginas de sucesso
7. **FASE 7** - Validações e testes

---

## 📚 Recursos e Documentação

### Mercado Pago
- [SDK Node.js](https://www.mercadopago.com.br/developers/pt/docs/sdk/server-side/nodejs)
- [API de Preferências](https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [PIX](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/accept-pix-payments)

### Stripe (Manter)
- Documentação atual já implementada

---

## ✅ Próximos Passos

Após aprovação deste plano:

1. Revisar e ajustar conforme necessário
2. Confirmar variáveis de ambiente disponíveis
3. Iniciar implementação pela FASE 1
4. Testar incrementalmente cada fase
5. Deploy gradual (testar em staging primeiro)

---

**Status:** 📋 **PLANO PRONTO PARA REVISÃO**

**Última atualização:** 26 de Janeiro de 2026
