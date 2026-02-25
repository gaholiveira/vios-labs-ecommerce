# Correção do Erro PKCE Code Verifier

## Problema

Erro: `PKCE code verifier not found in storage` ao clicar em links de confirmação de email ou redefinição de senha.

## Causa

O erro ocorre quando:
1. O usuário solicita redefinição de senha ou confirmação de email
2. O Supabase gera um code verifier e o armazena (deveria estar em cookies)
3. O usuário clica no link do email
4. O code verifier não é encontrado nos cookies quando o callback tenta fazer `exchangeCodeForSession`

## Solução Implementada

### 1. Cliente Supabase (`src/utils/supabase/client.ts`)

✅ **Removida configuração manual de cookies** - O `createBrowserClient` do `@supabase/ssr` já gerencia cookies automaticamente. Configuração manual pode interferir.

```typescript
// CORRETO: Deixar o padrão funcionar
return createBrowserClient(url, key)
```

### 2. Callback Route (`src/app/auth/callback/route.ts`)

✅ **Melhorado tratamento de cookies no servidor**:
- Cookies configurados com `sameSite: 'lax'` para funcionar com links de email
- `httpOnly: false` para permitir acesso do cliente (necessário para PKCE)
- `path: '/'` para estar disponível em todas as rotas

✅ **Tratamento específico de erro PKCE**:
- Detecta erros relacionados a PKCE
- Redireciona com mensagem amigável
- Diferencia entre password reset e signup

### 3. Middleware (`src/middleware.ts`)

✅ **Já configurado corretamente** - O middleware está refrescando a sessão corretamente.

## Verificações Necessárias

### 1. Configuração do Supabase Dashboard

Verifique se as URLs de redirecionamento estão corretas:

**Site URL:**
```
https://seu-dominio.com
```

**Redirect URLs:**
```
https://seu-dominio.com/auth/callback
http://localhost:3000/auth/callback (para desenvolvimento)
```

### 2. Variáveis de Ambiente

Certifique-se de que estão configuradas:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### 3. Cookies do Navegador

O code verifier é armazenado em cookies com o nome:
- `sb-<project-ref>-auth-token` (para tokens)
- Cookies relacionados a PKCE são gerenciados automaticamente pelo `@supabase/ssr`

## Como Testar

1. **Password Reset:**
   - Acesse `/forgot-password`
   - Digite um email válido
   - Clique no link do email
   - Deve redirecionar para `/update-password` sem erro

2. **Email Confirmation:**
   - Registre uma nova conta em `/register`
   - Clique no link de confirmação do email
   - Deve redirecionar corretamente sem erro PKCE

## Se o Problema Persistir

1. **Limpar cookies do navegador** e tentar novamente
2. **Verificar se o domínio está correto** nas configurações do Supabase
3. **Verificar se está usando HTTPS** em produção (cookies Secure requerem HTTPS)
4. **Verificar console do navegador** para erros adicionais
5. **Verificar logs do servidor** para mais detalhes do erro

## Notas Técnicas

- O `@supabase/ssr` gerencia automaticamente o armazenamento do code verifier em cookies
- Não é necessário configurar cookies manualmente
- O fluxo PKCE funciona assim:
  1. Cliente gera code verifier e code challenge
  2. Code verifier é armazenado em cookie (gerenciado pelo @supabase/ssr)
  3. Code challenge é enviado ao Supabase
  4. Supabase envia email com código
  5. Usuário clica no link
  6. Callback lê code verifier do cookie
  7. Troca código por sessão usando code verifier

## Referências

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [PKCE Flow](https://oauth.net/2/pkce/)
- [Next.js Cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
