# Documentação Completa do Fluxo de Autenticação

## Visão Geral

Este documento descreve o fluxo completo e estruturado de autenticação implementado no VIOS Labs E-commerce, seguindo as melhores práticas de segurança e UX.

---

## Arquitetura do Sistema

### Componentes Principais

1. **Páginas de Autenticação**
   - `/login` - Login de usuário
   - `/register` - Registro de nova conta
   - `/forgot-password` - Solicitação de redefinição de senha
   - `/update-password` - Atualização de senha (após clicar no link)

2. **Route Handlers**
   - `/auth/callback` - Processa callbacks de autenticação (PKCE)
   - `/api/auth/resend-confirmation` - Reenvia email de confirmação

3. **Utilitários**
   - `src/utils/auth.ts` - Funções centralizadas de autenticação
   - `src/utils/supabase/client.ts` - Cliente Supabase para Client Components
   - `src/utils/supabase/server.ts` - Cliente Supabase para Server Components

4. **Componentes**
   - `ResendConfirmationEmail` - Componente para reenvio de confirmação

---

## Fluxos Detalhados

### 1. Fluxo de Registro (Sign Up)

#### Passo a Passo:

1. **Usuário preenche formulário** (`/register`)
   - Nome completo
   - Email
   - Senha (mínimo 8 caracteres)

2. **Validação client-side**
   - Validação de campos obrigatórios
   - Validação de formato de email
   - Validação de tamanho mínimo de senha

3. **Chamada ao Supabase**
   ```typescript
   supabase.auth.signUp({
     email,
     password,
     options: {
       emailRedirectTo: `${origin}/auth/callback`,
       data: { full_name }
     }
   })
   ```

4. **Resposta do Supabase**
   - ✅ **Sucesso**: Usuário criado, email de confirmação enviado
     - Mostra componente de reenvio de email
     - Toast de sucesso
     - Opção de reenviar email se necessário
   - ❌ **Erro**: Mostra mensagem de erro específica

5. **Email de Confirmação**
   - Usuário recebe email com link
   - Link contém código PKCE e `type=signup`
   - Link aponta para `/auth/callback?code=XXX&type=signup`

#### Cenários de Erro:

- **Email já cadastrado**: Mensagem amigável
- **Senha muito fraca**: Validação client-side previne
- **Erro de rede**: Mensagem genérica com opção de tentar novamente

---

### 2. Fluxo de Confirmação de Email

#### Cenário A: Primeira Confirmação (Sucesso)

1. **Usuário clica no link do email**
   - Link: `/auth/callback?code=XXX&type=signup`

2. **Callback Route processa**
   - Lê código da URL
   - Troca código por sessão usando PKCE
   - Cria sessão de autenticação

3. **Redirecionamento**
   - ✅ Sessão criada → Redireciona para `/` (home)
   - Usuário está logado automaticamente

#### Cenário B: Link Já Usado (Email Confirmado)

1. **Usuário clica no link pela segunda vez**
   - Link já foi utilizado anteriormente

2. **Callback Route detecta erro PKCE**
   - Erro: "PKCE code verifier not found" ou "already been used"

3. **Verificação de Sessão**
   - Verifica se usuário já tem sessão ativa
   - ✅ **Com sessão**: Redireciona para `/?email-confirmed=true`
   - ❌ **Sem sessão**: Redireciona para `/login?email-confirmed=true`

4. **Página de Login**
   - Mostra banner verde: "Email já confirmado! ✅"
   - Instrui usuário a fazer login
   - Toast de sucesso

#### Cenário C: Link Expirado (Email Pode Estar Confirmado)

1. **Usuário clica em link expirado**
   - Link expirou (geralmente após 24h)

2. **Callback Route detecta erro**
   - Erro: "otp_expired" ou "expired"

3. **Tratamento Inteligente**
   - Assume que email pode já estar confirmado
   - Redireciona para `/login?email-confirmed=true`
   - Mensagem: "Se seu email já foi confirmado, faça login normalmente"

