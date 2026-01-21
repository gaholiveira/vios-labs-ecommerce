# 🇧🇷 Guia Rápido: Ativar Pix no Stripe

## ⚠️ Problema Comum: "Não vejo a opção de Pix no checkout"

Se você não está vendo o Pix como opção de pagamento, siga este guia.

---

## ✅ Solução Rápida (2 minutos)

### **Passo 1: Verificar se o Pix está habilitado no Stripe**

#### **Modo de Teste (Development):**

1. Acesse: https://dashboard.stripe.com/test/settings/payment_methods
2. Procure por **"Pix"** na lista de métodos de pagamento
3. Se estiver **desabilitado**, clique em **"Turn on"**

#### **Modo de Produção:**

1. Acesse: https://dashboard.stripe.com/settings/payment_methods
2. Procure por **"Pix"** na lista
3. Se estiver **desabilitado**, clique em **"Turn on"**

---

### **Passo 2: Configurar Pix no Dashboard**

Após habilitar o Pix:

1. Clique em **"Pix"** na lista de métodos
2. Configure:
   - **Status:** ✅ Enabled
   - **Statement descriptor:** `VIOS Labs` (aparece no extrato do cliente)
   - **Expiration:** 1 hora (padrão, não alterável)

3. Clique em **"Save"**

---

### **Passo 3: Verificar dados da empresa**

O Pix no Stripe requer que sua conta tenha:

1. **CNPJ válido** cadastrado
2. **Razão Social** completa
3. **Endereço** verificado

**Verificar:**
1. Acesse: https://dashboard.stripe.com/settings/public_details
2. Confirme que todos os dados estão preenchidos:
   - ✅ Business name: `Isadora Matos Ferreira LTDA`
   - ✅ Tax ID (CNPJ): `62.463.131/0001-62`
   - ✅ Endereço completo

---

## 🧪 Testar Pix (Modo de Teste)

### **Opção 1: Via Interface do Stripe**

1. Fazer checkout no seu site (modo test)
2. Na tela do Stripe Checkout, você deve ver:
   - 💳 **Card**
   - ⚡ **Pix**
   - 📄 **Boleto**

3. Selecionar **Pix**
4. QR Code será gerado
5. Usar botão **"Simulate payment"** para simular pagamento (test mode)

### **Opção 2: Forçar Pix via Código**

Já implementamos no código! A linha:
```typescript
payment_method_types: ['card', 'pix', 'boleto'],
```

Garante que o Pix sempre apareça como opção.

---

## 🔍 Troubleshooting

### **Problema 1: "Pix não aparece mesmo habilitado no Dashboard"**

**Causa:** Stripe pode estar bloqueando por conta de dados incompletos.

**Solução:**
1. Verificar se o CNPJ está validado
2. Verificar se há pendências no Dashboard (ícone de notificação)
3. Entrar em contato com suporte do Stripe se persistir

---

### **Problema 2: "Erro ao criar sessão com Pix"**

**Causa:** Stripe API pode rejeitar se a conta não está aprovada para Pix.

**Solução:**
```typescript
// Remover temporariamente 'pix' e testar apenas com card
payment_method_types: ['card'], // Testar sem Pix primeiro

// Se card funcionar, o problema é a aprovação do Pix no Stripe
// Entrar em contato com suporte do Stripe
```

---

### **Problema 3: "Pix funciona em test mode, mas não em produção"**

**Causa:** Pix precisa ser habilitado separadamente em cada modo.

**Solução:**
1. Alternar para **Live mode** no Dashboard (toggle no canto superior direito)
2. Settings → Payment Methods → Pix → **Enable**
3. Salvar

---

## 📋 Checklist de Ativação do Pix

- [ ] Pix habilitado no Dashboard (test mode)
- [ ] Pix habilitado no Dashboard (live mode)
- [ ] CNPJ validado no Stripe
- [ ] Razão Social cadastrada
- [ ] Endereço completo cadastrado
- [ ] Statement descriptor configurado ("VIOS Labs")
- [ ] Testado checkout com Pix (test mode)
- [ ] QR Code gerado corretamente
- [ ] Simulação de pagamento funcionou

---

## 🎯 Verificação Rápida (30 segundos)

Execute este teste rápido:

```bash
# 1. Abrir site em modo test
http://localhost:3000

# 2. Adicionar produto ao carrinho
# 3. Clicar em "Finalizar Compra"
# 4. Na tela do Stripe, verificar se aparece:
```

**Deve aparecer:**
```
┌─────────────────────────────────────┐
│  Stripe Checkout                    │
│                                     │
│  Formas de Pagamento:               │
│  ○ Cartão de Crédito               │
│  ○ Pix           ← DEVE APARECER   │
│  ○ Boleto                           │
└─────────────────────────────────────┘
```

---

## 🆘 Ainda Não Funciona?

### **Opção 1: Entrar em Contato com Stripe**

1. Dashboard → Help → Contact Support
2. Assunto: "Pix not appearing in checkout (Brazil)"
3. Informar:
   - CNPJ: 62.463.131/0001-62
   - Razão Social: Isadora Matos Ferreira LTDA
   - Problema: Pix habilitado mas não aparece no checkout

### **Opção 2: Usar Apenas Card Temporariamente**

Se precisar lançar urgentemente:

```typescript
// src/app/api/checkout/route.ts (temporário)
payment_method_types: ['card'], // Apenas cartão
```

E adicionar aviso no site:
> "Pix será habilitado em breve. Por enquanto, aceitamos apenas cartão de crédito."

---

## 📊 Status Esperado

Após seguir este guia:

✅ **Pix habilitado** no Dashboard  
✅ **CNPJ validado** no Stripe  
✅ **Código atualizado** (`payment_method_types: ['card', 'pix', 'boleto']`)  
✅ **Checkout exibindo** as 3 opções de pagamento  
✅ **QR Code gerado** quando selecionar Pix  
✅ **Pagamento simulado** com sucesso (test mode)  

---

## 🎉 Sucesso!

Se você vê as 3 opções de pagamento (Card, Pix, Boleto) no checkout, está tudo funcionando!

**VIOS Labs agora aceita Pix! ⚡🇧🇷**

---

**Última atualização:** 2026-01-21  
**Suporte:** atendimento@vioslabs.com.br
