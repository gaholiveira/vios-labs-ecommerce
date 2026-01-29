# 💳 Configuração Mercado Pago - PIX

**Data:** 26 de Janeiro de 2026  
**Status:** ✅ **ESTRUTURA IMPLEMENTADA - AGUARDANDO CONFIGURAÇÃO**

---

## 📋 Resumo

A estrutura completa para pagamento via PIX usando Mercado Pago foi implementada. O sistema está **pronto para receber as variáveis de ambiente** assim que a conta do Mercado Pago estiver configurada.

---

## ✅ O que foi implementado

### 1. Cliente Mercado Pago

- ✅ `src/lib/mercadopago.ts` - Cliente configurado com validações
- ✅ Funções de validação de configuração
- ✅ Tratamento de erros robusto

### 2. API Route de Checkout

- ✅ `src/app/api/checkout/mercadopago/route.ts` - Rota completa para PIX
- ✅ Reserva de estoque (mesma lógica do Stripe)
- ✅ Validações de segurança
- ✅ Fallback se não configurado (retorna erro 503)

### 3. Frontend

- ✅ `src/components/checkout/PaymentMethodSelector.tsx` - Componente de seleção
- ✅ `src/components/CartDrawer.tsx` - Integrado com seleção de método
- ✅ UI para escolher entre Cartão e PIX
- ✅ Validação antes de finalizar compra

---

## 🔧 Configuração Necessária

### 1. Instalar Dependência

```bash
pnpm add mercadopago
```

### 2. Variáveis de Ambiente

Adicionar ao `.env` (ou `.env.local`):

```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
```

**Onde encontrar:**

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em "Suas integrações"
3. Selecione sua aplicação (ou crie uma nova)
4. Copie o **Access Token** (Production ou Test)

### 3. Configurar Webhook (Opcional - para produção)

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em "Webhooks"
3. Adicione URL: `https://vioslabs.com.br/api/webhooks/mercadopago`
4. Selecione eventos:
   - `payment`
   - `merchant_order`

**Nota:** O webhook será implementado depois. Por enquanto, a estrutura está pronta.

---

## 🛡️ Segurança e Robustez

### Validações Implementadas

1. **Validação de Configuração**
   - Verifica se `MERCADOPAGO_ACCESS_TOKEN` existe
   - Retorna erro 503 (Service Unavailable) se não configurado
   - Mensagem amigável ao usuário

2. **Validações de Carrinho**
   - Reutiliza funções do checkout Stripe
   - Valida estrutura, preços, quantidades
   - Previne manipulação de dados

3. **Reserva de Estoque**
   - Reserva ANTES de criar preferência
   - Libera automaticamente em caso de erro
   - Mesma lógica robusta do Stripe

4. **Error Handling**
   - Logs estruturados
   - Mensagens amigáveis
   - Fallbacks para produção

---

## 🔄 Fluxo de Funcionamento

### Com Mercado Pago Configurado

```
1. Usuário seleciona PIX no carrinho
2. Frontend → POST /api/checkout/mercadopago { paymentMethod: 'pix', ... }
3. Backend:
   - Valida configuração ✅
   - Valida carrinho ✅
   - Reserva estoque ✅
   - Cria preferência MP ✅
   - Retorna init_point ✅
4. Frontend → Redireciona para init_point
5. Usuário paga no MP
6. MP → Redireciona para /checkout/success
```

### Sem Mercado Pago Configurado (Fallback)

```
1. Usuário seleciona PIX no carrinho
2. Frontend → POST /api/checkout/mercadopago { paymentMethod: 'pix', ... }
3. Backend:
   - Detecta que não está configurado ❌
   - Retorna erro 503 com mensagem amigável
4. Frontend:
   - Mostra mensagem: "Mercado Pago não está disponível no momento"
   - Usuário pode escolher outra forma de pagamento
```

---

## 📝 Estrutura de Dados

### Request Body

```typescript
{
  items: CartItem[];
  userId?: string;
  customerEmail?: string;
  paymentMethod: 'pix' | 'card';
  installmentOption?: '1x' | '2x' | '3x'; // Para futuro uso
}
```

### Response (Sucesso)

```typescript
{
  url: string; // init_point do Mercado Pago
  preference_id: string; // ID da preferência criada
}
```

### Response (Erro)

```typescript
{
  error: string; // Mensagem de erro
  details?: string[]; // Detalhes (apenas em desenvolvimento)
}
```

---

## 🧪 Testes

### Teste 1: Sem Configuração (Fallback)

1. Não adicionar `MERCADOPAGO_ACCESS_TOKEN` no `.env`
2. Tentar fazer checkout com PIX
3. ✅ Deve retornar erro 503 com mensagem amigável
4. ✅ Não deve quebrar a aplicação

### Teste 2: Com Configuração (Produção)

1. Adicionar `MERCADOPAGO_ACCESS_TOKEN` no `.env`
2. Tentar fazer checkout com PIX
3. ✅ Deve criar preferência no Mercado Pago
4. ✅ Deve retornar `init_point` para redirecionamento
5. ✅ Deve reservar estoque corretamente

### Teste 3: Validações

1. Tentar checkout sem selecionar método
2. ✅ Deve mostrar alerta: "Por favor, selecione uma forma de pagamento"
3. Tentar checkout com carrinho vazio
4. ✅ Botão deve estar desabilitado

---

## 🚀 Próximos Passos

### Imediato (Após Configurar Conta)

1. ✅ Adicionar `MERCADOPAGO_ACCESS_TOKEN` ao `.env`
2. ✅ Testar checkout PIX completo
3. ✅ Verificar reserva de estoque

### Futuro (Implementar Depois)

1. ⏳ Criar `/api/webhooks/mercadopago` para processar pagamentos
2. ⏳ Atualizar tabela `orders` com `payment_gateway`
3. ⏳ Implementar parcelamento (2x e 3x) via Mercado Pago
4. ⏳ Adicionar página `/checkout/pending` para PIX pendente

---

## ⚠️ Importante

### Não Quebra em Produção

- ✅ Se `MERCADOPAGO_ACCESS_TOKEN` não estiver configurado:
  - Retorna erro 503 (Service Unavailable)
  - Mensagem amigável ao usuário
  - Sistema continua funcionando normalmente
  - Usuário pode escolher outra forma de pagamento

### Validações Robustas

- ✅ Todas as validações do checkout Stripe foram reutilizadas
- ✅ Reserva de estoque funciona igual ao Stripe
- ✅ Error handling completo
- ✅ Logs estruturados para debug

---

## 📚 Documentação

### Mercado Pago

- [SDK Node.js](https://www.mercadopago.com.br/developers/pt/docs/sdk/server-side/nodejs)
- [Preferências](https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post)
- [PIX](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/accept-pix-payments)

---

## ✅ Checklist

- [x] Cliente Mercado Pago criado
- [x] API route `/api/checkout/mercadopago` criada
- [x] Componente `PaymentMethodSelector` criado
- [x] `CartDrawer` atualizado com seleção
- [x] Validações robustas implementadas
- [x] Fallback para produção (não quebra)
- [ ] Instalar `mercadopago` package (próximo passo)
- [ ] Adicionar `MERCADOPAGO_ACCESS_TOKEN` ao `.env`
- [ ] Testar checkout PIX completo
- [ ] Configurar webhook no dashboard MP

---

**Status:** ✅ **ESTRUTURA COMPLETA - AGUARDANDO CONFIGURAÇÃO**

**Última atualização:** 26 de Janeiro de 2026