#### Cenário D: Email Não Confirmado (Tentativa de Login)

1. **Usuário tenta fazer login sem confirmar email**
   - Credenciais corretas mas email não confirmado

2. **Login detecta erro**
   - Erro específico do Supabase sobre email não confirmado

3. **Mostra Componente de Reenvio**
   - Banner amarelo com aviso
   - Botão "Reenviar email de confirmação"
   - Instruções claras

4. **Reenvio de Email**
   - Chama API `/api/auth/resend-confirmation`
   - Envia novo email de confirmação
   - Feedback de sucesso

---

### 3. Fluxo de Redefinição de Senha

#### Passo a Passo:

1. **Usuário solicita redefinição** (`/forgot-password`)
   - Digita email
   - Clica em "Enviar Link"

2. **Supabase envia email**
   - Email com link de redefinição
   - Link: `/auth/callback?code=XXX&type=recovery&next=/update-password`

3. **Usuário clica no link**
   - Callback Route processa
   - Troca código por sessão de recovery
   - Redireciona para `/update-password`

4. **Página de Update Password**
   - Verifica se há sessão válida de recovery
   - ✅ **Sessão válida**: Mostra formulário
   - ❌ **Sem sessão**: Mostra erro e redireciona para `/forgot-password`

5. **Usuário define nova senha**
   - Validação: mínimo 8 caracteres
   - Atualiza senha via `supabase.auth.updateUser()`

6. **Sucesso**
   - Toast de sucesso
   - Redireciona para `/login?password-reset=true`
   - Mensagem: "Senha redefinida com sucesso!"

#### Cenários de Erro:

- **Link expirado**: Solicita novo link
- **Link já usado**: Solicita novo link
- **Sessão inválida**: Redireciona para forgot-password

---

### 4. Fluxo de Login

#### Passo a Passo:

1. **Usuário preenche credenciais** (`/login`)
   - Email
   - Senha

2. **Validação e Autenticação**
   ```typescript
   supabase.auth.signInWithPassword({ email, password })
   ```

3. **Respostas Possíveis**:

   ✅ **Sucesso**: Usuário autenticado
   - Associa pedidos de guest checkout
   - Redireciona para página desejada ou home
   - Refresh da página

   ❌ **Email não confirmado**
   - Detecta erro específico
   - Mostra componente de reenvio
   - Instrui usuário a confirmar email

   ❌ **Credenciais inválidas**
   - Toast: "Credenciais inválidas"
   - Mensagem de erro no formulário

   ❌ **Outros erros**
   - Mensagem de erro específica
   - Toast notification

4. **Pós-Login**
   - Associação de pedidos guest
   - Redirecionamento inteligente
   - Refresh de sessão

---

## Estrutura de Código

### Callback Route (`/auth/callback/route.ts`)

**Responsabilidades:**
- Processar códigos de autenticação
- Trocar código por sessão (PKCE)
- Detectar tipo de autenticação (signup/recovery)
- Tratar erros de forma inteligente
- Redirecionar para páginas apropriadas

**Funções Principais:**
- `createSupabaseClient()` - Cria cliente com cookies corretos
- `processAuthError()` - Processa erros e retorna mensagens amigáveis
- `exchangeCodeForSession()` - Troca código por sessão
- `getRedirectUrl()` - Determina URL de redirecionamento
- `handlePKCEError()` - Trata erros de PKCE especificamente

**Fluxo de Decisão:**

```
Código presente?
├─ Sim → Trocar código por sessão
│   ├─ Sucesso → Redirecionar baseado em type
│   └─ Erro → Verificar tipo de erro
│       ├─ PKCE/Link usado → Verificar sessão existente
│       └─ Outro erro → Redirecionar com mensagem
│
Erro na URL?
├─ Sim → Processar erro
│   ├─ Recovery → /forgot-password
│   └─ Signup/Outro → /login?email-confirmed=true
│
Sem código nem erro?
└─ Redirecionar para /login?error=no-code
```

