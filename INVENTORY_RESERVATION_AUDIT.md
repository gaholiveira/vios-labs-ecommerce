# 🔍 Auditoria do Sistema de Reserva de Estoque - VIOS Labs
## Data: 25 de Janeiro de 2026

Este documento identifica problemas críticos no sistema de reserva de estoque e propõe soluções robustas.

---

## ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. 🔴 CRÍTICO: Ordem de Operações Incorreta

**Problema:**
```typescript
// ❌ ERRADO: Sessão criada ANTES de reservar estoque
const session = await stripe.checkout.sessions.create({...});

// Depois tenta reservar
for (const item of items) {
  const result = await reserve_inventory(...);
  if (!result.success) {
    // Tenta expirar sessão, mas pode ser tarde demais
    await stripe.checkout.sessions.expire(session.id);
  }
}
```

**Risco:**
- Se reserva falhar, sessão já foi criada
- Usuário pode tentar pagar mesmo sem estoque
- Pode gerar pedidos sem estoque disponível

**Solução:** Reservar estoque ANTES de criar sessão Stripe.

---

### 2. 🔴 CRÍTICO: Falha Silenciosa no Loop

**Problema:**
```typescript
if (error) {
  console.error("[CHECKOUT ERROR] Erro ao reservar estoque:", error);
  continue; // ❌ Continua mesmo com erro!
}
```

**Risco:**
- Se um item falhar ao reservar, o código continua
- Outros itens podem ser reservados
- Sessão é criada parcialmente reservada
- Pode gerar inconsistências

**Solução:** Se qualquer reserva falhar, cancelar todas e retornar erro.

---

### 3. 🟡 MÉDIO: Timeout de 1 Hora Pode Ser Muito Longo

**Problema:**
- Reservas expiram em 1 hora
- Para produtos de alta demanda, estoque fica travado por muito tempo
- Pode impedir vendas legítimas

**Solução:** Reduzir para 15-30 minutos (tempo típico de checkout).

---

### 4. 🟡 MÉDIO: Sem Cleanup Automático Configurado

**Problema:**
- Função `cleanup_expired_reservations()` existe mas não está sendo executada
- Reservas expiradas ficam travando estoque até execução manual

**Solução:** Configurar CRON job ou Edge Function para executar automaticamente.

---

### 5. 🟡 MÉDIO: Sem Tratamento de Webhook Falhado

**Problema:**
- Se webhook falhar após pagamento, reserva fica ativa
- Estoque fica travado até expirar (1 hora)
- Pedido pode não ser criado mas estoque está reservado

**Solução:** Implementar retry logic ou monitoramento de webhooks falhados.

---

### 6. 🟢 BAIXO: Race Condition em Múltiplos Itens

**Problema:**
- Loop sequencial pode causar race conditions se múltiplos usuários compram simultaneamente
- `FOR UPDATE` ajuda, mas pode ser melhorado

**Solução:** Já está usando `FOR UPDATE`, mas pode melhorar com transação.

---

## ✅ SOLUÇÕES RECOMENDADAS

### Solução 1: Reordenar Operações (CRÍTICO)

**Antes:**
1. Criar sessão Stripe
2. Reservar estoque
3. Se falhar, expirar sessão

**Depois:**
1. **Reservar estoque PRIMEIRO** (todos os itens)
2. Se sucesso, criar sessão Stripe
3. Se falhar, liberar reservas e retornar erro

**Benefício:** Garante que sessão só é criada se houver estoque.

---

### Solução 2: Transação para Múltiplos Itens

**Implementação:**
- Reservar todos os itens em uma única transação
- Se qualquer item falhar, rollback de todos
- Garante atomicidade

**Benefício:** Evita reservas parciais.

---

### Solução 3: Reduzir Timeout de Reserva

**Implementação:**
- Mudar de 1 hora para 15-30 minutos
- Ajustar baseado em tempo médio de checkout

**Benefício:** Libera estoque mais rápido.

---

### Solução 4: Configurar Cleanup Automático

**Implementação:**
- Criar API route para cleanup
- Configurar Vercel Cron ou Supabase Edge Function
- Executar a cada 15 minutos

**Benefício:** Limpeza automática de reservas expiradas.

---

### Solução 5: Tratamento de Erros Robusto

**Implementação:**
- Se reserva falhar, liberar todas as reservas já feitas
- Retornar erro claro ao usuário
- Log detalhado para debug

**Benefício:** Evita estoque travado por erros.

---

## 📋 Checklist de Implementação

### Crítico (Imediato)
- [ ] Reordenar: Reservar estoque ANTES de criar sessão
- [ ] Implementar rollback se qualquer reserva falhar
- [ ] Tratamento de erro robusto (não usar `continue`)

### Médio (Curto Prazo)
- [ ] Reduzir timeout de 1h para 15-30min
- [ ] Configurar cleanup automático (CRON)
- [ ] Adicionar monitoramento de webhooks falhados

### Baixo (Médio Prazo)
- [ ] Melhorar logs de auditoria
- [ ] Adicionar métricas de reservas
- [ ] Dashboard de monitoramento

---

## 🎯 Modelo Recomendado (Best Practice)

### Fluxo Ideal:

```
1. Usuário clica "Finalizar Compra"
   ↓
2. VALIDAR E RESERVAR ESTOQUE (TODOS OS ITENS)
   ├─ Se falhar: Retornar erro, não criar sessão
   ├─ Se sucesso: Continuar
   ↓
3. Criar sessão Stripe (apenas se reserva OK)
   ↓
4. Redirecionar para Stripe
   ↓
5. Usuário paga
   ↓
6. Webhook confirma reserva e cria pedido
   ↓
7. Se webhook falhar: Retry ou alerta manual
```

**Princípios:**
- ✅ Reserva ANTES de criar sessão
- ✅ Transação atômica (todos ou nenhum)
- ✅ Timeout adequado (15-30min)
- ✅ Cleanup automático
- ✅ Monitoramento e alertas

---

**Data da Auditoria:** 25 de Janeiro de 2026
**Prioridade:** 🔴 CRÍTICA - Implementar imediatamente
