# 🎯 Fluxo do Lote Zero - VIOS Labs

## 📋 Overview

O formulário do Lote Zero é responsável por:
1. ✅ Criar conta de usuário (se não estiver logado)
2. ✅ Adicionar usuário à lista VIP no Supabase
3. ✅ Fazer login automático após criar conta
4. ✅ Atualizar perfil com nome completo

---

## 🔄 Fluxos Implementados

### **Cenário 1: Usuário JÁ Está Logado**

```
1. Cliente acessa /lote-zero estando logado
   ↓
2. Formulário reconhece user.id
   ↓
3. Solicita apenas Nome Completo
   ↓
4. Cliente preenche e clica em "Garantir Meu Acesso"
   ↓
5. Sistema:
   ├─ Atualiza perfil com nome
   └─ Adiciona à vip_list (upsert para evitar duplicatas)
   ↓
6. ✅ Sucesso! Cliente recebe confirmação
```

**SQL Executado:**
```sql
-- Atualizar perfil (incluindo WhatsApp)
UPDATE profiles
SET full_name = 'Nome do Cliente',
    phone = '+55 11 99999-9999',
    updated_at = NOW()
WHERE id = 'user-uuid';

-- Adicionar à VIP list (ou atualizar se já existe)
INSERT INTO vip_list (email, user_id, full_name, phone)
VALUES ('email@example.com', 'user-uuid', 'Nome do Cliente', '+55 11 99999-9999')
ON CONFLICT (user_id) 
DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email;
```

---

### **Cenário 2: Usuário NÃO Está Logado (Novo Cadastro)**

```
1. Cliente acessa /lote-zero sem estar logado
   ↓
2. Formulário solicita:
   ├─ Nome Completo
   ├─ Email
   ├─ Senha (mínimo 6 caracteres)
   └─ WhatsApp (opcional)
   ↓
3. Cliente preenche e clica em "Garantir Meu Acesso"
   ↓
4. Sistema cria conta no Supabase Auth:
   ├─ email: normalizado (lowercase, trim)
   ├─ password: validado (mínimo 6 caracteres)
   └─ metadata: {full_name, phone, vip_list: true}
   ↓
5. Aguarda 1 segundo (garantir processamento)
   ↓
6. Sistema cria perfil:
   ├─ id: user_uuid
   ├─ full_name: nome fornecido
   ├─ email: email normalizado
   └─ timestamps: created_at, updated_at
   ↓
7. Sistema adiciona à vip_list:
   ├─ email: email normalizado
   ├─ user_id: user_uuid
   └─ full_name: nome fornecido
   ↓
8. Sistema faz login automático:
   └─ signInWithPassword(email, password)
   ↓
9. ✅ Sucesso! Cliente logado e adicionado à VIP
```

**SQL Executado:**
```sql
-- 1. Criar usuário (via Supabase Auth)
-- auth.users é gerenciado pelo Supabase

-- 2. Criar perfil (incluindo WhatsApp)
INSERT INTO profiles (id, full_name, phone, email, created_at, updated_at)
VALUES ('new-user-uuid', 'Nome do Cliente', '+55 11 99999-9999', 'email@example.com', NOW(), NOW())
ON CONFLICT (id) 
DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  updated_at = NOW();

-- 3. Adicionar à VIP list (com WhatsApp)
INSERT INTO vip_list (email, user_id, full_name, phone)
VALUES ('email@example.com', 'new-user-uuid', 'Nome do Cliente', '+55 11 99999-9999');

-- Se falhar (duplicata), tentar novamente com upsert
INSERT INTO vip_list (email, user_id, full_name, phone)
VALUES ('email@example.com', 'new-user-uuid', 'Nome do Cliente', '+55 11 99999-9999')
ON CONFLICT (user_id) 
DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email;
```

---

## 🛡️ Proteções e Validações

### **1. Validação de Email**
```typescript
email.trim().toLowerCase()
```
- Remove espaços
- Converte para minúsculas
- Evita duplicatas por case-sensitivity

### **2. Validação de Senha**
```typescript
minLength={6}
required
```
- Mínimo 6 caracteres
- Campo obrigatório

### **3. Proteção contra Duplicatas**
```sql
ON CONFLICT (user_id) DO UPDATE SET ...
```
- Usa `upsert` para evitar erros
- Se usuário já existe, atualiza dados

### **4. Tratamento de Erros Amigável**
```typescript
if (authError.message.includes('already registered')) {
  onError('Este email já está cadastrado. Faça login para continuar.');
}
```
- Mensagens claras para o usuário
- Logs detalhados no console (debug)

### **5. Login Automático**
```typescript
await supabase.auth.signInWithPassword({
  email: email.trim().toLowerCase(),
  password,
});
```
- Cliente não precisa fazer login manualmente
- Experiência fluida e sem fricção

---

## 📊 Estrutura da Tabela `vip_list`

```sql
CREATE TABLE public.vip_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX idx_vip_list_user_id ON vip_list(user_id);
CREATE INDEX idx_vip_list_email ON vip_list(email);
CREATE INDEX idx_vip_list_phone ON vip_list(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_vip_list_created_at ON vip_list(created_at DESC);
```

**Campos:**
- `id`: UUID único
- `email`: Email do cliente
- `user_id`: Referência para auth.users (único)
- `full_name`: Nome completo
- `phone`: WhatsApp/Telefone de contato (opcional)
- `created_at`: Data de cadastro

