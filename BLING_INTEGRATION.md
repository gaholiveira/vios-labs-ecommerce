# Integração Bling — VIOS Labs E-commerce

Documentação passo a passo para integração do Bling com emissão de NF-e, mantendo o fluxo intacto entre Pagamento (Pagar.me), Frete (Melhor Envio) e ERP (Bling).

---

## Visão Geral

A integração inclui:

- **Criação automática de vendas** no Bling quando o pedido é pago (webhook Pagar.me)
- **Emissão de NF-e** junto com a venda
- **Fluxo não bloqueante**: se o Bling falhar, o pedido continua criado e o e-mail é enviado
- **Comunicação integrada**: Pagar.me (pagamento) → Supabase (pedido) → Bling (venda + NF-e) → E-mail (confirmação)

---

## 1. Fluxo Completo (Pagamento, Frete, Bling)

```
1. Usuário finaliza checkout
   └── Pagar.me (PIX ou Cartão) + Melhor Envio (frete) + dados fiscais

2. Pagamento aprovado
   └── Pagar.me envia webhook order.paid

3. Webhook processa (ordem garantida):
   a) Cria pedido no Supabase (orders + order_items)
   b) Confirma reserva de estoque
   c) Envia e-mail de confirmação
   d) Se Bling configurado → Cria venda no Bling + solicita NF-e

4. Bling
   └── Recebe venda → Emite NF-e → Dispara processos do ERP (estoque, etc.)
```

---

## 2. Pré-requisitos

### 2.1 Conta Bling

