# 🖼️ Como Atualizar Imagens de Pedidos Antigos

## 📋 Opções Disponíveis

Há duas formas de atualizar pedidos antigos com as imagens dos produtos:

### Opção 1: API Route (Recomendado) ✅

Use a rota `/api/admin/update-order-images` que foi criada.

#### Passo a Passo:

1. **Verificar quantos itens precisam ser atualizados:**
   ```bash
   curl https://vioslabs.com.br/api/admin/update-order-images
   ```
   
   Ou acesse no navegador:
   ```
   https://vioslabs.com.br/api/admin/update-order-images
   ```

2. **Atualizar todos os itens:**
   ```bash
   curl -X POST https://vioslabs.com.br/api/admin/update-order-images
   ```

   Ou use uma ferramenta como Postman/Insomnia para fazer a requisição POST.

3. **Verificar resultado:**
   A resposta será um JSON com:
   ```json
   {
     "success": true,
     "message": "Atualização concluída. X itens atualizados, Y falharam.",
     "updated": 10,
     "failed": 0,
     "total": 10
   }
   ```

#### ⚠️ Segurança

**IMPORTANTE:** Esta rota não tem autenticação por padrão. Em produção, você deve:

1. **Adicionar autenticação** (verificar token de admin)
2. **Ou usar apenas em desenvolvimento**
3. **Ou proteger com variável de ambiente**

Exemplo de proteção simples:

```typescript
// No início da função POST
const authHeader = req.headers.get('authorization');
const expectedToken = process.env.ADMIN_API_TOKEN;

if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}
```

### Opção 2: Script SQL Manual

Se preferir usar SQL diretamente, você pode executar:

```sql
-- Atualizar imagens baseado no product_id
-- (Você precisa mapear manualmente cada product_id para sua imagem)

UPDATE public.order_items
SET product_image = CASE
  WHEN product_id = 'prod_1' THEN 'https://vioslabs.com.br/images/products/glow.jpeg'
  WHEN product_id = 'prod_2' THEN 'https://vioslabs.com.br/images/products/sleep.jpeg'
  WHEN product_id = 'prod_3' THEN 'https://vioslabs.com.br/images/products/mag3.jpeg'
  WHEN product_id = 'prod_4' THEN 'https://vioslabs.com.br/images/products/pulse.jpeg'
  WHEN product_id = 'prod_5' THEN 'https://vioslabs.com.br/images/products/move.jpeg'
  ELSE NULL
END
WHERE product_image IS NULL
  AND product_id IN ('prod_1', 'prod_2', 'prod_3', 'prod_4', 'prod_5');
```

## 🔍 Verificar Antes de Atualizar

### Ver quantos itens precisam ser atualizados:

```sql
SELECT 
  COUNT(*) as total_sem_imagem,
  COUNT(DISTINCT product_id) as produtos_afetados
FROM public.order_items
WHERE product_image IS NULL;
```

### Ver quais produtos estão sem imagem:

```sql
SELECT 
  product_id,
  product_name,
  COUNT(*) as quantidade
FROM public.order_items
WHERE product_image IS NULL
GROUP BY product_id, product_name
ORDER BY quantidade DESC;
```

## ✅ Verificar Após Atualização

### Verificar se funcionou:

```sql
SELECT 
  COUNT(*) as total,
  COUNT(product_image) as com_imagem,
  COUNT(*) - COUNT(product_image) as sem_imagem
FROM public.order_items;
```

**Resultado esperado:**
- `sem_imagem` deve ser `0` (ou próximo de 0 se houver produtos desconhecidos)

### Ver alguns exemplos:

```sql
SELECT 
  id,
  product_id,
  product_name,
  product_image,
  created_at
FROM public.order_items
WHERE product_image IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

## 🚨 Problemas Comuns

### Problema 1: Produto não encontrado

**Sintoma:** `failed > 0` na resposta da API

**Causa:** O `product_id` no pedido não corresponde a nenhum produto em `PRODUCTS`

**Solução:** 
- Verificar se há produtos com IDs diferentes
- Adicionar mapeamento manual para produtos desconhecidos

### Problema 2: URL da imagem incorreta

**Sintoma:** Imagens não carregam na página

**Causa:** URL relativa não foi convertida para absoluta

**Solução:** 
- Verificar se `NEXT_PUBLIC_SITE_URL` está configurado
- Verificar se a URL está correta no banco

### Problema 3: API retorna erro 401/403

**Causa:** Rota protegida ou não acessível

**Solução:**
- Adicionar autenticação (se necessário)
- Verificar variáveis de ambiente
- Usar script SQL manual como alternativa

## 📝 Checklist

- [ ] Coluna `product_image` existe na tabela `order_items`
- [ ] Verificar quantos itens precisam ser atualizados (GET)
- [ ] Executar atualização (POST)
- [ ] Verificar resultado (deve mostrar `updated > 0`)
- [ ] Verificar no Supabase se imagens foram salvas
- [ ] Verificar na página `/orders` se imagens aparecem

## 💡 Dica

Se você tiver muitos pedidos antigos, pode executar a atualização em lotes:

1. Execute a API várias vezes (ela processa todos de uma vez)
2. Ou modifique a API para processar em lotes de 100 itens por vez

A API atual processa todos os itens de uma vez, o que é eficiente para até alguns milhares de itens.
