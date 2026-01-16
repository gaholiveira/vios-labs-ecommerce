# 🔑 Fluxo de Redefinição de Senha

## 📋 Como Funciona

O fluxo de redefinição de senha usa o callback handler para processar o código do email antes de redirecionar para a página de redefinição.

---

## 🔄 Fluxo Completo

```
1. Usuário acessa /forgot-password
   ↓
2. Preenche email e clica em "Enviar"
   ↓
3. Supabase envia email com link:
   https://vioslabs.com.br/auth/callback?code=xxx&type=recovery&next=/reset-password
   ↓
4. Usuário clica no link → Vai para /auth/callback
   ↓
5. Callback handler troca código por sessão temporária
   ↓
6. Callback detecta type=recovery OU next=/reset-password
   ↓
7. Redireciona para /reset-password
   ↓
8. Usuário define nova senha
   ↓
9. Senha é atualizada
   ↓
10. Redireciona para /login?password-reset=true
```

---

## ⚙️ Configuração

### **1. Forgot Password Page** (`/forgot-password`)

```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
});
```

**O que acontece:**
- Envia email com link para `/auth/callback?code=xxx&type=recovery&next=/reset-password`
- O Supabase adiciona automaticamente `type=recovery` quando é password reset

### **2. Callback Handler** (`/auth/callback/route.ts`)

```typescript
// Detecta password reset de duas formas:
if (type === 'recovery' || next === '/reset-password') {
  return NextResponse.redirect(`${origin}/reset-password`)
}
```

**O que acontece:**
- Processa o código do email
- Troc a código por sessão temporária
- Detecta que é password reset (por `type` ou por `next`)
- Redireciona para `/reset-password`

### **3. Reset Password Page** (`/reset-password`)

```typescript
// Verifica se há sessão válida
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  setError("Link inválido ou expirado");
}
```

**O que acontece:**
- Verifica se há sessão de recovery válida
- Permite definir nova senha
- Atualiza senha no Supabase

---

## 🔍 Troubleshooting

### ❌ **Problema: Redireciona para home (`/`) ao invés de `/reset-password`**

**Causa Possível 1:** ⚠️ **Incompatibilidade entre URL com `www` e sem `www`**

**Este é um problema muito comum!** Se o usuário acessar o site com `www.vioslabs.com.br`, mas o **Site URL** no Supabase estiver configurado como `https://vioslabs.com.br` (sem `www`), o Supabase pode rejeitar o `redirectTo` e usar o Site URL como fallback.

**Solução Implementada:**
- O código agora normaliza o `redirectTo` para sempre remover `www.`, garantindo correspondência com o Site URL do Supabase.
- Se o usuário acessar com `www`, o código remove `www.` antes de enviar para o Supabase.

**Solução Alternativa (no Supabase):**
Você pode adicionar URLs com `www` nas **Redirect URLs**:
```
https://www.vioslabs.com.br/auth/callback
https://www.vioslabs.com.br/auth/callback?*
```

**Causa Possível 2:** ⚠️ **Site URL no Supabase está configurado incorretamente**

Se o **Site URL** no Supabase Dashboard estiver configurado incorretamente, o Supabase pode ignorar o `redirectTo` e usar o Site URL como fallback.

**Solução:**
1. Acesse **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Verifique o campo **Site URL**:
   - ✅ **DEVE SER:** `https://vioslabs.com.br` (apenas o domínio, sem `/` no final)
   - ❌ **NÃO DEVE SER:** `https://vioslabs.com.br/` (com `/`)
3. Se estiver configurado incorretamente, altere para o domínio base

**Causa Possível 2:** O `redirectTo` não está nas Redirect URLs