1. Acesse [bling.com.br](https://www.bling.com.br)
2. Crie uma conta ou faça login
3. Contrate o plano com emissão de NF-e (se ainda não tiver)

### 2.2 Aplicativo na Bling (OAuth 2.0)

A API v3 do Bling usa **OAuth 2.0**. É necessário registrar um aplicativo:

1. Acesse [developer.bling.com.br](https://developer.bling.com.br)
2. Faça login com a conta Bling
3. Vá em **Aplicativos** → **Criar aplicativo**
4. Preencha:
   - **Nome**: VIOS Labs E-commerce
   - **URL de redirecionamento**: `https://seu-dominio.com/api/bling/callback` (ou uma página que capture o `code`)
   - **Escopos**: marque pelo menos:
     - Pedidos de venda (criar/ler)
     - Contatos (criar/ler)
     - Notas fiscais

5. Após criar, anote **Client ID** e **Client Secret**
6. Adicione ao `.env` (necessário para o callback funcionar):
   ```env
   BLING_CLIENT_ID=seu_client_id
   BLING_CLIENT_SECRET=seu_client_secret
   ```
7. Configure a **URL de redirecionamento** no Bling como: `https://www.vioslabs.com.br/api/bling/callback`

### 2.3 Obter Access Token

1. Acesse a URL de autorização (substitua `SEU_CLIENT_ID`):
   ```
   https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=SEU_CLIENT_ID
   ```
2. Autorize o aplicativo no Bling
3. Você será redirecionado para `https://www.vioslabs.com.br/api/bling/callback?code=...`
4. A rota `/api/bling/callback` troca o `code` por tokens automaticamente e exibe na tela
5. Copie o **access_token** e o **refresh_token** e adicione ao `.env`
6. O callback **salva os tokens no Supabase** (tabela `bling_tokens`) para **refresh automático** — não é mais necessário renovar manualmente (ver seção 8)

### 2.4 Produtos no Bling

Os produtos vendidos no e-commerce **devem existir no Bling** com o mesmo código (ou você mapeia via variáveis de ambiente). O Bling exige que os itens da venda referenciem produtos cadastrados pelo ID.

**Sincronização automática:** Use a rota `/api/bling/sync-products` para enviar produtos e kits do catálogo para o Bling e obter o mapeamento.

1. Com o servidor rodando, acesse: `https://seu-dominio.com/api/bling/sync-products`
2. A resposta contém `envSnippet` e `envJsonSnippet` — copie e adicione ao `.env`

---

## 3. Variáveis de Ambiente

Adicione ao `.env` ou `.env.local`:

```env
# Bling (emissão NF-e)
BLING_ACCESS_TOKEN=seu_access_token_aqui
BLING_REFRESH_TOKEN=seu_refresh_token_aqui   # usado para renovação automática

# OAuth (obrigatório para callback e refresh)
BLING_CLIENT_ID=seu_client_id
BLING_CLIENT_SECRET=seu_client_secret
```

### Mapeamento de Produtos (obrigatório)

Cada produto do e-commerce precisa ter um ID correspondente no Bling.

**Opção A — Variáveis individuais**

```env
BLING_PRODUCT_ID_PROD_1=123456    # Vios Glow
BLING_PRODUCT_ID_PROD_2=123457    # Vios Sleep
BLING_PRODUCT_ID_PROD_3=123458    # Vios Mag3
BLING_PRODUCT_ID_PROD_4=123459    # Vios Pulse
BLING_PRODUCT_ID_PROD_5=123460    # Vios Move
BLING_PRODUCT_ID_KIT_1=123461     # Kits (se houver)
```

**Opção B — Mapa JSON**

```env
BLING_PRODUCT_MAP={"prod_1":123456,"prod_2":123457,"prod_3":123458,"prod_4":123459,"prod_5":123460}
```

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `BLING_ACCESS_TOKEN` | Sim | Access Token OAuth do Bling (renove periodicamente) |
| `BLING_PRODUCT_ID_<ID>` ou `BLING_PRODUCT_MAP` | Sim | Mapeamento produto VIOS → ID Bling |

---

## 4. Configurações no Painel Bling

Para evitar erros comuns na API v3:

1. **Configurações de venda**
   - **Data para geração de parcelas**: selecione **"Data de venda"**
   - **Editar número do pedido de venda**: desative (deixe o Bling numerar)

2. **Cidade do endereço**
   - Use o nome oficial da cidade (ex.: "Porto Seguro", não "Trancoso" que é distrito)
   - O Bling valida contra base dos Correios

3. **Produtos**
   - Use a sincronização automática: acesse `GET /api/bling/sync-products` para enviar produtos e kits ao Bling e obter o mapeamento

---

## 5. Sincronizar Produtos (Sync)

Para enviar produtos e kits do catálogo ao Bling e obter o mapeamento:

1. Certifique-se de que `BLING_ACCESS_TOKEN` está no `.env`
2. Acesse no navegador: `http://localhost:3000/api/bling/sync-products` (dev) ou `https://seu-dominio.com/api/bling/sync-products` (prod)
3. A resposta JSON traz:
   - `mapping`: mapa `{ "prod_1": 123456, ... }`
   - `envSnippet`: variáveis prontas para o `.env`
   - `envJsonSnippet`: alternativa em formato JSON
   - `synced`: quantidade com mapeamento OK
   - `updated`: quantidade de produtos existentes atualizados (nome, descrição, preço)
   - `updateWarnings`: se o PUT falhar em algum produto, o mapeamento continua válido (fail-safe)
4. Copie e cole no `.env`

**Comportamento:** Produtos novos são criados (POST). Produtos já existentes (mesmo código) são atualizados (PUT) com nome, descrição e preço do catálogo. Se o update falhar, o mapeamento ainda é retornado — o sync não bloqueia.

---

## 6. Fluxo Técnico

### 6.1 Arquivos Envolvidos

| Arquivo | Função |
|---------|--------|
| `src/lib/bling.ts` | Cliente da API Bling — `createSaleInBling()`, `createProductInBling()` |
| `src/app/api/bling/sync-products/route.ts` | Sincroniza produtos e kits para o Bling |
| `src/app/api/webhooks/pagarme/route.ts` | Webhook que chama o Bling após criar o pedido |
| `add_bling_columns.sql` | (Opcional) Colunas para rastrear sync no Supabase |

### 6.2 Chamada ao Bling

O webhook Pagar.me chama `createSaleInBling()` **apenas se**:

- `BLING_ACCESS_TOKEN` está configurado
- Endereço possui CEP, cidade e UF
- CPF do cliente está presente
- Produtos estão mapeados

Se o Bling retornar erro, o webhook **não falha**: o pedido permanece criado e o erro é logado.

---

## 7. Colunas Opcionais no Banco (Supabase)

Para rastrear o status da sincronização Bling, execute `add_bling_columns.sql`:

```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bling_sale_id BIGINT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bling_nfe_id BIGINT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bling_sync_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bling_sync_error TEXT;
```

Atualmente o código **não persiste** esses campos automaticamente; a migração prepara a estrutura para futuras melhorias.

---

## 8. Refresh Automático do Token

O Access Token do Bling expira (ex.: 6h). O projeto usa **renovação automática**:

1. **Tabela `bling_tokens`** (Supabase)  
   Execute a migração `bling_tokens_table.sql` no Supabase para criar a tabela que armazena `access_token`, `refresh_token` e `expires_at`.

2. **Callback OAuth**  
   Ao concluir o fluxo em `/api/bling/callback`, os tokens são **salvos no DB** automaticamente. Não é necessário colar no `.env` para refresh (mas pode manter no env como fallback).

3. **Uso do token**  
   `getBlingAccessToken()` em `src/lib/bling.ts`:
   - Lê primeiro da tabela `bling_tokens`
   - Se o token expirou (ou expira em < 5 min), chama `refreshBlingToken()` e atualiza o DB
   - Fallback: `BLING_ACCESS_TOKEN` do `.env`

4. **Cron no Supabase**  
   O refresh é agendado via **pg_cron + pg_net** no Supabase (não usa cron da Vercel, para evitar problemas de deploy/plano):

   1. No Supabase: **Database** → **Extensions** → habilite **pg_cron** e **pg_net**.
   2. Abra o arquivo `bling_refresh_cron_supabase.sql`, substitua `SEU_DOMINIO` pelo seu domínio (ex.: `www.vioslabs.com.br`).
   3. Execute o SQL no **SQL Editor** do Supabase. O job `bling-refresh-token` passará a chamar `GET https://seu-dominio/api/bling/refresh` a cada **4 horas** (0h, 4h, 8h, 12h, 16h, 20h).

   Assim o token fica sempre válido mesmo sem pedidos, sem depender do plano ou da config de cron da Vercel.

5. **Proteger a rota (opcional)**  
   Se definir `CRON_SECRET` na Vercel, a rota `/api/bling/refresh` exige `Authorization: Bearer <CRON_SECRET>`. No SQL do cron você pode passar esse header (ex.: via variável no Supabase ou valor fixo no script).

**Resumo:** Faça o OAuth uma vez → callback grava no DB → cron no Supabase chama a rota de refresh a cada 4h. Opcionalmente mantenha `BLING_ACCESS_TOKEN` e `BLING_REFRESH_TOKEN` no `.env` como backup.

---

## 9. Logs para Diagnóstico

O webhook e o cliente Bling emitem **logs estruturados** para facilitar o debug:

| Log | Significado |
|-----|-------------|
| `[PAGARME WEBHOOK] Bling: { isConfigured, hasAddr, zip, city, state, hasCpf, productIds, willCall }` | Estado antes de chamar o Bling (se vai chamar ou não e por quê). |
| `[PAGARME WEBHOOK] Bling: venda criada { blingSaleId, orderId }` | Venda criada no Bling com sucesso. |
| `[PAGARME WEBHOOK] Bling: falha ao criar venda { orderId, error }` | Bling retornou erro (ex.: produto não mapeado, CPF ausente). |
| `[PAGARME WEBHOOK] Bling configurado mas não chamado` | Token configurado mas endereço incompleto ou sem CPF. |
| `[BLING] createSaleInBling { orderId, itemsCount, productIds, totalAmount }` | Início da chamada à API Bling. |
| `[BLING] createSaleInBling failed { orderId, status, error, body }` | Resposta de erro da API Bling (status e body). |
| `[BLING] createSaleInBling success { orderId, blingSaleId }` | Venda criada no Bling. |
| `[BLING] refreshBlingToken: token renovado e salvo no DB` | Token renovado com sucesso. |

Consulte os **logs da Vercel** (ou do seu hosting) após um pedido de teste para identificar por que o Bling não recebeu o pedido.

---

## 10. Troubleshooting

| Erro | Causa provável | Solução |
|------|----------------|---------|
| `Produto X não mapeado` | Falta `BLING_PRODUCT_ID_*` ou `BLING_PRODUCT_MAP` | Configure o mapeamento no `.env` |
| `CPF obrigatório` | Cliente sem CPF no checkout | Garanta que o checkout colete CPF |
| `Cidade não encontrada` | Nome de distrito em vez de cidade | Use cidade oficial (ex.: Porto Seguro) |
| `SKUs não encontrados` / **Produto não cadastrado** | Produto (ex.: Vios Pulse) não existe no Bling | Cadastre o produto no Bling e configure `BLING_PRODUCT_ID_PROD_4` (ou use `/api/bling/sync-products`) |
| **Pendências cadastrais NF-e** / CPF, Endereço, Bairro obrigatórios | Contato sem endereço completo | Contato passa a incluir endereço completo (cep, endereco, numero, bairro, municipio, uf). Bairro vem de metadata ou ViaCEP. |
| `Data para geração das parcelas inválida` | Configuração Bling | Use "Data de venda" nas configs |
| `Informe o número do pedido` | Configuração Bling | Desative "Editar número do pedido" |
| **Log OK mas venda não aparece** | Filtro de data ou status | Vendas > Pedidos de venda; **ajuste o filtro de data** (ex.: hoje, últimos 7 dias); filtre por "Em aberto" ou "Ativo"; busque `VIOS-` no campo de busca |

---

## 11. Onde encontrar a venda no Bling

Quando o log mostra `[PAGARME WEBHOOK] Bling: venda criada`, a venda foi criada. Para localizá-la:

1. **Menu**: Vendas → Pedidos de venda
2. **Data**: Ajuste o filtro de data para incluir o período do pedido (ex.: hoje, últimos 7 dias)
3. **Filtros**: Inclua status "Em aberto", "Ativo" ou similar
4. **Busca**: Use `VIOS-` ou o número completo (ex.: `VIOS-2ab0ccf`)
5. **Conta**: Confirme que está na conta Bling correta (OAuth pode vincular a outra conta)
6. **Loja**: Em multiloja, verifique se a venda foi criada na loja esperada

---

## 12. Resumo da Comunicação

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Checkout  │────▶│  Pagar.me   │────▶│  Webhook    │────▶│   Bling     │
│  (PIX/Card) │     │  (pagamento)│     │  (order.    │     │  (venda +   │
│             │     │             │     │   paid)     │     │   NF-e)     │
└─────────────┘     └─────────────┘     └──────┬──────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Supabase   │
                                        │  (orders)   │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   E-mail    │
                                        │ (Resend)    │
                                        └─────────────┘
```

**Frete (Melhor Envio)** permanece no checkout: valor enviado ao Pagar.me e ao Bling via dados do pedido.

---

## 13. Ajustes de Payload (se necessário)

A estrutura do JSON enviado ao Bling está em `src/lib/bling.ts`. A API Bling v3 pode variar conforme a versão. Se receber erros de validação (ex.: "campo X é obrigatório", "estrutura inválida"), consulte a [referência oficial](https://developer.bling.com.br/referencia) e ajuste o payload em `createSaleInBling()`.
