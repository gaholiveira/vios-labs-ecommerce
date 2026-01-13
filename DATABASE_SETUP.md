# 🗄️ Guia de Configuração do Banco de Dados - VIOS LABS

Este guia explica como configurar o banco de dados Supabase para que todo o fluxo da aplicação funcione corretamente.

## 📋 Pré-requisitos

1. Conta no Supabase criada
2. Projeto Supabase criado
3. Acesso ao SQL Editor do Supabase

## 🚀 Passo a Passo

### 1. Acessar o SQL Editor

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

### 2. Executar o Script SQL

1. Abra o arquivo `database_setup.sql` neste projeto
2. Copie **todo o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

### 3. Verificar a Criação das Tabelas

Após executar o script, verifique se as tabelas foram criadas:

1. No menu lateral, clique em **Table Editor**
2. Você deve ver as seguintes tabelas:
   - ✅ `profiles`
   - ✅ `vip_list`
   - ✅ `orders`
   - ✅ `order_items`

## 📊 Estrutura das Tabelas

### `profiles`
Armazena os perfis dos usuários com informações pessoais e endereço.

**Campos:**
- `id` (UUID) - Referência ao usuário do auth
- `full_name` (TEXT) - Nome completo
- `phone` (TEXT) - Telefone (opcional)
- `address_street` (TEXT) - Rua e número (opcional)
- `address_city` (TEXT) - Cidade (opcional)
- `address_postcode` (TEXT) - CEP (opcional)
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

### `vip_list`
Armazena os membros da lista VIP do Lote Zero.

**Campos:**
- `id` (UUID) - ID único
- `email` (TEXT) - E-mail do usuário
- `user_id` (UUID) - Referência ao usuário (único)
- `full_name` (TEXT) - Nome completo
- `created_at` (TIMESTAMP) - Data de inscrição

### `orders`
Armazena os pedidos realizados pelos usuários.

**Campos:**
- `id` (UUID) - ID único do pedido
- `user_id` (UUID) - Referência ao usuário
- `status` (TEXT) - Status do pedido: `pending`, `paid`, `shipped`, `delivered`, `cancelled`
- `total_amount` (NUMERIC) - Valor total do pedido
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

### `order_items`
Armazena os itens individuais de cada pedido.

**Campos:**
- `id` (UUID) - ID único
- `order_id` (UUID) - Referência ao pedido
- `product_id` (TEXT) - ID do produto
- `product_name` (TEXT) - Nome do produto
- `quantity` (INTEGER) - Quantidade
- `price` (NUMERIC) - Preço unitário
- `created_at` (TIMESTAMP) - Data de criação

## 🔒 Segurança (RLS)

Todas as tabelas têm **Row Level Security (RLS)** habilitado, o que significa:

- ✅ Usuários só podem ver/editar seus próprios dados
- ✅ Usuários não podem acessar dados de outros usuários
- ✅ As políticas são aplicadas automaticamente

### Políticas Implementadas:

1. **profiles**: Usuários podem ver, criar e atualizar apenas seu próprio perfil
2. **vip_list**: Usuários podem ver e gerenciar apenas sua própria entrada na lista VIP
3. **orders**: Usuários podem ver e criar apenas seus próprios pedidos
4. **order_items**: Usuários podem ver e criar itens apenas para seus próprios pedidos

## 🔄 Funcionalidades Automáticas

### Criação Automática de Perfil

Quando um novo usuário é criado no Supabase Auth, um perfil é automaticamente criado na tabela `profiles` usando os metadados do usuário (nome completo).

### Atualização Automática de Timestamps

A coluna `updated_at` é atualizada automaticamente sempre que um registro é modificado nas tabelas `profiles` e `orders`.

## 🧪 Testar a Configuração

### 1. Testar Criação de Perfil

1. Crie um novo usuário através do formulário de registro
2. Verifique na tabela `profiles` se o perfil foi criado automaticamente
3. Acesse a página de perfil e verifique se os dados aparecem corretamente

### 2. Testar Lista VIP

1. Acesse a página `/lote-zero`
2. Se não estiver logado, crie uma conta
3. Se já estiver logado, confirme a entrada na lista VIP
4. Verifique na tabela `vip_list` se a entrada foi criada

### 3. Testar RLS (Segurança)

1. Crie dois usuários diferentes
2. Tente acessar os dados de um usuário enquanto está logado como outro
3. Você não deve conseguir ver os dados do outro usuário

## ⚠️ Troubleshooting

### Erro: "relation does not exist"

**Solução:** Execute o script SQL novamente. Certifique-se de copiar todo o conteúdo.

### Erro: "permission denied"

**Solução:** Verifique se as políticas RLS estão criadas corretamente. Execute novamente a seção de políticas RLS do script.

### Perfil não é criado automaticamente

**Solução:** Verifique se o trigger `on_auth_user_created` foi criado. Execute novamente a função `handle_new_user()` e o trigger.

### Não consigo inserir na vip_list

**Solução:** Verifique se:
1. Você está autenticado
2. O `user_id` corresponde ao ID do usuário logado
3. As políticas RLS estão ativas

## 📝 Notas Importantes

1. **Backup**: Sempre faça backup do banco antes de executar scripts SQL em produção
2. **Variáveis de Ambiente**: Certifique-se de que as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão configuradas no Vercel
3. **RLS**: Nunca desabilite o RLS em produção sem políticas adequadas
4. **Índices**: Os índices criados melhoram a performance das consultas

## 🔗 Links Úteis

- [Documentação do Supabase](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SQL Editor](https://app.supabase.com/project/_/sql)

## ✅ Checklist de Configuração

- [ ] Script SQL executado com sucesso
- [ ] Todas as 4 tabelas criadas
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas RLS criadas e funcionando
- [ ] Trigger de criação automática de perfil funcionando
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Teste de criação de usuário realizado
- [ ] Teste de lista VIP realizado
- [ ] Teste de segurança (RLS) realizado

---

**Pronto!** Seu banco de dados está configurado e pronto para uso. 🎉