**Verificar:** O `redirectTo` deve ser:
```typescript
redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/reset-password`
```

**Solução:** Adicione no **Supabase Dashboard** → **Authentication** → **URL Configuration** → **Redirect URLs**:
```
https://vioslabs.com.br/auth/callback
https://vioslabs.com.br/auth/callback?*
https://vioslabs.com.br/reset-password
```

**Causa Possível 3:** O parâmetro `type` não está sendo passado

**Solução:** O callback verifica tanto `type=recovery` quanto `next=/reset-password`:
```typescript
if (type === 'recovery' || next === '/reset-password') {
  return NextResponse.redirect(`${origin}/reset-password`)
}
```

**Causa Possível 4:** Middleware bloqueando o acesso

**Solução:** O middleware foi ajustado para permitir `/reset-password` mesmo com sessão ativa.

### ❌ **Problema: "Link inválido ou expirado" (otp_expired)**

**Causa:** O código do email expirou ou já foi usado

**Sintomas:**
- URL: `https://vioslabs.com.br/?error=access_denied&error_code=otp_expired`
- Redireciona para home ao invés de `/reset-password`

**Solução Implementada:**
1. ✅ A home page (`page.tsx`) detecta erros de autenticação e redireciona para `/forgot-password`
2. ✅ O callback handler (`/auth/callback/route.ts`) captura erros e redireciona apropriadamente
3. ✅ Mensagens amigáveis explicando o problema

**Para o Usuário:**
1. Solicite um novo link de redefinição
2. Use o link imediatamente após receber (dentro de 1 hora)
3. Links de password reset expiram em 1 hora (padrão do Supabase)
4. Cada link só pode ser usado uma vez

**Se o problema persistir:**
- Verifique se `https://vioslabs.com.br/auth/callback` está nas **Redirect URLs** do Supabase
- Verifique se o **Site URL** está configurado corretamente

### ❌ **Problema: Callback não está processando o código**

**Verificar:**
1. Console do navegador - procure por logs do callback
2. Verifique se a URL tem `code=` e `type=recovery`
3. Verifique se `/auth/callback` está acessível

---

## 📝 URLs no Supabase Dashboard

### **1. Site URL (Configuração Principal):**

Acesse: **Supabase Dashboard** → **Authentication** → **URL Configuration**

```
Site URL: https://vioslabs.com.br
```

⚠️ **IMPORTANTE:**
- Use **apenas o domínio** (sem `/` no final)
- **NÃO** use `https://vioslabs.com.br/` (com `/`)
- Se o Site URL estiver errado, o Supabase pode ignorar o `redirectTo` e redirecionar para home

### **2. Redirect URLs (Permitir redirecionamentos específicos):**

Na mesma seção, adicione em **Redirect URLs**:

**Produção (sem www):**
```
https://vioslabs.com.br/auth/callback
https://vioslabs.com.br/auth/callback?*
https://vioslabs.com.br/reset-password
https://vioslabs.com.br/login
https://vioslabs.com.br/register
```

**Produção (com www) - OPCIONAL (se quiser suportar ambos):**
```
https://www.vioslabs.com.br/auth/callback
https://www.vioslabs.com.br/auth/callback?*
https://www.vioslabs.com.br/reset-password
```

💡 **Nota:** O código já normaliza para remover `www.` automaticamente, então essas URLs com `www` são opcionais. Mas adicioná-las garante compatibilidade total.

**Para desenvolvimento (localhost):**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?*
http://localhost:3000/reset-password
http://localhost:3000/login
http://localhost:3000/register
```

💡 **Dica:** Você pode usar wildcards (`*`) para permitir qualquer query parameter na URL do callback.

---

## ✅ Checklist de Verificação

- [ ] `redirectTo` está apontando para `/auth/callback?next=/reset-password`
- [ ] `/auth/callback` está na lista de Redirect URLs
- [ ] `/reset-password` está na lista de Redirect URLs
- [ ] Callback handler verifica `type=recovery` OU `next=/reset-password`
- [ ] Página `/reset-password` verifica sessão válida
- [ ] Email está sendo enviado corretamente

---

## 🔍 Debug

Para debugar problemas, adicione logs no callback:

```typescript
console.log('Callback recebido:', { code, type, next })
```

E verifique no console do servidor (não do navegador) quando o callback é chamado.

---

## 📚 Referências

- [Supabase Password Reset Docs](https://supabase.com/docs/guides/auth/auth-helpers/nextjs#password-reset)
- [Supabase Email Redirects](https://supabase.com/docs/guides/auth/auth-email-redirects)