---

### Página de Login (`/login/page.tsx`)

**Estados:**
- `email` - Email do usuário
- `password` - Senha
- `loading` - Estado de carregamento
- `error` - Mensagem de erro
- `showEmailConfirmed` - Banner de email confirmado
- `showEmailNotConfirmed` - Componente de reenvio

**Lógica de Detecção:**
- Verifica parâmetros da URL (`email-confirmed`, `registered`, `password-reset`)
- Detecta erro de email não confirmado no login
- Mostra componentes apropriados baseado no estado

**Componentes Condicionais:**
- Banner verde: Email já confirmado
- Banner amarelo + Reenvio: Email não confirmado
- Erro vermelho: Credenciais inválidas ou outros erros

---

### Página de Registro (`/register/page.tsx`)

**Melhorias Implementadas:**
- Validação client-side robusta
- Feedback visual de erros por campo
- Componente de reenvio após registro
- Não redireciona imediatamente (permite reenvio)
- Link direto para login após confirmação

---

### Página de Forgot Password (`/forgot-password/page.tsx`)

**Fluxo:**
1. Usuário digita email
2. Supabase envia email de reset
3. Mensagem de sucesso com instruções
4. Link para voltar ao login

**Tratamento de Erros:**
- Erros da URL (vindos do callback)
- Erros de envio de email
- Mensagens amigáveis

---

### Página de Update Password (`/update-password/page.tsx`)

**Validações:**
- Verifica sessão de recovery ao carregar
- Valida senha (mínimo 8 caracteres)
- Confirma atualização bem-sucedida

**Segurança:**
- Só funciona com sessão válida de recovery
- Redireciona se sessão inválida
- Limpa sessão após atualização

---

## Componentes Reutilizáveis

### ResendConfirmationEmail

**Props:**
- `email: string` - Email para reenviar confirmação
- `onSuccess?: () => void` - Callback de sucesso
- `onError?: (error: string) => void` - Callback de erro
- `className?: string` - Classes CSS adicionais

**Estados:**
- `loading` - Carregamento
- `success` - Email enviado com sucesso
- `error` - Erro ao enviar

**Comportamento:**
- Banner amarelo com aviso quando não confirmado
- Banner verde quando email reenviado
- Auto-hide após 8 segundos (sucesso)
- Botão de reenvio com loading state

---

## API Routes

### POST `/api/auth/resend-confirmation`

**Request:**
```json
{
  "email": "usuario@email.com"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "message": "Email de confirmação enviado. Verifique sua caixa de entrada e spam."
}
```

**Response (Erro):**
```json
{
  "error": "Mensagem de erro"
}
```

**Implementação:**
- Usa `signUp` novamente para reenviar email
- Não expõe se email está confirmado (segurança)
- Retorna mensagem genérica em caso de dúvida

---

## Tratamento de Erros

### Categorias de Erros

1. **Erros de PKCE**
   - Link já usado
   - Code verifier não encontrado
   - Link expirado

2. **Erros de Autenticação**
   - Credenciais inválidas
   - Email não confirmado
   - Conta não encontrada

3. **Erros de Validação**
   - Campos obrigatórios
   - Formato inválido
   - Tamanho mínimo

4. **Erros de Rede/Servidor**
   - Timeout
   - Erro interno
   - Serviço indisponível

### Mensagens Amigáveis

Todas as mensagens de erro são:
- ✅ Em português
- ✅ Específicas e acionáveis
- ✅ Não expõem informações sensíveis
- ✅ Oferecem próximos passos claros

---

## Segurança

### Implementações de Segurança

1. **PKCE (Proof Key for Code Exchange)**
   - Implementado via `@supabase/ssr`
   - Code verifier armazenado em cookies
   - Protege contra ataques de interceptação

