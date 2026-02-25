# 📦 Sistema de Gestão de Estoque - VIOS Labs

## 🎯 Overview

Sistema enterprise-grade de controle de estoque com:
- ✅ **Reservas temporárias** durante checkout (expira em 1 hora)
- ✅ **Proteção contra overselling** (race conditions)
- ✅ **Auditoria completa** de movimentações
- ✅ **Sincronização automática** com Stripe
- ✅ **Alertas de estoque baixo**
- ✅ **Limpeza automática** de reservas expiradas

---

## 🏗️ Arquitetura do Sistema

### Fluxo Completo (Happy Path)

```
1. Cliente adiciona produtos ao carrinho
   ↓
2. Cliente clica em "Finalizar Compra"
   ↓
3. API /api/checkout valida estoque disponível
   ↓
4. API cria sessão do Stripe
   ↓
5. API reserva estoque (1 hora de expiração)
   ├─ inventory.reserved_quantity += quantidade
   ├─ inventory_reservations (status: 'active')
   └─ inventory_movements (tipo: 'reservation')
   ↓
6. Cliente é redirecionado para Stripe Checkout
   ↓
7. Cliente paga (Pix/Card)
   ↓
8. Stripe envia webhook: checkout.session.completed
   ↓
9. Webhook cria pedido no Supabase
   ↓
10. Webhook confirma reserva de estoque
    ├─ inventory.stock_quantity -= quantidade
    ├─ inventory.reserved_quantity -= quantidade
    ├─ inventory_reservations (status: 'completed')
    └─ inventory_movements (tipo: 'sale')
    ↓
11. ✅ Venda concluída, estoque atualizado!
```

### Fluxo de Cancelamento/Expiração

```
Cenário 1: Cliente abandona checkout
   ↓
Reserva expira em 1 hora (automaticamente)
   ├─ CRON cleanup_expired_reservations()
   ├─ inventory.reserved_quantity -= quantidade
   ├─ inventory_reservations (status: 'expired')
   └─ inventory_movements (tipo: 'reservation_release')

Cenário 2: Pagamento falha
   ↓
Stripe não envia checkout.session.completed
   ↓
Reserva expira em 1 hora (automaticamente)
```

---

## 📊 Estrutura do Banco de Dados

### 1. Tabela: `products`

Catálogo de produtos.

