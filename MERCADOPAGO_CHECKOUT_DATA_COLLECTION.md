# Coleta de Dados no Mercado Pago Checkout Pro

## ⚠️ Limitação Identificada

O **Mercado Pago Checkout Pro** pode não solicitar automaticamente **CPF** e **endereço de entrega** para pagamentos via **PIX**, pois PIX não requer entrega física imediata.

No entanto, para **emissão de nota fiscal no Brasil**, esses dados são **obrigatórios**.

## 🔧 Configuração Atual

Atualmente, configuramos:

```typescript
payer: {
  identification: {}, // Força coleta de CPF/CNPJ
},
shipments: {
  receiver_address: {}, // Força coleta de endereço
}
```

## ✅ Teste Primeiro

1. Teste o checkout atual com a configuração acima
2. Verifique se o Mercado Pago agora solicita CPF e endereço antes de gerar o PIX
3. Se ainda não solicitar, siga para as alternativas abaixo

## 🔄 Alternativas

### Opção 1: Coletar Dados Antes do Checkout (Recomendado)

Coletar CPF e endereço no nosso próprio formulário antes de redirecionar para o Mercado Pago:

**Vantagens:**

- ✅ Controle total sobre quais campos são obrigatórios
- ✅ Validação customizada (CPF válido, CEP válido)
- ✅ Melhor UX (formulário integrado ao design)
- ✅ Dados disponíveis antes mesmo do pagamento

**Implementação:**

1. Criar componente de formulário de checkout no frontend
2. Validar CPF e CEP antes de criar preferência
3. Enviar dados para API que cria preferência com dados pré-preenchidos

### Opção 2: Usar Checkout Transparente (Checkout API)

Trocar Checkout Pro por Checkout Transparente para ter controle total:

**Vantagens:**

- ✅ Controle completo sobre campos obrigatórios
- ✅ Formulário totalmente customizável
- ✅ Melhor integração com design da loja

**Desvantagens:**

- ⚠️ Requer mais desenvolvimento
- ⚠️ Mais complexo de implementar
- ⚠️ Precisa lidar com PCI compliance

### Opção 3: Configuração no Dashboard Mercado Pago

Verificar se há configurações no dashboard que forcem coleta de dados:

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Verifique configurações de "Preferências" ou "Dados do Cliente"
3. Procure por opções de "Campos Obrigatórios"

## 📋 Próximos Passos

1. **Teste a configuração atual** - Verifique se os objetos vazios funcionam
2. **Se não funcionar:**
   - Implementar Opção 1 (coletar antes do checkout)
   - Ou considerar Opção 2 (Checkout Transparente)

## 📝 Nota Técnica

O Mercado Pago Checkout Pro é otimizado para facilitar o checkout, mas pode não atender todos os requisitos de compliance fiscal brasileiro para PIX. Para garantir coleta de dados obrigatórios, a melhor prática é coletar antes do redirecionamento.
