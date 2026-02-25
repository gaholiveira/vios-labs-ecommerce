# Implementação de Coleta de Dados Antes do Checkout

## 📋 Visão Geral

Implementação robusta para coletar **CPF** e **endereço completo** antes de redirecionar para o Mercado Pago Checkout Pro. Isso garante que todos os dados necessários para emissão de nota fiscal estejam disponíveis.

## ✅ Componentes Criados

### 1. Utilitários de Validação (`src/utils/validation.ts`)

Funções de validação e formatação para dados brasileiros:

- ✅ `validateCPF()` - Valida CPF com algoritmo de dígitos verificadores
- ✅ `formatCPF()` - Formata CPF para exibição (123.456.789-00)
- ✅ `validateCEP()` - Valida CEP brasileiro (8 dígitos)
- ✅ `formatCEP()` - Formata CEP para exibição (12345-678)
- ✅ `validatePhone()` - Valida telefone brasileiro (10 ou 11 dígitos)
- ✅ `formatPhone()` - Formata telefone para exibição ((11) 98765-4321)
- ✅ `validateAddress()` - Valida endereço completo

### 2. Utilitário de CEP (`src/utils/cep.ts`)

Integração com API ViaCEP para autocompletar endereço:

- ✅ `fetchAddressByCEP()` - Busca endereço completo via CEP
- ✅ Interface `ViaCEPResponse` para tipagem

### 3. Componente de Formulário (`src/components/checkout/CheckoutForm.tsx`)

Formulário completo e robusto com:

- ✅ **Validação em tempo real** - Valida campos conforme usuário digita
- ✅ **Formatação automática** - CPF, CEP e telefone formatados automaticamente
- ✅ **Autocompletar CEP** - Busca endereço via API quando CEP é válido
- ✅ **Feedback visual** - Erros exibidos abaixo de cada campo
- ✅ **Estados de loading** - Indicadores visuais durante busca de CEP
- ✅ **Design consistente** - Segue o padrão visual da marca VIOS Labs
- ✅ **Acessibilidade** - Labels, placeholders e mensagens de erro claras

**Campos coletados:**

- CPF/CNPJ (obrigatório)
- Telefone (obrigatório)
- CEP (obrigatório, com autocompletar)
- Rua (obrigatório)
- Número (obrigatório)
- Complemento (opcional)
- Bairro (obrigatório)
- Cidade (obrigatório)
- Estado (obrigatório, dropdown)

## 🔧 Modificações na API

### API do Mercado Pago (`src/app/api/checkout/mercadopago/route.ts`)

**Alterações:**

1. **Interface atualizada** para receber dados do formulário:

   ```typescript
   interface CheckoutFormData {
     cpf: string;
     phone: string;
     address: AddressData;
   }
   ```

2. **Uso de dados coletados** na preferência:
   - CPF/CNPJ adicionado em `payer.identification`
   - Telefone formatado em `payer.phone`
   - Endereço completo em `payer.address` e `shipments.receiver_address`

3. **Fallback inteligente** - Se dados não forem fornecidos, mantém comportamento anterior

## 🔄 Fluxo de Checkout

### Antes (Stripe - Cartão 1x)

1. Usuário seleciona método de pagamento
2. Clica em "Finalizar Compra"
3. Redireciona direto para Stripe Checkout
4. Stripe coleta dados necessários

### Agora (Mercado Pago - PIX ou Cartão Parcelado)

1. Usuário seleciona método de pagamento (PIX ou Cartão 2x/3x)
2. Clica em "Finalizar Compra"
3. **Formulário de checkout aparece** (modal)
4. Usuário preenche CPF, telefone e endereço
5. Validação em tempo real
6. CEP autocompleta endereço
7. Usuário confirma dados
8. Dados são enviados para API junto com itens do carrinho
9. API cria preferência no Mercado Pago com dados pré-preenchidos
10. Redireciona para Mercado Pago Checkout Pro

