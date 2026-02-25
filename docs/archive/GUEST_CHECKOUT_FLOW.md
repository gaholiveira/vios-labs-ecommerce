# 🛒 Fluxo de Guest Checkout - Documentação Completa

## 📋 Visão Geral

O sistema foi configurado para suportar **Guest Checkout** (checkout como convidado) e **associação automática de pedidos** quando o usuário cria uma conta após fazer uma compra.

## ✅ Funcionalidades Implementadas

### 1. **Guest Checkout**
- ✅ Usuários podem fazer pedidos **sem criar conta**
- ✅ Pedidos são salvos com `user_id = NULL` e `customer_email` obrigatório
- ✅ Email é coletado durante o checkout do Stripe

### 2. **Associação Automática de Pedidos**
- ✅ Quando um usuário **cria conta** com o mesmo email usado no checkout, os pedidos são **automaticamente associados**
- ✅ Quando um usuário **faz login**, pedidos de guest são **associados automaticamente**
- ✅ Função SQL `associate_guest_orders()` executa automaticamente após criação de conta
- ✅ Função SQL `associate_my_guest_orders()` pode ser chamada manualmente após login

### 3. **Visualização de Pedidos**
- ✅ Usuários veem **todos os seus pedidos**: os associados ao `user_id` E os de guest checkout com o mesmo email
- ✅ Políticas RLS atualizadas para permitir acesso por `user_id` OU `customer_email`
- ✅ Interface luxury minimalist para visualização de pedidos

## 🗄️ Banco de Dados

### Estrutura da Tabela `orders`

```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL para guest checkout
  customer_email TEXT NOT NULL, -- Obrigatório (coletado no Stripe Checkout)
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Políticas RLS Atualizadas

As políticas permitem que usuários vejam pedidos por:
1. **user_id**: Pedidos associados ao usuário autenticado
2. **customer_email**: Pedidos de guest checkout com o mesmo email do usuário autenticado

```sql
CREATE POLICY "Users can view own orders by user_id or email"
  ON public.orders
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (
      auth.uid() IS NOT NULL 
      AND user_id IS NULL 
      AND customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
```

### Funções SQL Criadas

1. **`associate_guest_orders()`**
   - Trigger que executa automaticamente quando um novo usuário é criado
   - Associa pedidos de guest checkout ao `user_id` baseado no email

2. **`associate_my_guest_orders()`**
   - Função que pode ser chamada manualmente após login
   - Retorna o número de pedidos associados

## 📝 Passo a Passo para Configuração

### 1. Executar Script SQL

Execute o arquivo `guest_checkout_association.sql` no SQL Editor do Supabase:

```bash
# No Supabase Dashboard:
# 1. Vá para SQL Editor
# 2. Copie e cole o conteúdo de guest_checkout_association.sql
# 3. Execute o script
```

### 2. Verificar Estrutura do Banco

Certifique-se de que o banco tem:
- ✅ Tabela `orders` com `user_id` nullable e `customer_email` obrigatório
- ✅ Políticas RLS atualizadas
- ✅ Funções de associação criadas
- ✅ Triggers configurados

## 🔄 Fluxo Completo

### Cenário 1: Checkout como Convidado → Criar Conta

1. **Usuário faz checkout como convidado** (sem login)
   - Informa email no Stripe Checkout
   - Pedido é salvo com `user_id = NULL` e `customer_email = "usuario@email.com"`

2. **Usuário cria conta** com o mesmo email
   - Trigger `on_user_created_associate_orders` executa automaticamente
   - Pedidos de guest são associados ao novo `user_id`

3. **Usuário visualiza pedidos**
   - Acessa `/orders`
   - Vê todos os pedidos (associados automaticamente)

### Cenário 2: Checkout como Convidado → Login Existente

1. **Usuário faz checkout como convidado** (sem login)
   - Informa email no Stripe Checkout
   - Pedido é salvo com `user_id = NULL`

2. **Usuário faz login** com conta existente
   - Função `associate_my_guest_orders()` é chamada no código
   - Pedidos de guest são associados ao `user_id` do usuário logado

3. **Usuário visualiza pedidos**
   - Acessa `/orders`
   - Vê todos os pedidos (associados após login)

### Cenário 3: Checkout Logado

1. **Usuário já está logado** e faz checkout
   - Pedido é salvo com `user_id` já preenchido
   - Sem necessidade de associação

2. **Usuário visualiza pedidos**
   - Acessa `/orders`
   - Vê pedido normalmente

## 🎨 Interface do Usuário

### Página de Pedidos (`/orders`)

- ✅ Design luxury minimalist
- ✅ Lista todos os pedidos (por user_id OU email)
- ✅ Exibe status com ícones e cores
- ✅ Mostra itens de cada pedido com imagens
- ✅ Formatação de preços e datas
- ✅ Estado vazio elegante quando não há pedidos

### Página de Success (`/checkout/success`)

- ✅ Mensagem informando que pode criar conta para acompanhar pedido
- ✅ Link para registro com mesmo email
- ✅ Design luxury minimalist

## 🔧 Código Implementado

### Frontend

1. **`/app/orders/page.tsx`**
   - Busca pedidos por user_id OU email
   - Chama função de associação ao carregar
   - Verifica autenticação antes de exibir

2. **`/app/login/page.tsx`**
   - Chama `associate_my_guest_orders()` após login bem-sucedido

3. **`/app/checkout/success/page.tsx`**
   - Mensagem informando sobre criação de conta para acompanhar pedido

### Backend

1. **`/app/api/webhooks/stripe/route.ts`**
   - Salva pedidos com `user_id` nullable (guest checkout)
   - Salva `customer_email` obrigatório

## 🧪 Testes

### Teste 1: Checkout Guest → Criar Conta

1. Faça checkout como convidado (sem login)
2. Use email: `teste@email.com`
3. Complete o pagamento
4. Crie uma conta com `teste@email.com`
5. Acesse `/orders`
6. ✅ Verificar que o pedido aparece

### Teste 2: Checkout Guest → Login

1. Faça checkout como convidado
2. Use email: `existent@email.com`
3. Complete o pagamento
4. Faça login com conta existente `existent@email.com`
5. Acesse `/orders`
6. ✅ Verificar que o pedido aparece

### Teste 3: Verificação de Segurança

1. Faça checkout como convidado com email A
2. Faça login com email B (diferente)
3. Acesse `/orders`
4. ✅ Verificar que pedido com email A NÃO aparece

## 📚 Referências

- Script SQL: `guest_checkout_association.sql`
- Schema completo: `database_setup_complete.sql`
- Página de pedidos: `src/app/orders/page.tsx`
- Webhook Stripe: `src/app/api/webhooks/stripe/route.ts`

## 🚀 Próximos Passos (Opcional)

- [ ] Notificação por email quando pedidos são associados
- [ ] Dashboard administrativo para visualizar todos os pedidos
- [ ] Histórico de associações de pedidos
- [ ] Estatísticas de conversão guest → user
