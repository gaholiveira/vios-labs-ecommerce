# 📦 Guia de Atualização Manual de Estoque - VIOS Labs

## 🎯 Resposta Rápida

**Tabela para atualizar estoque manualmente:** `inventory`

**Campo principal:** `stock_quantity`

---

## 📊 Estrutura da Tabela `inventory`

```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY,
  product_id TEXT UNIQUE,          -- ID do produto (ex: 'prod_1')
  stock_quantity INTEGER,          -- ← ESTOQUE TOTAL (ATUALIZAR AQUI)
  reserved_quantity INTEGER,       -- Quantidade reservada (checkout em andamento)
  low_stock_threshold INTEGER,     -- Alerta de estoque baixo (ex: 10)
  reorder_point INTEGER,           -- Ponto de reposição (ex: 5)
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Campos importantes:**
- ✅ **`stock_quantity`** - Estoque total disponível (ATUALIZAR MANUALMENTE)
- 🔒 **`reserved_quantity`** - Gerenciado automaticamente (NÃO TOCAR)
- 📊 **`available_quantity`** - Calculado: `stock_quantity - reserved_quantity`

---

## ✅ Como Atualizar Estoque Manualmente

### **Método 1: Definir Novo Estoque (Mais Comum)**

```sql
-- Atualizar estoque do produto 'prod_1' para 50 unidades
UPDATE inventory
SET stock_quantity = 50
WHERE product_id = 'prod_1';
```

**Exemplo real:**
```sql
-- Atualizar estoque do VIOS Essentials Kit
UPDATE inventory
SET stock_quantity = 100
WHERE product_id = 'prod_1';
```

---

### **Método 2: Adicionar Estoque (Reabastecimento)**

```sql
-- Adicionar 30 unidades ao estoque atual do 'prod_2'
UPDATE inventory
SET stock_quantity = stock_quantity + 30
WHERE product_id = 'prod_2';
```

**Exemplo real:**
```sql
-- Recebeu 50 unidades do VIOS Precision Serum
UPDATE inventory
SET stock_quantity = stock_quantity + 50
WHERE product_id = 'prod_2';
```

---

### **Método 3: Remover Estoque (Ajuste Manual)**

```sql
-- Remover 10 unidades (produto danificado, por exemplo)
UPDATE inventory
SET stock_quantity = stock_quantity - 10
WHERE product_id = 'prod_3';
```

**Exemplo real:**
```sql
-- 5 unidades do VIOS Advanced System foram danificadas
UPDATE inventory
SET stock_quantity = stock_quantity - 5
WHERE product_id = 'prod_3';
```

---

### **Método 4: Atualizar Múltiplos Produtos**

```sql
-- Atualizar estoque de vários produtos de uma vez
UPDATE inventory
SET stock_quantity = CASE product_id
  WHEN 'prod_1' THEN 100
  WHEN 'prod_2' THEN 75
  WHEN 'prod_3' THEN 50
  WHEN 'prod_4' THEN 120
  WHEN 'prod_5' THEN 80
  ELSE stock_quantity
END
WHERE product_id IN ('prod_1', 'prod_2', 'prod_3', 'prod_4', 'prod_5');
```

---

## 🔍 Consultas Úteis

### **1. Ver Estoque Atual de Todos os Produtos**

```sql
SELECT 
  p.name AS produto,
  p.id AS product_id,
  i.stock_quantity AS estoque_total,
  i.reserved_quantity AS reservado,
  (i.stock_quantity - i.reserved_quantity) AS disponivel,
  i.low_stock_threshold AS alerta_minimo,
  CASE 
    WHEN (i.stock_quantity - i.reserved_quantity) = 0 THEN '🔴 ESGOTADO'
    WHEN (i.stock_quantity - i.reserved_quantity) <= i.low_stock_threshold THEN '🟡 ESTOQUE BAIXO'
    ELSE '🟢 DISPONÍVEL'
  END AS status
FROM inventory i
JOIN products p ON p.id = i.product_id
ORDER BY (i.stock_quantity - i.reserved_quantity) ASC;
```

**Resultado esperado:**
```
produto                | product_id | estoque_total | reservado | disponivel | status
-----------------------|------------|---------------|-----------|------------|------------------
VIOS Essentials Kit    | prod_1     | 100           | 2         | 98         | 🟢 DISPONÍVEL
VIOS Precision Serum   | prod_2     | 5             | 0         | 5          | 🟡 ESTOQUE BAIXO
VIOS Advanced System   | prod_3     | 0             | 0         | 0          | 🔴 ESGOTADO
```

---

### **2. Ver Estoque de Um Produto Específico**

```sql
SELECT 
  p.name,
  i.stock_quantity AS estoque_total,
  i.reserved_quantity AS reservado,
  (i.stock_quantity - i.reserved_quantity) AS disponivel
