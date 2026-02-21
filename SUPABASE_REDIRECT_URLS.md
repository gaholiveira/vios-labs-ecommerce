# 🔗 Configuração de Redirect URLs no Supabase

## 📋 URLs Necessárias para o Sistema de Autenticação

Com base no sistema implementado, você precisa configurar as seguintes URLs no Supabase Dashboard.

---

## 🎯 Configuração no Supabase Dashboard

Acesse: **Supabase Dashboard → Authentication → URL Configuration**

### 1. **Site URL**

A URL base do seu site. Use apenas uma:

**Produção (se seu domínio está no ar):**
```
https://seu-dominio.com
```

**OU**

**Desenvolvimento (local):**
```
http://localhost:3000
```

⚠️ **Importante:** Se você usar ambos (desenvolvimento e produção), você precisará alternar entre eles. Para produção, use apenas o domínio real.

---

### 2. **Redirect URLs**

⚠️ **Crítico para reset de senha:** Se `/auth/callback` não estiver na lista, o Supabase redireciona para a Site URL (ex.: `/login`) e o usuário não chega na tela de redefinir senha.

Adicione **todas** estas URLs (uma por linha):

#### **Produção:**
```
https://seu-dominio.com/auth/callback
https://seu-dominio.com/auth/callback?next=/update-password
https://seu-dominio.com/auth/callback?next=/
https://seu-dominio.com/auth/callback?next=/profile
https://seu-dominio.com/reset-password
https://seu-dominio.com/login
https://seu-dominio.com/login?redirect=/profile
https://seu-dominio.com/
```

#### **Desenvolvimento (adicione também para testes locais):**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=/
http://localhost:3000/auth/callback?next=/profile
http://localhost:3000/reset-password
http://localhost:3000/login
http://localhost:3000/login?redirect=/profile
http://localhost:3000/
```

---

## 📝 Explicação das URLs

### **`/auth/callback`**
- **Obrigatória** ✅
- Handler principal para callbacks de autenticação
- Processa códigos OAuth, email verification, password reset, etc.
- Usada em: `register/page.tsx` e `lote-zero/page.tsx`

### **`/auth/callback?next=/*`**
- **Opcional mas recomendada**
- Permite redirecionamento para páginas específicas após autenticação
- Exemplo: Após login, redireciona para `/profile`

### **`/login`**
- **Recomendada**
- Página de login do sistema
- Pode receber parâmetros de erro do callback

### **`/reset-password`**
- **Obrigatória** ✅
- Página para definir nova senha após clicar no link do email
- Usada após o callback processar o código de recovery

### **`/`**
- **Opcional**
- Página inicial (home)
- Útil para redirects após logout

---

## 🔒 URLs Mínimas (Obrigatórias)

Se quiser manter o mínimo, adicione pelo menos estas:

**Produção:**
```
https://seu-dominio.com/auth/callback
https://seu-dominio.com/auth/callback?next=*
https://seu-dominio.com/reset-password
```

**Desenvolvimento:**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=*
http://localhost:3000/reset-password
```

> **Nota:** O `*` no `next=*` permite qualquer valor para o parâmetro `next`.

---

## 🛠️ Como Configurar

### Passo a Passo:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://app.supabase.com
   - Selecione seu projeto

2. **Navegue para Authentication**
   - No menu lateral: **Authentication** → **URL Configuration**

3. **Configure Site URL**
   - Em **Site URL**, adicione:
     - **Produção:** `https://seu-dominio.com`
     - **OU** 
     - **Desenvolvimento:** `http://localhost:3000`

4. **Adicione Redirect URLs**
   - Em **Redirect URLs**, clique em **Add URL**
   - Adicione cada URL uma por uma
   - Ou copie e cole todas de uma vez (uma por linha)

5. **Salve as alterações**
   - Clique em **Save** ou **Update**

---

## 🌐 Exemplo Completo (Produção + Desenvolvimento)

Se você quiser suportar ambos os ambientes, você precisa **alternar** as configurações ou usar variáveis de ambiente diferentes no Supabase.

### Opção 1: Site URL para Produção, Redirect URLs para ambos

**Site URL:**
```
https://seu-dominio.com
```

**Redirect URLs:**
```
https://seu-dominio.com/auth/callback
https://seu-dominio.com/auth/callback?next=*
https://seu-dominio.com/login
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=*
http://localhost:3000/login
```

### Opção 2: Usar apenas Produção (Recomendado para produção)

**Site URL:**
```
https://seu-dominio.com
```

**Redirect URLs:**
```
https://seu-dominio.com/auth/callback
https://seu-dominio.com/auth/callback?next=*
https://seu-dominio.com/reset-password
https://seu-dominio.com/login
https://seu-dominio.com/
```

> **Nota:** Para desenvolvimento local, você pode criar um projeto separado no Supabase ou alternar as configurações quando necessário.

---

## 🔍 Verificação

Após configurar, teste:

### 1. **Teste de Registro**
- Crie uma conta nova
- Verifique se recebe o email de confirmação
- Clique no link do email
- Deve redirecionar para `/auth/callback` e depois para `/login` ou página inicial

### 2. **Teste de Login**
- Faça login
- Deve funcionar sem erros de redirect

### 3. **Teste de Proteção de Rotas**
- Acesse `/profile` sem estar logado
- Deve redirecionar para `/login?redirect=/profile`
- Após login, deve voltar para `/profile`

---

## ⚠️ Erros Comuns

### ❌ **"Redirect URL not allowed"**

**Causa:** A URL não está na lista de Redirect URLs permitidas.

**Solução:** Adicione a URL exata que está tentando usar na lista de Redirect URLs.

### ❌ **"Invalid redirect URL"**

**Causa:** A URL não corresponde ao formato esperado ou não está configurada.

**Solução:** Verifique se:
- A URL está na lista de Redirect URLs
- Não há espaços extras
- Está usando `https://` (não `http://`) em produção
- O domínio corresponde exatamente

### ❌ **Redireciona para localhost em produção**

**Causa:** `emailRedirectTo` está usando `window.location.origin` que pode estar incorreto.

**Solução:** O código já usa `window.location.origin`, mas verifique se está sendo executado no ambiente correto.

---

## 📚 URLs Usadas no Código

### Em `register/page.tsx`:
```typescript
emailRedirectTo: `${window.location.origin}/auth/callback`
```

### Em `lote-zero/page.tsx`:
```typescript
emailRedirectTo: `${window.location.origin}/auth/callback`
```

### Em `auth/callback/route.ts`:
```typescript
// Redireciona para `${origin}${next}` onde next pode ser '/', '/profile', etc.
```

---

## 🎯 Resumo Rápido

**Para seu domínio em produção, adicione estas URLs:**

```
https://seu-dominio.com/auth/callback
https://seu-dominio.com/auth/callback?next=*
https://seu-dominio.com/login
https://seu-dominio.com/
```

**Site URL:**
```
https://seu-dominio.com
```

Pronto! 🚀