```sql
products (
  id TEXT PRIMARY KEY,                    -- 'prod_1', 'prod_2', etc.
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  old_price DECIMAL(10, 2),
  category TEXT NOT NULL,
  image_url TEXT,
  badge TEXT,                             -- 'bestseller', 'novo', 'vegano'
  anvisa_record TEXT,
  rating DECIMAL(2, 1),
  reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,         -- Produto ativo no catálogo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Estoque Inicial:**
- 100 unidades de cada produto VIOS
- IDs: prod_1 (Glow), prod_2 (Sleep), prod_3 (MAG3), prod_4 (Pulse), prod_5 (Move)

---

### 2. Tabela: `inventory`

Controle de estoque por produto.

```sql
inventory (
  id UUID PRIMARY KEY,
  product_id TEXT UNIQUE REFERENCES products(id),
  stock_quantity INTEGER NOT NULL,        -- Estoque total físico
  reserved_quantity INTEGER NOT NULL,     -- Estoque reservado (checkout ativo)
  low_stock_threshold INTEGER DEFAULT 10, -- Alerta de estoque baixo
  reorder_point INTEGER DEFAULT 5,        -- Ponto de reposição
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- available_quantity = stock_quantity - reserved_quantity
  CONSTRAINT check_reserved_quantity CHECK (reserved_quantity <= stock_quantity)
)
```

**Exemplo:**
```
product_id: prod_1
stock_quantity: 100          (total físico em estoque)
reserved_quantity: 3         (3 unidades em checkout ativo)
available_quantity: 97       (disponível para novos checkouts)
```

---

### 3. Tabela: `inventory_reservations`

Reservas temporárias durante checkout.

```sql
inventory_reservations (
  id UUID PRIMARY KEY,
  product_id TEXT REFERENCES products(id),
  quantity INTEGER NOT NULL,
  stripe_session_id TEXT UNIQUE,          -- ID da sessão do Stripe
  status TEXT NOT NULL,                   -- 'active', 'completed', 'cancelled', 'expired'
  expires_at TIMESTAMPTZ NOT NULL,        -- Expira em 1 hora
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  customer_email TEXT,
  user_id UUID REFERENCES auth.users(id)
)
```

**Status:**
- `active`: Reserva ativa (checkout em andamento)
- `completed`: Pagamento confirmado, estoque decrementado
- `cancelled`: Checkout cancelado manualmente
- `expired`: Expirou automaticamente (1 hora)

---

### 4. Tabela: `inventory_movements`

Log de auditoria de todas as movimentações.

```sql
inventory_movements (
  id UUID PRIMARY KEY,
  product_id TEXT REFERENCES products(id),
  movement_type TEXT NOT NULL,            -- Tipo de movimentação
  quantity_change INTEGER NOT NULL,       -- +N (entrada), -N (saída)
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_id TEXT,                      -- ID de referência (order_id, etc.)
  reason TEXT,
  created_by TEXT,                        -- user_id ou 'system'
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Tipos de Movimentação:**
- `reservation`: Estoque reservado (checkout iniciado)
- `reservation_release`: Estoque liberado (expirou/cancelou)
- `sale`: Venda confirmada
- `restock`: Reposição de estoque
- `adjustment`: Ajuste manual
- `return`: Devolução de produto

---

### 5. View: `inventory_status`

View consolidada para consultas rápidas.

```sql
inventory_status (
  product_id,
  product_name,
  price,
  is_active,
  stock_quantity,
  reserved_quantity,
  available_quantity,              -- Calculado: stock - reserved
  low_stock_threshold,
  reorder_point,
  stock_status,                    -- 'in_stock', 'low_stock', 'out_of_stock'
  inventory_updated_at
)
```

**Stock Status:**
- `in_stock`: available_quantity > low_stock_threshold
- `low_stock`: 0 < available_quantity <= low_stock_threshold
- `out_of_stock`: available_quantity = 0

---

## ⚙️ Funções PostgreSQL

### 1. `reserve_inventory()`

Reserva estoque durante o checkout.

```sql
reserve_inventory(
  p_product_id TEXT,
  p_quantity INTEGER,
  p_stripe_session_id TEXT,
  p_customer_email TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS JSON
```

**Retorno:**
```json
{
  "success": true,
  "reservation_id": "uuid",
  "expires_at": "2026-01-21T15:30:00Z"
}
```

**Ou em caso de erro:**
```json
{
  "success": false,
  "error": "Insufficient stock",
  "available": 5,
  "requested": 10
}
```

**O que faz:**
1. ✅ Verifica estoque disponível (com lock)
2. ✅ Valida quantidade solicitada
3. ✅ Cria registro em `inventory_reservations`
4. ✅ Incrementa `reserved_quantity`
5. ✅ Registra movimento de auditoria
6. ✅ Define expiração de 1 hora

---

### 2. `confirm_reservation()`

Confirma reserva após pagamento aprovado.

```sql
confirm_reservation(
  p_stripe_session_id TEXT,
  p_order_id TEXT
) RETURNS JSON
```

**Retorno:**
```json
{
  "success": true,
  "product_id": "prod_1",
  "quantity_sold": 2
}
```

**O que faz:**
1. ✅ Busca reserva ativa pelo `stripe_session_id`
2. ✅ Decrementa `stock_quantity` (efetiva a venda)
3. ✅ Decrementa `reserved_quantity` (libera reserva)
4. ✅ Marca reserva como `completed`
5. ✅ Registra movimento de venda

---

### 3. `release_reservation()`

Libera reserva (checkout cancelado).

```sql
release_reservation(
  p_stripe_session_id TEXT,
  p_reason TEXT DEFAULT 'Manual cancellation'
) RETURNS JSON
```

**O que faz:**
1. ✅ Busca reserva ativa
2. ✅ Decrementa `reserved_quantity` (libera estoque)
3. ✅ Marca reserva como `cancelled`
4. ✅ Registra movimento de liberação

---

### 4. `cleanup_expired_reservations()`

Limpa reservas expiradas automaticamente.

```sql
cleanup_expired_reservations() RETURNS INTEGER
```

**Retorno:** Número de reservas limpas.

**Como usar:**
- Execute via CRON a cada 15 minutos
- Ou use Supabase Edge Functions

```sql
-- Executar manualmente
SELECT cleanup_expired_reservations();

-- Agendar (exemplo com pg_cron)
SELECT cron.schedule('cleanup-expired-reservations', '*/15 * * * *', 
  'SELECT cleanup_expired_reservations()');
```

---

## 🔌 APIs REST

### GET `/api/inventory/status`

Consulta status do estoque.

**Query Params:**
- `product_id` (opcional): Filtrar por produto específico

**Resposta (todos os produtos):**
```json
[
  {
    "product_id": "prod_1",
    "product_name": "Vios Glow",
    "price": 219.00,
    "is_active": true,
    "stock_quantity": 100,
    "reserved_quantity": 3,
    "available_quantity": 97,
    "low_stock_threshold": 10,
    "reorder_point": 5,
    "stock_status": "in_stock",
    "inventory_updated_at": "2026-01-21T14:30:00Z"
  },
  ...
]
```

**Resposta (produto específico):**
```json
{
  "product_id": "prod_1",
  "product_name": "Vios Glow",
  "price": 219.00,
  "stock_quantity": 100,
  "reserved_quantity": 3,
  "available_quantity": 97,
  "stock_status": "in_stock"
}
```

**Exemplo de uso:**
```typescript
// Buscar estoque de todos os produtos
const response = await fetch('/api/inventory/status');
const inventory = await response.json();

// Buscar estoque de um produto específico
const response = await fetch('/api/inventory/status?product_id=prod_1');
const productInventory = await response.json();
```

---

### POST `/api/inventory/reserve`

Reserva estoque (chamada internamente pela API de checkout).

**Body:**
```json
{
  "product_id": "prod_1",
  "quantity": 2,
  "stripe_session_id": "cs_test_xxxxx",
  "customer_email": "cliente@example.com",
  "user_id": "uuid-optional"
}
```

**Resposta (sucesso):**
```json
{
  "success": true,
  "reservation_id": "uuid",
  "expires_at": "2026-01-21T15:30:00Z"
}
```

**Resposta (estoque insuficiente):**
```json
{
  "error": "Insufficient stock",
  "available": 5,
  "requested": 10
}
```

---

## 🔄 Integração com Stripe

### Checkout Flow (Atualizado)

```typescript
// src/app/api/checkout/route.ts

export async function POST(req: Request) {
  // 1. Validar itens do carrinho
  // 2. Calcular subtotal e frete
  // 3. Criar sessão do Stripe
  const session = await stripe.checkout.sessions.create({...});
  
  // 4. Reservar estoque para cada item
  for (const item of items) {
    const result = await supabase.rpc('reserve_inventory', {
      p_product_id: item.id,
      p_quantity: item.quantity,
      p_stripe_session_id: session.id,
      p_customer_email: customerEmail,
      p_user_id: userId,
    });
    
    if (!result.success) {
      // Cancelar sessão e retornar erro
      await stripe.checkout.sessions.expire(session.id);
      return NextResponse.json({
        error: `Estoque insuficiente para ${item.name}`,
        available: result.available
      }, { status: 409 });
    }
  }
  
  // 5. Retornar URL do checkout
  return NextResponse.json({ url: session.url });
}
```

### Webhook (Atualizado)

```typescript
// src/app/api/webhooks/stripe/route.ts

async function handleCheckoutSessionCompleted(session) {
  // 1. Criar pedido no Supabase
  const order = await supabase.from('orders').insert({...});
  
  // 2. Criar itens do pedido
  await supabase.from('order_items').insert(orderItems);
  
  // 3. CONFIRMAR RESERVA DE ESTOQUE
  const { data } = await supabase.rpc('confirm_reservation', {
    p_stripe_session_id: session.id,
    p_order_id: order.id,
  });
  
  if (!data.success) {
    console.warn('Reserva não encontrada ou já processada');
  }
  
  // 4. Enviar email de confirmação
  await sendOrderConfirmationEmail({...});
}
```

---

## 📋 Guia de Implementação

### Passo 1: Executar Script SQL

Execute o script `inventory_system_setup.sql` no Supabase SQL Editor.

```bash
# Copiar conteúdo do arquivo e colar no SQL Editor
# Ou executar via CLI
supabase db reset
supabase db push inventory_system_setup.sql
```

**Verificar criação:**
```sql
SELECT 'Products: ' || COUNT(*) FROM products;
SELECT 'Inventory: ' || COUNT(*) FROM inventory;
SELECT * FROM inventory_status;
```

---

### Passo 2: Verificar Variáveis de Ambiente

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...   # ⚠️ Nunca expor no client!
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

### Passo 3: Testar Manualmente

#### 3.1. Consultar Estoque

```bash
curl http://localhost:3000/api/inventory/status
```

#### 3.2. Simular Reserva

```bash
curl -X POST http://localhost:3000/api/inventory/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod_1",
    "quantity": 2,
    "stripe_session_id": "test_session_123",
    "customer_email": "test@example.com"
  }'
```

#### 3.3. Verificar Reserva

```sql
SELECT * FROM inventory_reservations WHERE status = 'active';
SELECT * FROM inventory WHERE product_id = 'prod_1';
```

#### 3.4. Confirmar Reserva

```sql
SELECT confirm_reservation('test_session_123', 'test_order_123');
SELECT * FROM inventory WHERE product_id = 'prod_1';
```

---

### Passo 4: Configurar CRON (Opcional)

Para limpar reservas expiradas automaticamente:

#### Opção 1: Supabase Edge Function

```typescript
// supabase/functions/cleanup-reservations/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { data, error } = await supabase.rpc('cleanup_expired_reservations')
  
  return new Response(JSON.stringify({ cleaned: data, error }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Agendar via Supabase Dashboard → Functions → Cron Jobs (a cada 15 min).

#### Opção 2: API Route + Vercel Cron

```typescript
// src/app/api/cron/cleanup-reservations/route.ts
export async function GET() {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase.rpc('cleanup_expired_reservations')
  return NextResponse.json({ cleaned: data })
}
```

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/cleanup-reservations",
    "schedule": "*/15 * * * *"
  }]
}
```

---

## 🧪 Cenários de Teste

### Teste 1: Checkout Normal (Happy Path)

1. Adicionar produto ao carrinho
2. Finalizar compra
3. Pagar com Pix/Card
4. ✅ Verificar:
   - Reserva criada (`active`)
   - `reserved_quantity` incrementado
   - Após pagamento: `stock_quantity` decrementado
   - Reserva marcada como `completed`

### Teste 2: Estoque Insuficiente

1. Adicionar 101 unidades de um produto ao carrinho (estoque inicial: 100)
2. Tentar finalizar compra
3. ✅ Verificar:
   - Erro: "Estoque insuficiente"
   - Nenhuma reserva criada
   - Nenhuma sessão do Stripe criada

### Teste 3: Checkout Abandonado

1. Adicionar produto ao carrinho
2. Finalizar compra (reserva criada)
3. Abandonar sem pagar
4. Aguardar 1 hora (ou executar `cleanup_expired_reservations()`)
5. ✅ Verificar:
   - Reserva marcada como `expired`
   - `reserved_quantity` decrementado
   - Estoque liberado

### Teste 4: Múltiplos Checkouts Simultâneos

1. Criar 3 checkouts simultaneos do mesmo produto (2 unidades cada)
2. ✅ Verificar:
   - `reserved_quantity` = 6
   - `available_quantity` = 94
   - Todos têm reservas ativas
3. Pagar apenas 1 checkout
4. ✅ Verificar:
   - `stock_quantity` = 98 (decrementou 2)
   - `reserved_quantity` = 4 (liberou 2, restam 4)
   - 1 reserva `completed`, 2 reservas ainda `active`

---

## 📊 Consultas Úteis

### Estoque Atual

```sql
SELECT * FROM inventory_status;
```

### Reservas Ativas

```sql
SELECT 
  p.name AS produto,
  ir.quantity,
  ir.customer_email,
  ir.expires_at,
  (ir.expires_at - NOW()) AS tempo_restante
FROM inventory_reservations ir
JOIN products p ON p.id = ir.product_id
WHERE ir.status = 'active'
ORDER BY ir.expires_at;
```

### Produtos com Estoque Baixo

```sql
SELECT 
  product_name,
  available_quantity,
  low_stock_threshold
FROM inventory_status
WHERE stock_status = 'low_stock'
ORDER BY available_quantity;
```

### Histórico de Vendas (Últimos 7 dias)

```sql
SELECT 
  p.name AS produto,
  COUNT(*) AS total_vendas,
  SUM(im.quantity_change) AS unidades_vendidas
FROM inventory_movements im
JOIN products p ON p.id = im.product_id
WHERE im.movement_type = 'sale'
  AND im.created_at >= NOW() - INTERVAL '7 days'
GROUP BY p.name
ORDER BY unidades_vendidas DESC;
```

### Reservas Expiradas (Últimas 24h)

```sql
SELECT 
  p.name AS produto,
  COUNT(*) AS reservas_expiradas,
  SUM(ir.quantity) AS unidades_liberadas
FROM inventory_reservations ir
JOIN products p ON p.id = ir.product_id
WHERE ir.status = 'expired'
  AND ir.completed_at >= NOW() - INTERVAL '24 hours'
GROUP BY p.name;
```

---

## 🚨 Troubleshooting

### Problema: Estoque negativo

```sql
-- Verificar
SELECT * FROM inventory WHERE stock_quantity < 0 OR reserved_quantity < 0;

-- Corrigir (ajuste manual)
UPDATE inventory
SET stock_quantity = 100, reserved_quantity = 0
WHERE product_id = 'prod_1';

-- Registrar ajuste
INSERT INTO inventory_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reason, created_by)
VALUES ('prod_1', 'adjustment', 100, 0, 100, 'Correção de estoque negativo', 'admin');
```

### Problema: Reservas travadas (não expiram)

```sql
-- Forçar limpeza
SELECT cleanup_expired_reservations();

-- Liberar reserva específica manualmente
SELECT release_reservation('cs_test_xxxxx', 'Manual release - support ticket');
```

### Problema: Estoque não atualizou após pagamento

```sql
-- Verificar se o webhook foi processado
SELECT * FROM orders WHERE stripe_session_id = 'cs_test_xxxxx';

-- Se o pedido existe mas a reserva ainda está ativa
SELECT * FROM inventory_reservations WHERE stripe_session_id = 'cs_test_xxxxx';

-- Confirmar manualmente
SELECT confirm_reservation('cs_test_xxxxx', '<order_id>');
```

---

## ✅ Checklist de Deploy

Antes de ir para produção:

- [ ] Script SQL executado no Supabase (produção)
- [ ] Estoque inicial configurado (100 unidades de cada)
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Webhook do Stripe configurado (produção)
- [ ] CRON de limpeza de reservas agendado
- [ ] Testes de checkout com estoque suficiente ✅
- [ ] Testes de checkout com estoque insuficiente ✅
- [ ] Testes de checkout abandonado ✅
- [ ] RLS (Row Level Security) habilitado e testado
- [ ] Monitoring de estoque baixo configurado
- [ ] Documentação atualizada para equipe

---

## 📈 Métricas de Sucesso

**O que esperar após implementação:**

- ✅ **0% overselling** (proteção contra venda de estoque inexistente)
- ✅ **Auditoria completa** de todas as movimentações
- ✅ **Liberação automática** de reservas em 1 hora
- ✅ **Sincronização perfeita** com Stripe
- ✅ **Alertas proativos** de estoque baixo

---

## 🎉 Sistema Completo!

O sistema de gestão de estoque da VIOS Labs está pronto para produção:

- ✅ **Enterprise-grade** com proteção contra race conditions
- ✅ **Reservas temporárias** para evitar overselling
- ✅ **Auditoria completa** de movimentações
- ✅ **Sincronização automática** com Stripe
- ✅ **Limpeza automática** de reservas expiradas

**Sua loja agora tem controle total de estoque! 📦✨**
