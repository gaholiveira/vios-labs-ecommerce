# Dados para fiscal e entrega — onde puxar

Os dados de **pedido**, **fiscal** (NF-e) e **entrega** ficam no **Supabase**, nas tabelas **`orders`** e **`order_items`**.

---

## Hoje (após a migration abaixo)

### Tabela `orders`

| Coluna                  | Uso                                    | Preenchido por        |
| ----------------------- | -------------------------------------- | --------------------- |
| `id`                    | ID do pedido                           | Todos                 |
| `user_id`               | Cliente (se logado)                    | Todos                 |
| `customer_email`        | E-mail                                 | Todos                 |
| `customer_cpf`          | CPF (fiscal)                           | Stripe + Mercado Pago |
| `customer_name`         | Nome completo                          | Mercado Pago          |
| `customer_phone`        | Telefone                               | Mercado Pago          |
| `shipping_cep`          | CEP                                    | Mercado Pago          |
| `shipping_street`       | Logradouro                             | Mercado Pago          |
| `shipping_number`       | Número                                 | Mercado Pago          |
| `shipping_complement`   | Complemento                            | Mercado Pago          |
| `shipping_neighborhood` | Bairro                                 | Mercado Pago          |
| `shipping_city`         | Cidade                                 | Mercado Pago          |
| `shipping_state`        | UF                                     | Mercado Pago          |
| `status`                | Status do pedido                       | Todos                 |
| `total_amount`          | Total                                  | Todos                 |
| `stripe_session_id`     | Session (Stripe) ou preference_id (MP) | Todos                 |
| `created_at`            | Data do pedido                         | Todos                 |

### Tabela `order_items`

| Coluna         | Uso                  |
| -------------- | -------------------- |
| `order_id`     | Vínculo com o pedido |
| `product_id`   | ID do produto        |
| `product_name` | Nome do produto      |
| `quantity`     | Quantidade           |
| `price`        | Preço unitário       |

---

## Como puxar (relatórios / integrações)

1. **Supabase**
   - **SQL / Dashboard:**  
     `SELECT * FROM orders WHERE id = :id` (ou por `stripe_session_id`, `customer_email`, `created_at`, etc.).  
     Junte com `order_items`:  
     `SELECT o.*, oi.* FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id WHERE o.id = :id`.
   - **API:** use o client do Supabase (service role ou RLS conforme o caso) e leia `orders` + `order_items`.

2. **Fiscal (NF-e)**
   - Use: `customer_cpf`, `customer_name`, `customer_email`, `customer_phone`, `shipping_*`, `total_amount`, `created_at`.
   - Itens: `order_items` (`product_name`, `quantity`, `price`).

3. **Entrega (etiqueta, transportadora)**
   - Use: `customer_name`, `customer_phone`, `shipping_street`, `shipping_number`, `shipping_complement`, `shipping_neighborhood`, `shipping_city`, `shipping_state`, `shipping_cep`.

4. **Stripe**
   - Pedidos Stripe têm `customer_cpf` (se `add_cpf_to_orders.sql` estiver aplicado).
   - Nome, telefone e endereço de entrega do Stripe **não** são gravados em `orders` hoje; para ter tudo no mesmo lugar, dê extend no webhook do Stripe para ler da session e salvar (quando existirem).

---

## Migration necessária

Para ter CPF, nome, telefone e endereço de **entrega** em `orders` (principalmente para pedidos Mercado Pago), rode no Supabase o script:

**`add_orders_fiscal_shipping_columns.sql`**

Depois disso, o webhook do Mercado Pago passa a gravar esses dados ao criar o pedido.