2. **Cookies Seguros**
   - `sameSite: 'lax'` - Protege CSRF
   - `httpOnly: false` - Necessário para PKCE
   - `path: '/'` - Disponível em todas as rotas

3. **Validação de Sessão**
   - Verificação de sessão válida antes de operações sensíveis
   - Timeout automático de sessões
   - Refresh de token automático

4. **Rate Limiting**
   - Supabase gerencia rate limiting automaticamente
   - Previne abuso de APIs

5. **Sanitização de Inputs**
   - Validação client-side e server-side
   - Trim de espaços
   - Validação de formato

---

## UX/UI Melhorias

### Feedback Visual

1. **Estados de Loading**
   - Spinner animado
   - Texto "A processar..."
   - Botões desabilitados

2. **Mensagens de Sucesso**
   - Banner verde com ícone de checkmark
   - Toast notifications
   - Auto-hide após alguns segundos

3. **Mensagens de Erro**
   - Banner vermelho com mensagem clara
   - Erros por campo (validação)
   - Instruções de como resolver

4. **Estados Intermediários**
   - Banner amarelo para avisos
   - Componentes condicionais
   - Transições suaves

### Acessibilidade

- Labels adequados em todos os campos
- ARIA labels em botões
- Áreas de toque mínimas (44x44px)
- Navegação por teclado
- Contraste adequado

---

## Cenários de Teste

### Registro

1. ✅ Registro com dados válidos
2. ✅ Registro com email já cadastrado
3. ✅ Registro com senha muito curta
4. ✅ Registro com email inválido
5. ✅ Reenvio de email após registro

### Confirmação de Email

1. ✅ Primeira confirmação (sucesso)
2. ✅ Link já usado (email confirmado)
3. ✅ Link expirado (email pode estar confirmado)
4. ✅ Link em navegador diferente
5. ✅ Link com sessão ativa existente

### Login

1. ✅ Login com credenciais válidas
2. ✅ Login com email não confirmado
3. ✅ Login com senha incorreta
4. ✅ Login com email não cadastrado
5. ✅ Reenvio de confirmação durante login

### Redefinição de Senha

1. ✅ Solicitação de reset
2. ✅ Reset com link válido
3. ✅ Reset com link expirado
4. ✅ Reset com link já usado
5. ✅ Reset sem sessão válida

---

## Melhorias Futuras

### Curto Prazo
- [ ] Rate limiting customizado na API de resend
- [ ] Logs estruturados de autenticação
- [ ] Analytics de conversão de autenticação

### Médio Prazo
- [ ] Autenticação OAuth (Google, Facebook)
- [ ] Autenticação de dois fatores (2FA)
- [ ] Sessões múltiplas (dispositivos)

### Longo Prazo
- [ ] Biometria (WebAuthn)
- [ ] Magic links (sem senha)
- [ ] SSO empresarial

---

## Troubleshooting

### Problema: PKCE code verifier not found

**Causa:** Link aberto em navegador/dispositivo diferente ou cookies limpos

**Solução:** 
- Sistema detecta automaticamente
- Redireciona para login com mensagem amigável
- Usuário pode fazer login normalmente se email confirmado

### Problema: Email não recebido

**Causa:** Spam, email incorreto, ou delay do servidor

**Solução:**
- Componente de reenvio disponível
- Instruções para verificar spam
- Opção de tentar novamente

### Problema: Link expirado

**Causa:** Link expirou (geralmente 24h)

**Solução:**
- Mensagem clara sobre expiração
- Opção de solicitar novo link
- Verificação se email já confirmado

---

## Conclusão

O fluxo de autenticação implementado segue as melhores práticas de:
- ✅ Segurança (PKCE, validações, sanitização)
- ✅ UX (mensagens claras, feedback visual, fluxos intuitivos)
- ✅ Robustez (tratamento de todos os cenários)
- ✅ Manutenibilidade (código estruturado, documentado)

**Status:** ✅ Implementação completa e testada

**Data:** 21 de Janeiro de 2026
