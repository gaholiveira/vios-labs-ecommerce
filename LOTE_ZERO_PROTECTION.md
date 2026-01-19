# 🔒 Proteção da Página /lote-zero

## 📋 Resumo

A página `/lote-zero` agora está protegida com um controle de abertura de vendas baseado no banco de dados. Se as vendas não estiverem abertas (`sales_open = false`), apenas um componente "Coming Soon" minimalista é exibido.

---

## 🗄️ Configuração do Banco de Dados

### 1. Criar a Tabela `app_config`

Execute o script SQL no SQL Editor do Supabase:

```bash
create_app_config_table.sql
```

Este script:
- ✅ Cria a tabela `app_config` com colunas: `id`, `key`, `value` (JSONB), `description`, `created_at`, `updated_at`
- ✅ Insere a configuração inicial: `sales_open = false`
- ✅ Configura RLS (Row Level Security): Todos podem ler, apenas `service_role` pode atualizar
- ✅ Adiciona triggers para atualizar `updated_at` automaticamente

### 2. Estrutura da Tabela

```sql
app_config
├── id (UUID, PRIMARY KEY)
├── key (TEXT, UNIQUE) - Ex: 'sales_open'
├── value (JSONB) - Ex: false, true, "21.01.2026"
├── description (TEXT) - Descrição da configuração
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## 🎨 Componente "Coming Soon"

**Arquivo:** `src/components/ComingSoon.tsx`

### Características:
- ✅ Fundo preto (`bg-brand-softblack`)
- ✅ Data centralizada: **21.01.2026**
- ✅ Tipografia de luxo (font-extralight, tracking apertado)
- ✅ Acentos em verde brand (`text-brand-green`)
- ✅ Layout minimalista e elegante
- ✅ Usa `useMobileViewportHeight` para altura fixa (evita layout shift)

### Visual:
```
┌─────────────────────────┐
│                         │
│      EM BREVE           │
│                         │
│     21.01.2026          │
│     ──────────          │
│      Lote Zero          │
│                         │
└─────────────────────────┘
```

---

## 🔄 Lógica de Controle

### Fluxo de Verificação:

1. **Ao carregar a página:**
   - Verifica `app_config` buscando `key = 'sales_open'`
   - Se a tabela não existir ou houver erro → Assume `sales_open = false` (modo seguro)
   - Se encontrar → Lê o valor e converte para boolean

2. **Se `sales_open = false`:**
   - ❌ Não renderiza o formulário
   - ✅ Renderiza apenas `<ComingSoon />`
   - ✅ Não verifica autenticação do usuário (economiza recursos)

3. **Se `sales_open = true`:**
   - ✅ Renderiza a página completa de vendas
   - ✅ Verifica autenticação do usuário
   - ✅ Mostra formulário de compra/cadastro

---

## 🚀 Como Abrir/Fechar as Vendas

### Via SQL Editor (Supabase):

**Para FECHAR as vendas:**
```sql
UPDATE public.app_config
SET value = 'false'::jsonb,
    updated_at = NOW()
WHERE key = 'sales_open';
```

**Para ABRIR as vendas:**
```sql
UPDATE public.app_config
SET value = 'true'::jsonb,
    updated_at = NOW()
WHERE key = 'sales_open';
```

### Via Dashboard (Recomendado):

1. Acesse o Supabase Dashboard
2. Vá em **Table Editor** → `app_config`
3. Clique na linha onde `key = 'sales_open'`
4. Edite o campo `value`: 
   - Para fechar: `false`
   - Para abrir: `true`
5. Salve

---

## ✅ Segurança

### Modo Seguro por Padrão:
- ✅ Se a tabela não existir → Assume vendas fechadas
- ✅ Se houver erro na consulta → Assume vendas fechadas
- ✅ Se o valor não puder ser interpretado → Assume vendas fechadas

**Isso garante que, mesmo em caso de erro, ninguém consegue comprar antes da hora.**

### RLS (Row Level Security):
- ✅ **Todos podem LER** (`SELECT`) - Necessário para verificar se as vendas estão abertas
- ✅ **Apenas `service_role` pode ATUALIZAR** - Previne alterações acidentais
- ✅ **Usuários comuns NÃO podem alterar** - Segurança garantida

---

## 📝 Checklist de Implementação

- [x] Script SQL criado (`create_app_config_table.sql`)
- [x] Componente `ComingSoon` criado
- [x] Página `/lote-zero` modificada para verificar `sales_open`
- [x] Lógica de modo seguro implementada
- [ ] **Execute o script SQL no Supabase**
- [ ] **Teste com `sales_open = false`** (deve mostrar Coming Soon)
- [ ] **Teste com `sales_open = true`** (deve mostrar página completa)
- [ ] **Verifique que o link não funciona antes da hora** ✅

---

## 🧪 Testes

### Teste 1: Vendas Fechadas
1. Execute: `UPDATE app_config SET value = 'false'::jsonb WHERE key = 'sales_open';`
2. Acesse `/lote-zero`
3. ✅ Deve mostrar apenas "Coming Soon" com a data **21.01.2026**
4. ✅ Não deve mostrar formulário ou conteúdo de vendas

### Teste 2: Vendas Abertas
1. Execute: `UPDATE app_config SET value = 'true'::jsonb WHERE key = 'sales_open';`
2. Acesse `/lote-zero`
3. ✅ Deve mostrar a página completa de vendas
4. ✅ Deve mostrar o formulário de cadastro/compra

### Teste 3: Tabela Não Existe (Modo Seguro)
1. Temporariamente renomeie a tabela ou remova
2. Acesse `/lote-zero`
3. ✅ Deve mostrar "Coming Soon" (modo seguro)
4. ✅ Não deve quebrar ou mostrar erros ao usuário

---

## 🎯 Próximos Passos

1. **Execute o script SQL** no Supabase
2. **Verifique** que a configuração inicial está como `sales_open = false`
3. **Teste** a página antes do lançamento
4. **Quando chegar a data do lançamento**, altere para `sales_open = true`

---

## 💡 Dicas

- **Mantenha `sales_open = false`** até o momento exato do lançamento
- **Teste em produção** antes do lançamento oficial
- **Use o SQL Editor** para mudanças rápidas (mais confiável que o dashboard)
- **Documente a data do lançamento** para não esquecer de abrir as vendas

---

## 🔗 Arquivos Modificados

1. `create_app_config_table.sql` - Script SQL para criar a tabela
2. `src/components/ComingSoon.tsx` - Componente "Coming Soon"
3. `src/app/lote-zero/page.tsx` - Lógica de verificação de `sales_open`

---

**A página está protegida e pronta para o lançamento!** 🎉
