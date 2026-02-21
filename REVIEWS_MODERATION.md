# Moderação de Avaliações

## Fluxo

1. **Envio**: O cliente envia a avaliação pelo formulário na página do produto.
2. **Status inicial**: Todas as avaliações entram com `status = 'pending'`.
3. **Exibição**: Apenas avaliações com `status = 'approved'` aparecem no site.
4. **Moderação**: Aprovar ou rejeitar no Supabase Dashboard.

## Como moderar

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto.
2. Vá em **Table Editor** → tabela `reviews`.
3. Localize avaliações com `status = 'pending'`.
4. Para **aprovar**: altere `status` para `approved`.
5. Para **rejeitar**: altere `status` para `rejected`.

## Anti-spam

- Limite de 1 avaliação por e-mail + produto a cada 24 horas.
- Validação de campos (rating 1–5, texto 10–1000 caracteres, nome, e-mail).

## SQL para aprovar em lote

```sql
-- Aprovar todas as pendentes (use com cuidado)
UPDATE public.reviews
SET status = 'approved'
WHERE status = 'pending';
```

## Tabela

Execute o script `REVIEWS_TABLE.sql` no SQL Editor do Supabase antes de usar.