## 📊 Benefícios

### 1. Compliance Fiscal

- ✅ **CPF sempre coletado** - Necessário para nota fiscal
- ✅ **Endereço completo** - Dados de entrega disponíveis antes do pagamento
- ✅ **Dados validados** - CPF e CEP validados antes de enviar

### 2. Experiência do Usuário

- ✅ **Formulário integrado** - Design consistente com a marca
- ✅ **Validação imediata** - Feedback instantâneo sobre erros
- ✅ **Autocompletar inteligente** - CEP preenche automaticamente endereço
- ✅ **Formatação automática** - Campos formatados enquanto digita

### 3. Robustez Técnica

- ✅ **Validação dupla** - Frontend e backend
- ✅ **Type-safe** - TypeScript em todos os componentes
- ✅ **Tratamento de erros** - Mensagens claras e específicas
- ✅ **Fallback** - Funciona mesmo se API de CEP falhar

## 🎨 Design e UX

### Características do Formulário

- **Modal overlay** - Foco total no formulário
- **Animações suaves** - Transições com Framer Motion
- **Feedback visual** - Bordas vermelhas em campos com erro
- **Loading states** - Indicador durante busca de CEP
- **Botões claros** - Cancelar e Continuar bem definidos
- **Responsivo** - Funciona bem em mobile e desktop

### Validações Visuais

- ✅ Campo com erro: borda vermelha
- ✅ Mensagem de erro abaixo do campo
- ✅ Campos obrigatórios marcados com `*`
- ✅ Placeholders informativos

## 🔐 Segurança

- ✅ **Validação de CPF** - Algoritmo de dígitos verificadores
- ✅ **Sanitização** - Remoção de caracteres não numéricos
- ✅ **Validação de CEP** - Formato brasileiro (8 dígitos)
- ✅ **Validação de telefone** - Formato brasileiro (10 ou 11 dígitos)
- ✅ **Dados limpos** - Apenas números enviados para API

## 📝 Próximos Passos (Opcional)

1. **Salvar endereço** - Opcionalmente salvar endereço do usuário logado
2. **Múltiplos endereços** - Permitir seleção de endereços salvos
3. **Validação de CNPJ** - Adicionar suporte para CNPJ além de CPF
4. **Cache de CEP** - Cachear resultados da API ViaCEP

## 🐛 Troubleshooting

### CEP não autocompleta

- Verificar conexão com internet
- Verificar se CEP tem 8 dígitos
- API ViaCEP pode estar temporariamente indisponível

### CPF inválido mesmo sendo válido

- Verificar se não há espaços ou caracteres especiais
- Validar formato: 11 dígitos numéricos

### Formulário não aparece

- Verificar se método de pagamento é PIX ou Cartão parcelado
- Cartão 1x (Stripe) não mostra formulário (Stripe coleta dados)

## 📚 Arquivos Modificados/Criados

### Criados

- `src/utils/validation.ts` - Validações e formatações
- `src/utils/cep.ts` - Integração com ViaCEP
- `src/components/checkout/CheckoutForm.tsx` - Componente de formulário
- `CHECKOUT_FORM_IMPLEMENTATION.md` - Esta documentação

### Modificados

- `src/components/CartDrawer.tsx` - Integração do formulário
- `src/app/api/checkout/mercadopago/route.ts` - Uso de dados coletados

## ✅ Testes Recomendados

1. ✅ Preencher formulário completo e verificar validações
2. ✅ Testar CEP válido e verificar autocompletar
3. ✅ Testar CEP inválido e verificar mensagem de erro
4. ✅ Testar CPF inválido e verificar validação
5. ✅ Testar telefone em diferentes formatos
6. ✅ Testar cancelamento do formulário
7. ✅ Verificar fluxo completo até Mercado Pago
8. ✅ Verificar dados recebidos no webhook do Mercado Pago