**Constraints:**
- `user_id` é UNIQUE (um usuário só pode estar uma vez na lista)
- `user_id` referencia `auth.users(id)` com CASCADE
- `email` é obrigatório
- `phone` é opcional

---

## 🧪 Como Testar

### **Teste 1: Novo Cadastro**

1. Acessar http://localhost:3000/lote-zero (sem estar logado)
2. Preencher:
   - Nome: João Silva
   - Email: joao@example.com
   - Senha: 123456
   - WhatsApp: (opcional)
3. Clicar em "Garantir Meu Acesso"
4. ✅ Verificar:
   ```sql
   -- Verificar se foi adicionado à VIP list
   SELECT * FROM vip_list WHERE email = 'joao@example.com';
   
   -- Verificar perfil criado
   SELECT * FROM profiles WHERE email = 'joao@example.com';
   
   -- Verificar usuário criado
   SELECT * FROM auth.users WHERE email = 'joao@example.com';
   ```

### **Teste 2: Usuário Logado**

1. Fazer login com usuário existente
2. Acessar http://localhost:3000/lote-zero
3. Preencher apenas Nome Completo
4. Clicar em "Garantir Meu Acesso"
5. ✅ Verificar:
   ```sql
   -- Verificar se foi adicionado à VIP list
   SELECT * FROM vip_list WHERE user_id = 'seu-user-id';
   ```

### **Teste 3: Email Já Cadastrado**

1. Tentar criar conta com email que já existe
2. ✅ Deve mostrar: "Este email já está cadastrado. Faça login para continuar."

### **Teste 4: Senha Inválida**

1. Tentar criar conta com senha menor que 6 caracteres
2. ✅ Deve mostrar: "A senha deve ter no mínimo 6 caracteres."

---

## 🔍 Logs de Debug

O formulário agora tem logs detalhados para facilitar debug:

```typescript
console.log('[LOTE ZERO] Usuário logado, adicionando à VIP list:', user.id);
console.log('[LOTE ZERO] Criando nova conta para:', email);
console.log('[LOTE ZERO] ✅ Conta criada com sucesso! User ID:', authData.user.id);
console.log('[LOTE ZERO] ✅ Perfil criado com sucesso!');
console.log('[LOTE ZERO] ✅ Usuário adicionado à VIP list com sucesso!');
console.log('[LOTE ZERO] ✅ Login automático realizado com sucesso!');
```

**Verificar logs:**
1. Abrir DevTools (F12)
2. Ir para a aba Console
3. Procurar por `[LOTE ZERO]`

---

## 🆘 Troubleshooting

### **Problema 1: "Erro ao adicionar à VIP list"**

**Causa:** Tabela `vip_list` não existe

**Solução:**
```bash
# Executar script no Supabase SQL Editor
# database_setup_final.sql (linhas 104-128)
```

### **Problema 2: "Este email já está cadastrado"**

**Causa:** Email já foi usado para criar conta

**Solução:**
- Cliente deve fazer login ao invés de criar nova conta
- Ou usar outro email

### **Problema 3: Perfil não é criado**

**Causa:** Permissões RLS da tabela `profiles`

**Solução:**
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Garantir que service_role pode inserir
-- Ou criar política para authenticated users
```

### **Problema 4: Login automático não funciona**

**Causa:** Senha incorreta ou sessão não sincronizada

**Solução:**
- Não bloqueia o sucesso do cadastro
- Cliente pode fazer login manualmente depois
- Verificar logs do console

---

## 📈 Consultas Úteis

```sql
-- Total de pessoas na VIP list
SELECT COUNT(*) as total_vips FROM vip_list;

-- VIPs cadastrados hoje
SELECT 
  full_name,
  email,
  phone,
  created_at
FROM vip_list 
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;

-- VIPs sem user_id (apenas email)
SELECT * FROM vip_list 
WHERE user_id IS NULL;

-- VIPs com WhatsApp fornecido
SELECT 
  full_name,
  email,
  phone,
  created_at
FROM vip_list 
WHERE phone IS NOT NULL
ORDER BY created_at DESC;

-- VIPs sem WhatsApp (para fazer follow-up)
SELECT 
  full_name,
  email,
  created_at
FROM vip_list 
WHERE phone IS NULL
ORDER BY created_at DESC;

-- Top 10 mais recentes com todos os dados
SELECT 
  full_name,
  email,
  phone,
  created_at
FROM vip_list 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ✅ Checklist de Implementação

- [x] Formulário coleta dados corretos
- [x] Cria conta no Supabase Auth
- [x] Cria perfil na tabela `profiles`
- [x] Adiciona à tabela `vip_list`
- [x] Faz login automático após cadastro
- [x] Trata duplicatas com upsert
- [x] Mensagens de erro amigáveis
- [x] Logs detalhados para debug
- [x] Validação de email (lowercase, trim)
- [x] Validação de senha (mínimo 6 caracteres)
- [x] Suporte para usuário já logado
- [x] Suporte para novo cadastro

---

## 🎉 Resultado Final

**Fluxo Unificado e Robusto:**
- ✅ Cliente cria conta OU usa conta existente
- ✅ Dados são salvos em `vip_list` garantidamente
- ✅ Login automático após cadastro
- ✅ Experiência fluida sem fricção
- ✅ Tratamento de erros profissional
- ✅ Logs detalhados para debug

**VIOS Labs Lote Zero está pronto para capturar leads VIP! 🚀✨**

---

**Última atualização:** 2026-01-21  
**Versão:** 2.0.0  
**Status:** ✅ Otimizado e Pronto para Produção
