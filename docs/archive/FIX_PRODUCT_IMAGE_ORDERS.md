# 🖼️ Correção: Imagem do Produto não aparece nos Pedidos

## 🐛 Problema

Após o pedido ser criado com sucesso, a imagem do produto não aparece na tabela `order_items`.

## 🔍 Causa Raiz

A coluna `product_image` **não existe** na tabela `order_items` no schema atual.

O webhook tenta inserir `product_image`, mas como a coluna não existe:
- O valor é ignorado silenciosamente
- Ou causa erro (dependendo da configuração do Supabase)

## ✅ Solução

### 1. Adicionar Coluna `product_image`

Execute o script SQL `ADD_PRODUCT_IMAGE_TO_ORDER_ITEMS.sql` no Supabase:

1. **Acesse o Supabase Dashboard**
   - Vá em [app.supabase.com](https://app.supabase.com)
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Menu lateral → **SQL Editor**
   - Clique em **New Query**

3. **Execute o Script**
   - Abra o arquivo `ADD_PRODUCT_IMAGE_TO_ORDER_ITEMS.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em **Run**

### 2. Verificar se Funcionou

Após executar o script, verifique:

```sql
-- Verificar se a coluna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items' 
  AND table_schema = 'public'
  AND column_name = 'product_image';
```

**Deve retornar:**
- `column_name`: `product_image`
- `data_type`: `text`
- `is_nullable`: `YES`

### 3. Testar Novamente

Após adicionar a coluna:

1. Faça um novo pedido teste
2. Verifique se a imagem aparece na tabela `order_items`
3. Verifique se a imagem aparece na página de pedidos

## 🔧 Melhorias Aplicadas no Código

O código do webhook foi melhorado para:

1. ✅ Tentar obter imagem do produto expandido (`product.images[0]`)
2. ✅ Fallback para `price_data.images[0]` se produto não foi expandido
3. ✅ Logs detalhados em desenvolvimento para debug
4. ✅ Tratamento robusto de casos onde imagem não está disponível

## 📋 Checklist

- [ ] Script `ADD_PRODUCT_IMAGE_TO_ORDER_ITEMS.sql` executado
- [ ] Coluna `product_image` existe na tabela `order_items`
- [ ] Novo pedido teste realizado
- [ ] Imagem aparece na tabela `order_items`
- [ ] Imagem aparece na página de pedidos (`/orders`)

## 🔍 Verificar Pedidos Existentes

Para verificar pedidos que já foram criados sem imagem:

```sql
SELECT 
  oi.id,
  oi.product_name,
  oi.product_image,
  oi.created_at
FROM public.order_items oi
WHERE oi.product_image IS NULL
ORDER BY oi.created_at DESC;
```

**Nota:** Pedidos antigos não terão imagem (já foram criados). Apenas novos pedidos terão imagem após executar o script.

## 💡 Como Funciona

1. **No Checkout**: A imagem é enviada para o Stripe via `price_data.product_data.images`
2. **No Webhook**: O webhook obtém a imagem do produto expandido do Stripe
3. **No Banco**: A imagem é salva na coluna `product_image` da tabela `order_items`
4. **Na Exibição**: A página `/orders` exibe a imagem do produto

## 🚨 Possíveis Problemas Adicionais

### Problema 1: Imagem não está sendo enviada para o Stripe

**Verificar:**
- Se `item.image` existe no carrinho
- Se `normalizeImageUrl` está funcionando corretamente
- Se a URL da imagem é válida

### Problema 2: Produto não está sendo expandido

**Verificar:**
- Se `expand: ['data.price.product']` está funcionando
- Se o Stripe está retornando o produto expandido

### Problema 3: Imagem é URL relativa

**Solução:**
- O código já normaliza URLs relativas para absolutas no checkout
- Mas no webhook, a imagem vem do Stripe (já deve ser absoluta)

## 📝 Próximos Passos

1. Execute o script SQL
2. Faça um novo pedido teste
3. Verifique se a imagem aparece
4. Se não aparecer, verifique os logs do webhook para ver se a imagem está sendo obtida do Stripe
