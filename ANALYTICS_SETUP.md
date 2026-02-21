# Configuração de Analytics — GA4

## Variável de ambiente

Adicione ao `.env`:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Ou use o alias legado:

```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Obtenha o ID em: [Google Analytics](https://analytics.google.com/) → Admin → Fluxos de dados → Seu fluxo → ID de medição.

---

## Eventos implementados

| Evento | Quando | Dados |
|--------|--------|-------|
| `view_item` | Visualização de produto ou kit | item_id, item_name, price, category |
| `add_to_cart` | Adição à sacola (produto ou kit) | items, value, currency |
| `begin_checkout` | Envio do formulário de checkout | items, value, coupon |
| `purchase` | Pagamento aprovado (PIX ou cartão) | transaction_id, items, value, coupon |

---

## Funil de conversão

1. **view_item** → Página de produto/kit
2. **add_to_cart** → CartContext (addToCart, addKitToCart)
3. **begin_checkout** → Checkout (submit do form)
4. **purchase** → Checkout (handlePaymentSuccess)

---

## Relatórios no GA4

- **Engajamento** → Eventos: filtrar por `view_item`, `add_to_cart`, `begin_checkout`, `purchase`
- **Monetização** → Relatório de e-commerce: funil de compras
- **Exploração**: criar funil personalizado com esses eventos