FROM inventory i
JOIN products p ON p.id = i.product_id
WHERE i.product_id = 'prod_1';
```

---

### **3. Produtos com Estoque Baixo**

```sql
SELECT 
  p.name,
  i.stock_quantity,
  i.reserved_quantity,
  (i.stock_quantity - i.reserved_quantity) AS disponivel,
  i.low_stock_threshold AS minimo
FROM inventory i
JOIN products p ON p.id = i.product_id
WHERE (i.stock_quantity - i.reserved_quantity) <= i.low_stock_threshold
  AND (i.stock_quantity - i.reserved_quantity) > 0
ORDER BY disponivel ASC;
```

---

### **4. Produtos Esgotados**

```sql
SELECT 
  p.name,
  p.id,
  i.stock_quantity,
  i.reserved_quantity
FROM inventory i
JOIN products p ON p.id = i.product_id
WHERE (i.stock_quantity - i.reserved_quantity) = 0
ORDER BY p.name;
```

---

## 🚨 IMPORTANTE: O Que NÃO Fazer

### ❌ **NUNCA atualizar `reserved_quantity` manualmente**

```sql
-- ❌ ERRADO - NÃO FAZER!
UPDATE inventory
SET reserved_quantity = 0
WHERE product_id = 'prod_1';
```

**Por quê?**
- `reserved_quantity` é gerenciado automaticamente pelas funções `reserve_inventory()` e `confirm_reservation()`
- Alterar manualmente pode causar inconsistências e permitir overselling

**Se precisar limpar reservas:**
```sql
-- ✅ CORRETO - Usar a função de limpeza
SELECT cleanup_expired_reservations();
```

---

### ❌ **NUNCA diminuir `stock_quantity` abaixo de `reserved_quantity`**

```sql
-- ❌ ERRADO - Vai causar erro!
UPDATE inventory
SET stock_quantity = 5
WHERE product_id = 'prod_1'
  AND reserved_quantity = 10; -- Reservas > Estoque = ERRO!
```

**Constraint do banco:**
```sql
CHECK (reserved_quantity <= stock_quantity)
```

**Se precisar ajustar:**
```sql
-- 1. Primeiro, ver quantas reservas existem
SELECT reserved_quantity FROM inventory WHERE product_id = 'prod_1';

-- 2. Liberar reservas expiradas
SELECT cleanup_expired_reservations();

-- 3. Depois atualizar o estoque
UPDATE inventory SET stock_quantity = 50 WHERE product_id = 'prod_1';
```

---

## 📋 Workflow Completo de Reabastecimento

### **Cenário: Recebeu 100 unidades do VIOS Essentials Kit**

```sql
-- PASSO 1: Verificar estoque atual
SELECT 
  stock_quantity,
  reserved_quantity,
  (stock_quantity - reserved_quantity) AS disponivel
FROM inventory
WHERE product_id = 'prod_1';

-- Resultado atual: 
-- stock_quantity: 25
-- reserved_quantity: 3
-- disponivel: 22

-- PASSO 2: Adicionar 100 unidades ao estoque
UPDATE inventory
SET stock_quantity = stock_quantity + 100
WHERE product_id = 'prod_1'
RETURNING 
  product_id,
  stock_quantity,
  reserved_quantity,
  (stock_quantity - reserved_quantity) AS disponivel;

-- Resultado após atualização:
-- stock_quantity: 125
-- reserved_quantity: 3 (não muda)
-- disponivel: 122

-- PASSO 3: Verificar se acionou notificação de waitlist
-- (Se produto estava esgotado, trigger notifica automaticamente)
SELECT * FROM product_waitlist WHERE product_id = 'prod_1';
```

---

## 🧪 Exemplos Práticos

### **Exemplo 1: Lançamento de Novo Produto**

```sql
-- 1. Inserir produto na tabela products
INSERT INTO products (id, name, price, description, active)
VALUES (
  'prod_6',
  'VIOS Ultimate Collection',
  899.90,
  'Coleção completa para cuidados premium',
  true
);

-- 2. Inserir estoque inicial (150 unidades)
INSERT INTO inventory (product_id, stock_quantity, reserved_quantity, low_stock_threshold, reorder_point)
VALUES ('prod_6', 150, 0, 20, 10);

-- 3. Verificar
SELECT * FROM inventory WHERE product_id = 'prod_6';
```

---

### **Exemplo 2: Ajuste de Inventário Anual**

```sql
-- Após contagem física de estoque
UPDATE inventory
SET stock_quantity = CASE product_id
  WHEN 'prod_1' THEN 98  -- Contagem física: 98 unidades
  WHEN 'prod_2' THEN 73  -- Contagem física: 73 unidades
  WHEN 'prod_3' THEN 51  -- Contagem física: 51 unidades
  WHEN 'prod_4' THEN 119 -- Contagem física: 119 unidades
  WHEN 'prod_5' THEN 82  -- Contagem física: 82 unidades
  ELSE stock_quantity
END
WHERE product_id IN ('prod_1', 'prod_2', 'prod_3', 'prod_4', 'prod_5');

