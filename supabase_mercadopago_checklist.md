# Checklist Supabase — Mercado Pago (PIX + Cartão)

As implementações de checkout Mercado Pago (PIX, parcelamento) e do webhook **reutilizam** as mesmas tabelas e funções do Stripe. Não é obrigatório criar novas tabelas.

---

## 1. O que já é usado (sem mudança)

- **`orders`** — Mesma tabela; `stripe_session_id` guarda o **preference_id** do Mercado Pago.
- **`order_items`** — Mesma estrutura (incluindo `product_image`).
- **`inventory_reservations`** — Reservas por produto; `stripe_session_id` guarda o **preference_id** após a criação da preferência.
- **`reserve_inventory`** — Já usada na rota de checkout Mercado Pago.
- **`confirm_reservation`** — Chamada pelo webhook Mercado Pago com `p_stripe_session_id = preference_id`.

Nenhuma alteração de schema é necessária para essas partes.

---

## 2. O que conferir ou aplicar no Supabase

### 2.1 Constraint em `inventory_reservations`

Várias reservas (uma por produto) compartilham o mesmo `stripe_session_id` (no MP, o mesmo `preference_id`). Por isso **não** pode existir UNIQUE em `stripe_session_id`.

**Se ainda não rodou, execute no SQL Editor:**

```sql
-- Remover UNIQUE de stripe_session_id (permite múltiplas reservas por sessão/preferência)
ALTER TABLE inventory_reservations
DROP CONSTRAINT IF EXISTS inventory_reservations_stripe_session_id_key;

-- Índice para buscas (não único)
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_stripe_session_id
ON inventory_reservations(stripe_session_id);
```

Ou rode o arquivo: **`fix_inventory_reservations_constraint.sql`**.

---

### 2.2 Função `confirm_reservation` — múltiplas reservas

A versão “base” de `confirm_reservation` confirma **apenas uma** reserva por `stripe_session_id`. No Mercado Pago (e no Stripe com vários itens), há **várias** reservas com o mesmo id. É necessário que a função processe **todas** as reservas ativas com aquele `stripe_session_id`.

**Execute no SQL Editor o script:** **`fix_confirm_reservation_multiple.sql`** (criado neste projeto).  
Ele redefine `confirm_reservation` para fazer um loop em todas as reservas ativas com o mesmo `p_stripe_session_id` e confirmar cada uma (estoque, movimento, status).

---

### 2.3 RLS e permissões

- O webhook usa **service role** (Supabase Admin), então **não** depende de RLS para inserir em `orders` / `order_items` ou chamar `confirm_reservation`.
- As políticas atuais de `orders` e `order_items` (por `user_id` / `customer_email`) continuam válidas para o usuário ver pedidos feitos via Mercado Pago.

Nada extra é necessário para RLS ou GRANT apenas por causa do Mercado Pago.

---

## 3. Resumo

| Item                                    | Ação                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Novas tabelas                           | Nenhuma                                                                                                                  |
| Coluna nova em `orders` / `order_items` | Nenhuma                                                                                                                  |
| Constraint em `inventory_reservations`  | Remover UNIQUE de `stripe_session_id` (script acima ou `fix_inventory_reservations_constraint.sql`)                      |
| Função `confirm_reservation`            | Garantir que processa **todas** as reservas com o mesmo `stripe_session_id` (use `fix_confirm_reservation_multiple.sql`) |

Depois disso, o fluxo Mercado Pago (checkout + webhook + e-mail) funciona com o Supabase atual.
