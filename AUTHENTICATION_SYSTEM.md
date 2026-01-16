# 🔐 Sistema de Autenticação - VIOS LABS

## 📋 Visão Geral

Sistema de autenticação completo e otimizado usando Supabase Auth com Next.js 16 App Router, seguindo as melhores práticas recomendadas.

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
src/
├── utils/
│   └── supabase/
│       ├── client.ts     # Cliente para Client Components (browser)
│       └── server.ts     # Cliente para Server Components/Actions
├── hooks/
│   └── useAuth.ts        # Hook customizado para autenticação
├── middleware.ts         # Middleware para refresh de sessão e proteção de rotas
└── app/
    └── auth/
        └── callback/
            └── route.ts  # Handler para OAuth callbacks
```

## 🔧 Componentes Principais

### 1. **Client Utility** (`utils/supabase/client.ts`)

Cliente Supabase para uso em **Client Components**. Gerencia cookies automaticamente no navegador.

```typescript
import { createClient } from '@/utils/supabase/client'

// Em qualquer Client Component
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### 2. **Server Utility** (`utils/supabase/server.ts`)

Cliente Supabase para uso em **Server Components, Server Actions e Route Handlers**. Gerencia cookies para SSR.

```typescript
import { createClient } from '@/utils/supabase/server'

// Em Server Components ou Server Actions
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### 3. **Middleware** (`middleware.ts`)

Middleware que:
- ✅ **Refresh automático de sessão** - Mantém o token atualizado
- ✅ **Proteção de rotas** - Redireciona usuários não autenticados
- ✅ **Prevenção de acesso** - Usuários logados não acessam login/register

**Rotas Protegidas:**
- `/profile` - Requer autenticação

**Rotas Redirecionadas:**
- `/login` e `/register` - Redirecionam para `/` se já logado

### 4. **Hook useAuth** (`hooks/useAuth.ts`)

Hook customizado para facilitar o uso de autenticação em componentes.

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, loading, signOut } = useAuth()
  
  if (loading) return <div>Carregando...</div>
  if (!user) return <div>Não autenticado</div>
  
  return (
    <div>
      <p>Olá, {user.email}</p>
      <button onClick={signOut}>Sair</button>
    </div>
  )
}
```

**Features:**
- Estado reativo de autenticação
- Listeners automáticos para mudanças de sessão
- Função `signOut` integrada
- Redirecionamento automático no logout

### 5. **Auth Callback Handler** (`app/auth/callback/route.ts`)

Handler para processar callbacks de autenticação (OAuth, email links, etc.).

## 🔒 Segurança

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com políticas específicas:

#### **profiles**
- Usuários só podem ver/editar seu próprio perfil
- Inserção só é permitida com `user_id` correspondente

#### **vip_list**
- Usuários só podem ver/editar sua própria entrada VIP
- Verificação de status VIP é permitida para usuários autenticados

#### **orders** e **order_items**
- Usuários só podem ver seus próprios pedidos
- Apenas o dono pode criar/atualizar pedidos

### Token Refresh Automático

O middleware refresha automaticamente os tokens de sessão, evitando expiração durante a navegação.

## 🚀 Funcionalidades

### 1. **Login**

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

**Features:**
- Validação de formulário
- Mensagens de erro amigáveis
- Redirect após login (suporta `?redirect=/profile`)
- Tratamento de erros detalhado

### 2. **Registro**

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${origin}/auth/callback`,
    data: {
      full_name: formData.full_name,
      phone: formData.phone,
    },
  },
})
```

**Features:**
- Criação automática de perfil via trigger
- Confirmação de email (opcional)
- Validação de senha forte
- Tratamento de duplicação

### 3. **Logout**

```typescript
await supabase.auth.signOut()
```

**Features:**
- Limpeza de sessão
- Redirecionamento automático
- Refresh de página

### 4. **Verificação de Sessão**

```typescript
const { data: { user } } = await supabase.auth.getUser()
```

**Features:**
- Verificação em qualquer componente
- Refresh automático via middleware
- Estado reativo via hook `useAuth`

## 📝 Fluxos

### Fluxo de Login

```
1. Usuário preenche formulário
2. Client Component chama signInWithPassword
3. Supabase valida credenciais
4. Token é armazenado em cookies (httpOnly)
5. Middleware detecta sessão e refresha token
6. Redirect para página desejada ou "/"
```

### Fluxo de Registro

```
1. Usuário preenche formulário
2. Client Component chama signUp
3. Supabase cria usuário em auth.users
4. Trigger automático cria perfil em profiles
5. Email de confirmação é enviado (se configurado)
6. Redirect para login com mensagem de sucesso
```

### Fluxo de Refresh de Sessão

```
1. Usuário navega entre páginas
2. Middleware intercepta request
3. Verifica e refresha token se necessário
4. Continua com request original
```

## 🔍 Debugging

### Verificar Sessão

```typescript
// No console do navegador
const { createClient } = await import('@/utils/supabase/client')
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)
```

### Verificar Cookies

No DevTools → Application → Cookies, procure por:
- `sb-<project-ref>-auth-token`
- `sb-<project-ref>-auth-token.0` e `.1`

### Logs de Erro

Todos os erros são logados com contexto usando `logDatabaseError()`:
```typescript
logDatabaseError('Contexto do erro', error)
```

Isso mostra no console:
- Mensagem do erro
- Detalhes
- Hint
- Código
- Erro completo

## 🛠️ Configuração

### Variáveis de Ambiente

`.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key
```

### Configuração no Supabase

1. **Auth Settings** → Site URL:
   - Desenvolvimento: `http://localhost:3000`
   - Produção: `https://seu-dominio.com`

2. **Auth Settings** → Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://seu-dominio.com/auth/callback`

3. **Database** → Execute `database_setup_v2.sql`

## 📚 Boas Práticas

### ✅ Use Client Components para:
- Formulários de login/registro
- Componentes que precisam de interatividade
- Componentes que usam hooks React

### ✅ Use Server Components para:
- Buscar dados iniciais
- Renderização estática
- Performance otimizada

### ✅ Use Middleware para:
- Proteção de rotas
- Refresh de sessão
- Redirects automáticos

### ✅ Sempre:
- Use `createClient()` correto para cada contexto
- Trate erros adequadamente
- Use RLS para segurança
- Valide inputs no cliente E servidor

## 🐛 Troubleshooting

### "Session expired"
- Verifique se o middleware está rodando
- Verifique cookies no navegador
- Limpe cookies e tente novamente

### "Permission denied"
- Verifique políticas RLS no Supabase
- Verifique se `auth.uid()` corresponde ao `user_id`
- Verifique logs no Supabase Dashboard

### "Database error"
- Execute `database_setup_v2.sql` novamente
- Verifique se os triggers existem
- Verifique logs de erro no console (usando `logDatabaseError`)

## 🔄 Migração do Sistema Antigo

Se você já tem um sistema antigo:

1. **Execute o SQL novo** (`database_setup_v2.sql`) - É idempotente
2. **Substitua imports** de `createClient` pelo correto (client ou server)
3. **Adicione middleware.ts** na raiz do projeto
4. **Atualize componentes** para usar `useAuth` quando apropriado
5. **Teste** todos os fluxos de autenticação

## 📖 Recursos

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Auth Patterns](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