-- Registrar auditoria (opcional)
INSERT INTO inventory_movements (
  product_id,
  movement_type,
  quantity_change,
  quantity_before,
  quantity_after,
  reason,
  created_by
)
SELECT 
  product_id,
  'adjustment',
  (CASE product_id
    WHEN 'prod_1' THEN 98
    WHEN 'prod_2' THEN 73
    WHEN 'prod_3' THEN 51
    WHEN 'prod_4' THEN 119
    WHEN 'prod_5' THEN 82
  END) - stock_quantity,
  stock_quantity,
  CASE product_id
    WHEN 'prod_1' THEN 98
    WHEN 'prod_2' THEN 73
    WHEN 'prod_3' THEN 51
    WHEN 'prod_4' THEN 119
    WHEN 'prod_5' THEN 82
  END,
  'Ajuste de inventário anual',
  'admin'
FROM inventory
WHERE product_id IN ('prod_1', 'prod_2', 'prod_3', 'prod_4', 'prod_5');
```

---

### **Exemplo 3: Produto Danificado**

```sql
-- 8 unidades do VIOS Precision Serum danificadas no transporte
UPDATE inventory
SET stock_quantity = stock_quantity - 8
WHERE product_id = 'prod_2'
RETURNING 
  product_id,
  stock_quantity AS estoque_atualizado;

-- Registrar na auditoria
INSERT INTO inventory_movements (
  product_id,
  movement_type,
  quantity_change,
  quantity_before,
  quantity_after,
  reason,
  created_by
)
VALUES (
  'prod_2',
  'adjustment',
  -8,
  (SELECT stock_quantity + 8 FROM inventory WHERE product_id = 'prod_2'),
  (SELECT stock_quantity FROM inventory WHERE product_id = 'prod_2'),
  'Produtos danificados no transporte',
  'admin'
);
```

---

## 🔄 Integração com Sistema Automático

**O sistema gerencia automaticamente:**

1. ✅ **Reserva de estoque** - Durante checkout (função `reserve_inventory()`)
2. ✅ **Confirmação de venda** - Após pagamento (função `confirm_reservation()`)
3. ✅ **Liberação de reservas** - Checkout abandonado (função `cleanup_expired_reservations()`)
4. ✅ **Auditoria** - Todas as movimentações (tabela `inventory_movements`)
5. ✅ **Notificação de waitlist** - Produto volta ao estoque (trigger automático)

**Você gerencia manualmente:**

1. ✅ Reabastecimento (`UPDATE inventory SET stock_quantity = ...`)
2. ✅ Ajustes de inventário (perdas, danos, doações)
3. ✅ Novos produtos (INSERT INTO inventory)
4. ✅ Configuração de alertas (`low_stock_threshold`, `reorder_point`)

---

## 📈 View Consolidada (Uso Recomendado)

```sql
-- Usar a view inventory_status para ver estoque consolidado
SELECT * FROM inventory_status;
```

**Estrutura da view:**
```sql
CREATE VIEW inventory_status AS
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  p.price,
  p.active,
  i.stock_quantity,
  i.reserved_quantity,
  (i.stock_quantity - i.reserved_quantity) AS available_quantity,
  CASE 
    WHEN (i.stock_quantity - i.reserved_quantity) = 0 THEN 'out_of_stock'
    WHEN (i.stock_quantity - i.reserved_quantity) <= i.low_stock_threshold THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status,
  i.low_stock_threshold,
  i.reorder_point,
  i.updated_at
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
WHERE p.active = true;
```

---

## ✅ Checklist de Atualização Manual

Ao atualizar estoque manualmente, sempre:

- [ ] Verificar estoque atual antes de atualizar
- [ ] Confirmar o `product_id` correto
- [ ] Garantir que `stock_quantity >= reserved_quantity`
- [ ] Usar transações se atualizar múltiplos produtos
- [ ] Registrar motivo da alteração (comentário ou auditoria)
- [ ] Verificar se acionou notificação de waitlist (se produto estava esgotado)
- [ ] Conferir estoque disponível após atualização

---

## 🎉 Resumo Rápido

| Ação | SQL |
|------|-----|
| **Ver estoque atual** | `SELECT * FROM inventory_status;` |
| **Definir novo estoque** | `UPDATE inventory SET stock_quantity = 100 WHERE product_id = 'prod_1';` |
| **Adicionar estoque** | `UPDATE inventory SET stock_quantity = stock_quantity + 50 WHERE product_id = 'prod_1';` |
| **Remover estoque** | `UPDATE inventory SET stock_quantity = stock_quantity - 10 WHERE product_id = 'prod_1';` |
| **Novo produto** | `INSERT INTO inventory (product_id, stock_quantity) VALUES ('prod_6', 150);` |

---

**⚠️ REGRA DE OURO:**
- ✅ Atualizar: `stock_quantity` (estoque total)
- ❌ Não tocar: `reserved_quantity` (gerenciado pelo sistema)

---

**Última atualização:** 2026-01-21  
**Versão:** 1.0.0  
**Status:** ✅ Guia Completo
