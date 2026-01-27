# 📧 Guia Completo: Configuração do Resend - Passo a Passo

## 🎯 O que é o Resend?

O Resend é um serviço de envio de emails transacionais (confirmações de pedido, emails de autenticação, etc.). É usado no projeto para enviar emails de confirmação de pedidos após o checkout.

---

## 📋 Passo 1: Criar Conta no Resend

### 1.1 Acessar o Site
1. Acesse [https://resend.com](https://resend.com)
2. Clique em **"Sign Up"** ou **"Get Started"**

### 1.2 Criar Conta
1. Preencha o formulário:
   - **Email**: Seu email profissional
   - **Senha**: Crie uma senha forte
   - **Nome**: Seu nome ou nome da empresa
2. Clique em **"Create Account"**

### 1.3 Verificar Email
1. Verifique sua caixa de entrada
2. Clique no link de verificação enviado pelo Resend
3. Sua conta estará ativa

**✅ Plano Gratuito:**
- 3.000 emails/mês
- 100 emails/dia
- Domínio personalizado (com verificação)

---

## 🔑 Passo 2: Obter API Key

### 2.1 Acessar API Keys
1. Após fazer login, vá para o **Dashboard**
2. No menu lateral, clique em **"API Keys"**
3. Você verá a lista de API Keys (inicialmente vazia)

### 2.2 Criar Nova API Key
1. Clique no botão **"Create API Key"** (canto superior direito)
2. Preencha o formulário:
   - **Name**: `VIOS LABS Production` (ou outro nome descritivo)
   - **Permission**: Selecione **"Sending access"** (permissão de envio)
   - **Expires**: Deixe em branco para não expirar (ou defina uma data)
3. Clique em **"Add"**

### 2.3 Copiar API Key
⚠️ **IMPORTANTE**: A API Key só aparece UMA VEZ!

1. **Copie imediatamente** a chave que aparece (começa com `re_`)
2. Formato: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. **Salve em local seguro** (você precisará dela depois)

**💡 Dica**: Se perder a chave, você precisará criar uma nova e excluir a antiga.

---

## 🌐 Passo 3: Configurar Domínio (Opcional mas Recomendado)

### Por que configurar um domínio?

- ✅ Emails vêm de `noreply@vioslabs.com.br` (mais profissional)
- ✅ Melhor taxa de entrega
- ✅ Menos chance de ir para spam
- ✅ Sem limite de 100 emails/dia (domínio verificado)

### 3.1 Adicionar Domínio
1. No Dashboard do Resend, vá para **"Domains"**
2. Clique em **"Add Domain"**
3. Digite seu domínio: `vioslabs.com.br` (sem `www` ou `http://`)
4. Clique em **"Add"**

### 3.2 Configurar DNS
O Resend mostrará os registros DNS que você precisa adicionar:

**Registros necessários:**

1. **SPF Record** (TXT)
   ```
   v=spf1 include:resend.com ~all
   ```
   - **Nome/Host**: `@` ou `vioslabs.com.br`
   - **Tipo**: `TXT`
   - **Valor**: `v=spf1 include:resend.com ~all`

2. **DKIM Records** (2 registros CNAME)
   - O Resend fornecerá 2 registros CNAME únicos
   - Exemplo:
     ```
     resend._domainkey.vioslabs.com.br → [valor fornecido]
     ```

3. **DMARC Record** (TXT) - Opcional mas recomendado
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@vioslabs.com.br
   ```
   - **Nome/Host**: `_dmarc`
   - **Tipo**: `TXT`
   - **Valor**: `v=DMARC1; p=none; rua=mailto:dmarc@vioslabs.com.br`

### 3.3 Adicionar Registros no Provedor DNS

**Onde adicionar:**
- Registro.br (se o domínio está lá)
- Cloudflare (se usa Cloudflare)
- GoDaddy, Namecheap, etc. (conforme seu provedor)

**Como adicionar:**
1. Acesse o painel do seu provedor DNS
2. Vá para **"DNS"** ou **"Zona DNS"**
3. Adicione cada registro conforme instruções do Resend
4. Salve as alterações

### 3.4 Aguardar Verificação
1. Volte ao Dashboard do Resend
2. O status do domínio será **"Pending"** (pendente)
3. Aguarde alguns minutos (pode levar até 24 horas)
4. Quando verificado, o status mudará para **"Verified"** ✅

**💡 Dica**: Você pode testar o envio mesmo antes da verificação usando `noreply@resend.dev`

---

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

### 4.1 No Arquivo Local (.env)

Abra o arquivo `.env` na raiz do projeto e configure:

```env
# ============================================
# RESEND (EMAIL) CONFIGURATION
# ============================================
# API Key do Resend (obtida no Passo 2)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email do remetente
# Opção 1: Com domínio verificado (RECOMENDADO)
RESEND_FROM_EMAIL=noreply@vioslabs.com.br

# Opção 2: Sem domínio verificado (para testes)
# RESEND_FROM_EMAIL=noreply@resend.dev

# Nome do site (usado no remetente)
NEXT_PUBLIC_SITE_NAME=VIOS LABS

# URL do site (para links nos emails)
NEXT_PUBLIC_SITE_URL=https://vioslabs.com.br
```

**⚠️ IMPORTANTE:**
- Substitua `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` pela sua API Key real
- Se não tiver domínio verificado, use `noreply@resend.dev`
- Se tiver domínio verificado, use `noreply@vioslabs.com.br` (ou outro email do seu domínio)

### 4.2 Na Vercel (Produção)

1. Acesse [https://vercel.com](https://vercel.com)
2. Vá para seu projeto **VIOS Labs**
3. Clique em **"Settings"** → **"Environment Variables"**
4. Adicione cada variável:
   - **Key**: `RESEND_API_KEY`
   - **Value**: Sua API Key (começa com `re_`)
   - **Environment**: `Production`, `Preview`, `Development` (marque todos)
   - Clique em **"Save"**
5. Repita para:
   - `RESEND_FROM_EMAIL`
   - `NEXT_PUBLIC_SITE_NAME`
   - `NEXT_PUBLIC_SITE_URL`
6. **Redeploy** o projeto após adicionar as variáveis

---

## 📦 Passo 5: Verificar Instalação da Dependência

### 5.1 Verificar se está Instalado

Execute no terminal:
```bash
pnpm list resend
```

### 5.2 Se não estiver instalado

```bash
pnpm install resend
```

**✅ Verificação:**
- O pacote `resend` deve estar em `package.json` → `dependencies`
- Versão atual: `^4.0.0`

---

## 🧪 Passo 6: Testar Configuração

### 6.1 Teste Local (Desenvolvimento)

1. **Inicie o servidor:**
   ```bash
   pnpm dev
   ```

2. **Faça um checkout de teste:**
   - Adicione produtos ao carrinho
   - Complete o checkout
   - Use um email real para receber o email de confirmação

3. **Verifique o email:**
   - Caixa de entrada
   - Pasta de spam (verifique também)
   - O email deve vir de `VIOS LABS <noreply@vioslabs.com.br>` (ou `noreply@resend.dev`)

### 6.2 Verificar Logs

Se o email não chegar, verifique os logs do servidor:
- Procure por erros relacionados a `RESEND_API_KEY`
- Verifique se a API Key está correta
- Verifique se o domínio está verificado (se usando domínio próprio)

### 6.3 Teste em Produção

1. Faça deploy na Vercel
2. Configure as variáveis de ambiente (Passo 4.2)
3. Faça um checkout real
4. Verifique o email

---

## 🔍 Passo 7: Verificar Onde o Resend é Usado

O Resend é usado em **2 lugares principais**:

### 7.1 Confirmação de Pedido (Checkout)
**Arquivo:** `src/app/api/webhooks/stripe/route.ts`

- Envia email automaticamente após pagamento confirmado
- Chamado via webhook do Stripe
- Template: Confirmação de pedido com detalhes

### 7.2 API de Envio Manual
**Arquivo:** `src/app/api/send-order-confirmation/route.ts`

- API route para enviar emails manualmente
- Pode ser chamada de outros lugares do código

---

## ⚠️ Troubleshooting (Solução de Problemas)

### Problema 1: "Missing RESEND_API_KEY"
**Solução:**
- Verifique se a variável está no `.env`
- Verifique se está configurada na Vercel
- Reinicie o servidor após adicionar

### Problema 2: "Email não chega"
**Soluções:**
1. Verifique a pasta de spam
2. Verifique se o domínio está verificado (se usando domínio próprio)
3. Verifique os logs do Resend no Dashboard
4. Verifique se não excedeu o limite (100 emails/dia sem domínio)

### Problema 3: "Invalid API Key"
**Solução:**
- Verifique se copiou a chave completa (começa com `re_`)
- Verifique se não há espaços antes/depois
- Crie uma nova API Key se necessário

### Problema 4: "Domain not verified"
**Solução:**
- Verifique se os registros DNS estão corretos
- Aguarde até 24 horas para propagação
- Use `noreply@resend.dev` temporariamente

---

## 📊 Monitoramento

### Dashboard do Resend

1. Acesse [https://resend.com/emails](https://resend.com/emails)
2. Veja todos os emails enviados
3. Verifique status (delivered, bounced, etc.)
4. Veja estatísticas de entrega

### Métricas Importantes:
- **Delivery Rate**: Taxa de entrega
- **Open Rate**: Taxa de abertura (se usar tracking)
- **Bounce Rate**: Taxa de rejeição

---

## ✅ Checklist Final

Antes de considerar a configuração completa:

- [ ] Conta criada no Resend
- [ ] API Key obtida e copiada
- [ ] API Key configurada no `.env`
- [ ] API Key configurada na Vercel
- [ ] Domínio verificado (opcional mas recomendado)
- [ ] `RESEND_FROM_EMAIL` configurado
- [ ] Teste local funcionando
- [ ] Teste em produção funcionando
- [ ] Emails chegando na caixa de entrada (não spam)

---

## 🎉 Pronto!

Após completar todos os passos, o Resend estará configurado e funcionando. Os emails de confirmação de pedido serão enviados automaticamente após cada checkout bem-sucedido.

**Próximos passos:**
- Monitorar emails no Dashboard do Resend
- Ajustar templates de email se necessário
- Configurar tracking de abertura (opcional)
