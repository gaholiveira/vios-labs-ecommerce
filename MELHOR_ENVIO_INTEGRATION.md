# Integração Melhor Envio — VIOS Labs E-commerce

Documentação passo a passo para a integração correta do Melhor Envio no checkout da VIOS Labs, com fretes reais e opções de escolha (Padrão e Expressa).

---

## Visão Geral

A integração inclui:

- **Cotação em tempo real** via API Melhor Envio
- **Duas opções de frete**: Entrega Padrão (mais barata) e Entrega Expressa (mais rápida)
- **Frete grátis** para compras a partir de R$ 289,90 (mantido)
- **Checkout integrado** sem corromper o fluxo de pagamento (PIX e Cartão)

---

## 1. Pré-requisitos

### 1.1 Conta Melhor Envio

1. Acesse [melhorenvio.com.br](https://melhorenvio.com.br)
2. Crie uma conta ou faça login
3. Acesse **Área do Vendedor** → **Integrações** → **API**

### 1.2 Token de API

1. Gere um token em **Área do Vendedor** → **API** → **Token de acesso**
2. O token tem validade de **30 dias** (renovável)
3. Guarde o token em local seguro — será usado como variável de ambiente

### 1.3 CEP de Origem

Defina o CEP do seu endereço de expedição (armazém/estoque).  
Exemplo: `01310100` (Av. Paulista, São Paulo).

---

## 2. Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Melhor Envio
MELHOR_ENVIO_TOKEN=seu_token_aqui
MELHOR_ENVIO_ORIGIN_POSTAL_CODE=01310100
MELHOR_ENVIO_SANDBOX=false

# Frete local (entrega mesmo dia na nossa cidade)
LOCAL_DELIVERY_CEP_PREFIX=14409
LOCAL_DELIVERY_PRICE=10
```

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `MELHOR_ENVIO_TOKEN` | Sim | Token de acesso da API Melhor Envio |
| `MELHOR_ENVIO_ORIGIN_POSTAL_CODE` | Não | CEP de origem (padrão: 01310100) |
| `MELHOR_ENVIO_SANDBOX` | Não | `true` para ambiente de testes (sandbox) |
| `LOCAL_DELIVERY_CEP_PREFIX` | Não | CEPs que começam com este prefixo recebem opção "Entrega Local — Mesmo Dia" (ex: 14409 = Franca/SP) |
| `LOCAL_DELIVERY_PRICE` | Não | Valor do frete local em reais (padrão: 10) |

---

## 3. Fluxo Técnico

### 3.1 Arquitetura

```
CheckoutForm (CEP) 
    → onCEPChange(cep)
        → ShippingQuoteSelector (postalCode)
            → POST /api/shipping/quote
                → Melhor Envio API (calculate)
            ← Opções Padrão + Expressa
        → Usuário seleciona
    → handleFormSubmit
        → POST /api/checkout/pagarme (shippingReais, selectedShippingOption)
```

### 3.2 Componentes

| Componente | Função |
|------------|--------|
| `ShippingQuoteSelector` | Exibe opções de frete, busca cotação e gerencia seleção |
| `CheckoutForm` | Coleta CEP e dispara `onCEPChange` para cotação |
| `CheckoutOrderSummary` | Exibe subtotal, frete e total com valores reais |
| `/api/shipping/quote` | Chama a API Melhor Envio e retorna Padrão + Expressa |
| `/api/checkout/pagarme` | Recebe `shippingReais` e grava no pedido |

### 3.3 Regras de Negócio

- **Frete grátis**: `subtotal >= R$ 289,90` → frete = R$ 0,00
- **Sem frete grátis**: usa o valor da opção selecionada (Melhor Envio)
- **Validação**: CEP obrigatório para calcular frete; sem opção selecionada o checkout não é concluído

---

## 4. Dimensões Padrão dos Produtos

Como os produtos VIOS não têm peso/dimensões no banco, a API usa valores padrão:

| Campo | Valor | Observação |
|-------|-------|------------|
| Peso por unidade | 0,3 kg | Suplementos em embalagem padrão |
| Dimensões | 11 × 17 × 11 cm | Pacote pequeno |
| Seguro | Valor do produto | `insurance_value` = preço × quantidade |

**Recomendação:** Para valores mais precisos, adicione `weight`, `width`, `height` e `length` na tabela `products` e ajuste `/api/shipping/quote` para usar esses dados.

---

## 5. Passo a Passo de Configuração

### Passo 1: Obter Token Melhor Envio

1. Faça login em [melhorenvio.com.br](https://melhorenvio.com.br)
2. Vá em **Área do Vendedor** → **Integrações** → **API**
3. Clique em **Gerar Token**
4. Copie o token e adicione em `MELHOR_ENVIO_TOKEN`

### Passo 2: Definir CEP de Origem

1. Use o CEP do endereço de expedição
2. Adicione em `MELHOR_ENVIO_ORIGIN_POSTAL_CODE` (opcional; padrão: 01310100)

### Passo 3: Ambiente de Testes (opcional)

1. Para testes, use `MELHOR_ENVIO_SANDBOX=true`
2. A API usará `sandbox.melhorenvio.com.br`
3. Em produção, use `MELHOR_ENVIO_SANDBOX=false` ou omita

### Passo 4: Verificar Fluxo no Checkout

1. Acesse `/checkout`
2. Preencha e-mail, CPF, telefone
3. Informe um CEP válido no endereço
4. Aguarde o carregamento das opções de frete
5. Selecione Padrão ou Expressa
6. Escolha PIX ou Cartão e finalize

---

## 6. Endpoint da API Melhor Envio

- **Produção:** `https://www.melhorenvio.com.br/api/v2/me/shipment/calculate`
- **Sandbox:** `https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate`

> **Erro "from.postal_code está invalido" (422)**: O CEP de origem precisa estar cadastrado no painel Melhor Envio. Acesse **Área do Vendedor → Configurações → Entrega** e cadastre o endereço de onde os produtos serão enviados. Use esse CEP em `MELHOR_ENVIO_ORIGIN_POSTAL_CODE`.

**Método:** `POST`  
**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {token}`

**Payload (exemplo):**
```json
{
  "from": { "postal_code": "01310100" },
  "to": { "postal_code": "59148485" },
  "products": [
    {
      "id": "prod_1",
      "width": 11,
      "height": 17,
      "length": 11,
      "weight": 0.3,
      "insurance_value": 219,
      "quantity": 1
    }
  ],
  "options": {
    "receipt": false,
    "own_hand": false,
    "insurance_value": 219
  },
  "services": "1,2,3,4"
}
```

---

## 7. Tratamento de Erros

| Cenário | Comportamento |
|---------|---------------|
| Token ausente ou inválido | 503 — "Integração Melhor Envio não configurada" |
| CEP inválido | 400 — "CEP deve ter 8 dígitos" |
| Carrinho vazio | 400 — "Carrinho vazio" |
| API Melhor Envio fora | 502/500 — mensagem genérica + botão "Tentar novamente" |
| Sem opções para o CEP | Exibe "Nenhuma opção disponível para este CEP" |

---

## 8. Checklist de Go-Live

- [ ] `MELHOR_ENVIO_TOKEN` configurado em produção
- [ ] `MELHOR_ENVIO_ORIGIN_POSTAL_CODE` com CEP correto do estoque
- [ ] `MELHOR_ENVIO_SANDBOX=false` (ou variável removida)
- [ ] Teste completo: CEP → cotação → seleção → PIX e Cartão
- [ ] Confirmação de que frete grátis (≥ R$ 289,90) continua funcionando

---

## 9. Referências

- [Documentação Melhor Envio](https://docs.melhorenvio.com.br)
- [Referência API — Cálculo de Fretes](https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos)
