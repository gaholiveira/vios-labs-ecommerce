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

**Causa Possível 1:** O parâmetro `type` não está sendo passado pelo Supabase

**Solução:** O callback também verifica `next=/reset-password` como fallback:
```typescript
if (type === 'recovery' || next === '/reset-password') {
  return NextResponse.redirect(`${origin}/reset-password`)
}
```

**Causa Possível 2:** O `redirectTo` está errado

**Verificar:** O `redirectTo` deve ser:
```typescript
redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
```

**Não deve ser:**
```typescript
redirectTo: `${window.location.origin}/reset-password` // ❌ ERRADO
```

**Causa Possível 3:** URL não está nas Redirect URLs permitidas

**Solução:** Adicione no Supabase Dashboard:
```
https://vioslabs.com.br/auth/callback
https://vioslabs.com.br/auth/callback?next=*
https://vioslabs.com.br/reset-password
```

### ❌ **Problema: "Link inválido ou expirado"**

**Causa:** O código do email expirou ou já foi usado

**Solução:**
1. Solicite um novo link de redefinição
2. Use o link imediatamente após receber
3. Links de password reset expiram em 1 hora (padrão do Supabase)

### ❌ **Problema: Callback não está processando o código**

**Verificar:**
1. Console do navegador - procure por logs do callback
2. Verifique se a URL tem `code=` e `type=recovery`
3. Verifique se `/auth/callback` está acessível

---

## 📝 URLs no Supabase Dashboard

### **Redirect URLs (obrigatórias para password reset):**

```
https://vioslabs.com.br/auth/callback
https://vioslabs.com.br/auth/callback?next=*
https://vioslabs.com.br/auth/callback?type=recovery
https://vioslabs.com.br/reset-password
```

**Para desenvolvimento:**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=*
http://localhost:3000/reset-password
```

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
