# 🚀 Quick Start - Sistema de Estoque VIOS Labs

## ⚡ Implementação em 5 Passos

### 1️⃣ Executar Script SQL (5 minutos)

```bash
# Acessar Supabase Dashboard → SQL Editor
# Copiar e colar o conteúdo de: inventory_system_setup.sql
# Executar o script
```

**O script cria:**
- ✅ Tabela `products` (5 produtos VIOS)
- ✅ Tabela `inventory` (100 unidades cada)
- ✅ Tabela `inventory_reservations`
- ✅ Tabela `inventory_movements`
- ✅ 4 funções PostgreSQL
- ✅ 1 view `inventory_status`
- ✅ Políticas RLS

---

### 2️⃣ Verificar Variáveis de Ambiente

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # ⚠️ Service Role Key (não expor!)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

### 3️⃣ Testar APIs (2 minutos)

```bash
# 1. Consultar estoque
curl http://localhost:3000/api/inventory/status

# 2. Verificar no Supabase Table Editor
# Tables → inventory_status (deve mostrar 5 produtos com 100 unidades cada)
```

---

### 4️⃣ Fazer Checkout de Teste (5 minutos)

```bash
# 1. Abrir http://localhost:3000
# 2. Adicionar produto ao carrinho
# 3. Finalizar compra
# 4. Pagar com cartão de teste: 4242 4242 4242 4242
# 5. Verificar estoque no Supabase
```

**Verificar:**
```sql
-- Reserva criada
SELECT * FROM inventory_reservations ORDER BY created_at DESC LIMIT 1;

-- Estoque reservado
SELECT * FROM inventory WHERE product_id = 'prod_1';
-- reserved_quantity deve ser > 0

-- Após pagamento (webhook processado)
-- stock_quantity deve ter decrementado
```

---

### 5️⃣ Configurar CRON de Limpeza (Opcional, 3 minutos)

#### Opção A: Supabase Edge Function

```typescript
// supabase/functions/cleanup-reservations/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { data } = await supabase.rpc('cleanup_expired_reservations')
  
  return new Response(JSON.stringify({ cleaned: data }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Agendar: Dashboard → Edge Functions → Cron (`*/15 * * * *` = a cada 15 min)

#### Opção B: Executar Manualmente (Desenvolvimento)

```sql
-- No SQL Editor do Supabase
SELECT cleanup_expired_reservations();
```

---

## 📋 Checklist Rápido

- [ ] Script SQL executado com sucesso
- [ ] 5 produtos aparecem em `products`
- [ ] 5 registros aparecem em `inventory` (100 unidades cada)
- [ ] API `/api/inventory/status` retorna dados
- [ ] Checkout de teste funcionou
- [ ] Estoque decrementou após pagamento
- [ ] Webhook `confirm_reservation` executou sem erros

---

## 🧪 Testes Rápidos

### Teste 1: Estoque Insuficiente

```bash
# 1. Tentar comprar 101 unidades (estoque: 100)
# 2. Deve retornar erro: "Estoque insuficiente"
# 3. Nenhuma sessão do Stripe deve ser criada
```

### Teste 2: Reserva Expira

```bash
# 1. Criar checkout mas NÃO pagar
# 2. Verificar reserva ativa:
SELECT * FROM inventory_reservations WHERE status = 'active';

# 3. Forçar expiração:
UPDATE inventory_reservations 
SET expires_at = NOW() - INTERVAL '1 hour'
WHERE status = 'active';

# 4. Executar limpeza:
SELECT cleanup_expired_reservations();

# 5. Verificar que reserva foi marcada como 'expired'
SELECT * FROM inventory_reservations ORDER BY created_at DESC LIMIT 1;
```

---

## 🔍 Consultas Úteis

```sql
-- Estoque atual de todos os produtos
SELECT * FROM inventory_status;

-- Reservas ativas
SELECT 
  p.name,
  ir.quantity,
  ir.expires_at,
  (ir.expires_at - NOW()) AS tempo_restante
FROM inventory_reservations ir
JOIN products p ON p.id = ir.product_id
WHERE ir.status = 'active';

-- Histórico de movimentações (últimas 10)
SELECT 
  p.name,
  im.movement_type,
  im.quantity_change,
  im.created_at
FROM inventory_movements im
JOIN products p ON p.id = im.product_id
ORDER BY im.created_at DESC
LIMIT 10;
```

---

## 🚨 Troubleshooting

### Erro: "Product not found in inventory"

```sql
-- Verificar se o produto existe
SELECT * FROM products WHERE id = 'prod_1';

-- Verificar se tem registro no inventory
SELECT * FROM inventory WHERE product_id = 'prod_1';

-- Se não existir, inserir:
INSERT INTO inventory (product_id, stock_quantity, reserved_quantity)
VALUES ('prod_1', 100, 0);
```

### Erro: "Failed to reserve inventory"

```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'inventory';

-- Verificar permissões da função
SELECT has_function_privilege('reserve_inventory(text,integer,text,text,uuid)', 'execute');
```

### Estoque não atualizou após pagamento

```sql
-- Verificar logs do webhook (Terminal do dev server)
-- Procurar por: "✅ Inventory reservation confirmed"

-- Verificar se a reserva existe
SELECT * FROM inventory_reservations 
WHERE stripe_session_id = 'cs_test_xxxxx';

-- Se não existe, o checkout foi feito antes de implementar o sistema
-- Nesse caso, é normal não ter reserva
```

---

## 📚 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `inventory_system_setup.sql` | Script SQL completo do sistema |
| `INVENTORY_SYSTEM.md` | Documentação completa (arquitetura, APIs, testes) |
| `INVENTORY_QUICK_START.md` | Este guia rápido |
| `src/types/database.ts` | Interfaces TypeScript atualizadas |
| `src/constants/products.ts` | Interface Product atualizada |
| `src/app/api/inventory/status/route.ts` | API de consulta de estoque |
| `src/app/api/inventory/reserve/route.ts` | API de reserva de estoque |
| `src/app/api/checkout/route.ts` | Checkout com reserva de estoque |
| `src/app/api/webhooks/stripe/route.ts` | Webhook com confirmação de reserva |

---

## ✅ Pronto para Produção!

**Deploy Checklist:**

- [ ] Executar script SQL no Supabase de produção
- [ ] Configurar estoque inicial (100 unidades ou quantidade desejada)
- [ ] Atualizar variáveis de ambiente na Vercel (produção)
- [ ] Webhook do Stripe configurado (produção)
- [ ] Testar checkout completo em produção
- [ ] Agendar CRON de limpeza de reservas
- [ ] Monitorar logs por 24h

---

## 🎉 Sistema Ativo!

Seu e-commerce agora tem controle enterprise-grade de estoque:
- ✅ Proteção contra overselling
- ✅ Reservas temporárias (1 hora)
- ✅ Auditoria completa
- ✅ Sincronização automática com Stripe

**Dúvidas?** Consulte `INVENTORY_SYSTEM.md` para documentação completa.
