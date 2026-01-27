# 🔒 Configuração Segura de DNS para Resend - Sem Afetar Email do Workspace

## ✅ Resposta Rápida

**Você NÃO vai perder seu email do workspace!** Os registros DNS do Resend são para **subdomínios específicos** (`send.vioslabs.com.br` e `resend._domainkey.vioslabs.com.br`), não para o domínio principal (`vioslabs.com.br`).

---

## 🎯 Onde Encontrar os Registros DNS

### Opção 1: No Dashboard do Resend

1. Acesse [https://resend.com/domains](https://resend.com/domains)
2. Clique no domínio `vioslabs.com.br`
3. Você verá **3 registros DNS** que precisam ser adicionados:
   - **DKIM (TXT)**: `resend._domainkey`
   - **MX Record**: `send`
   - **SPF (TXT)**: `send`

### Opção 2: Copiar os Valores

Na página do domínio no Resend, você verá algo assim:

```
Tipo: TXT
Nome: resend._domainkey
Valor: p=MIGfMAOGCSqGSIb3DQEB... (valor completo)
TTL: Auto
```

**Copie exatamente** esses valores para adicionar no seu provedor DNS.

---

## 📍 Onde Adicionar os Registros DNS

### Se seu domínio está no Registro.br:

1. Acesse [https://registro.br](https://registro.br)
2. Faça login
3. Vá em **"Meus Domínios"** → `vioslabs.com.br`
4. Clique em **"DNS"** ou **"Zona DNS"**
5. Clique em **"Adicionar Registro"** ou **"Novo Registro"**

### Se está em outro provedor (Cloudflare, GoDaddy, etc.):

1. Acesse o painel do seu provedor
2. Vá para **"DNS"**, **"DNS Management"** ou **"Zona DNS"**
3. Procure por **"Adicionar Registro"** ou **"Add Record"**

---

## 🔐 Como Adicionar SEM Afetar seu Email do Workspace

### ⚠️ IMPORTANTE: Entendendo os Registros

Os registros do Resend são para **subdomínios**, não para o domínio principal:

1. **DKIM Record**: `resend._domainkey.vioslabs.com.br`
   - ✅ **NÃO afeta** o email do `vioslabs.com.br`
   - ✅ É um registro **NOVO** para autenticação

2. **MX Record**: `send.vioslabs.com.br`
   - ✅ **NÃO afeta** o email do `vioslabs.com.br`
   - ✅ É para o **subdomínio** `send`, não o domínio principal

3. **SPF Record**: `send.vioslabs.com.br`
   - ✅ **NÃO afeta** o SPF do `vioslabs.com.br`
   - ✅ É para o **subdomínio** `send`, não o domínio principal

### ✅ Regra de Ouro

**NÃO MODIFIQUE** registros existentes que tenham:
- **Nome/Host**: `@` ou `vioslabs.com.br` (domínio principal)
- **Nome/Host**: `mail` ou `email` (seu servidor de email atual)

**APENAS ADICIONE** novos registros com os nomes específicos do Resend:
- `resend._domainkey`
- `send`

---

## 📝 Passo a Passo Detalhado

### Passo 1: Identificar seu Provedor DNS

**Como descobrir:**
1. Acesse [https://whois.net](https://whois.net)
2. Digite `vioslabs.com.br`
3. Veja em **"Name Servers"** qual é o provedor:
   - `ns1.registro.br` → Registro.br
   - `*.cloudflare.com` → Cloudflare
   - `*.godaddy.com` → GoDaddy
   - etc.

### Passo 2: Acessar o Painel DNS

Conforme seu provedor:

**Registro.br:**
1. [https://registro.br](https://registro.br) → Login
2. **"Meus Domínios"** → `vioslabs.com.br`
3. **"DNS"** ou **"Zona DNS"**

**Cloudflare:**
1. [https://dash.cloudflare.com](https://dash.cloudflare.com) → Login
2. Selecione o domínio `vioslabs.com.br`
3. Vá em **"DNS"** → **"Records"**

**GoDaddy:**
1. [https://www.godaddy.com](https://www.godaddy.com) → Login
2. **"Meus Produtos"** → `vioslabs.com.br`
3. **"DNS"** ou **"Gerenciar DNS"**

### Passo 3: Adicionar os 3 Registros

**Registro 1: DKIM (TXT)**

```
Tipo: TXT
Nome/Host: resend._domainkey
Valor: [copie o valor completo do Resend]
TTL: Auto (ou 3600)
```

**Registro 2: MX Record**

```
Tipo: MX
Nome/Host: send
Valor: [copie o valor do Resend, ex: feedback-smtp.sa-east-1.amazonses.com]
Prioridade: 10
TTL: Auto (ou 3600)
```

**Registro 3: SPF (TXT)**

```
Tipo: TXT
Nome/Host: send
Valor: [copie o valor do Resend, ex: v=spf1 include:amazonses.com ~all]
TTL: Auto (ou 3600)
```

### Passo 4: Verificar Registros Existentes

**ANTES de adicionar, verifique se já existem registros com esses nomes:**

- ❌ Se existir um registro `resend._domainkey` → **SUBSTITUA** (é do Resend)
- ❌ Se existir um registro `send` (MX ou TXT) → **SUBSTITUA** (é do Resend)
- ✅ Se **NÃO existir** → **ADICIONE** novo registro

**⚠️ IMPORTANTE:**
- **NÃO mexa** em registros com nome `@`, `mail`, `email`, `smtp`
- Esses são do seu email do workspace e devem permanecer intactos

---

## 🛡️ Protegendo seu Email do Workspace

### Registros que NÃO devem ser alterados:

**MX Records do domínio principal:**
```
Nome: @ (ou vioslabs.com.br)
Tipo: MX
Valor: [seu servidor de email atual]
```
**→ NÃO MEXA NESTE!**

**SPF do domínio principal:**
```
Nome: @ (ou vioslabs.com.br)
Tipo: TXT
Valor: v=spf1 include:... [seu provedor de email]
```
**→ NÃO MEXA NESTE!**

**Outros registros de email:**
- `mail.vioslabs.com.br`
- `email.vioslabs.com.br`
- `smtp.vioslabs.com.br`
**→ NÃO MEXA NESTES!**

### ✅ O que você PODE fazer com segurança:

1. **Adicionar** novos registros com nomes específicos do Resend
2. **Substituir** apenas registros que já tenham os nomes `resend._domainkey` ou `send`
3. **Não tocar** em nenhum registro do domínio principal (`@`)

---

## 🔍 Verificação Após Adicionar

### 1. Aguardar Propagação

Após adicionar os registros:
- **TTL baixo (300-600)**: 5-15 minutos
- **TTL padrão (3600)**: 1-4 horas
- **TTL alto**: até 24 horas

### 2. Verificar no Resend

1. Volte ao Dashboard do Resend
2. A página atualiza automaticamente
3. Os status mudarão de **"Pending"** para **"Verified"** ✅

### 3. Testar Envio

Após verificação:
1. Faça um checkout de teste
2. Verifique se o email chega
3. O remetente será: `noreply@vioslabs.com.br` ✅

---

## 🆘 Troubleshooting

### Problema: "Registros não aparecem como verificados"

**Soluções:**
1. Aguarde mais tempo (propagação pode levar até 24h)
2. Verifique se copiou os valores **completos** (sem cortar)
3. Verifique se o **Nome/Host** está exatamente como no Resend
4. Use ferramentas de verificação DNS:
   - [https://mxtoolbox.com](https://mxtoolbox.com)
   - Digite: `resend._domainkey.vioslabs.com.br` (TXT)
   - Digite: `send.vioslabs.com.br` (MX)

### Problema: "Email do workspace parou de funcionar"

**Isso NÃO deveria acontecer**, mas se acontecer:

1. **NÃO entre em pânico** - os registros podem ser revertidos
2. Verifique se você **acidentalmente modificou** algum registro do domínio principal
3. Restaure os registros originais do seu provedor de email
4. Entre em contato com o suporte do seu provedor de email

**Prevenção:**
- ✅ Tire um **screenshot** dos registros DNS antes de fazer alterações
- ✅ Anote os valores dos registros existentes
- ✅ Adicione apenas registros **novos**, não modifique existentes

---

## ✅ Checklist de Segurança

Antes de adicionar os registros:

- [ ] Identifiquei meu provedor DNS
- [ ] Tirei screenshot dos registros atuais
- [ ] Anotei os valores dos registros de email existentes
- [ ] Verifiquei que vou adicionar apenas registros com nomes `resend._domainkey` e `send`
- [ ] Confirmei que NÃO vou modificar registros com nome `@`, `mail`, `email`
- [ ] Tenho acesso ao painel DNS do meu provedor

---

## 📞 Precisa de Ajuda?

Se ainda tiver dúvidas:

1. **Registro.br**: Suporte em [https://registro.br/atendimento](https://registro.br/atendimento)
2. **Cloudflare**: Documentação em [https://developers.cloudflare.com/dns](https://developers.cloudflare.com/dns)
3. **Resend**: Suporte em [https://resend.com/support](https://resend.com/support)

---

## 🎯 Resumo

✅ **Você NÃO vai perder seu email do workspace** porque:
- Os registros são para subdomínios (`send`, `resend._domainkey`)
- Não afetam o domínio principal (`vioslabs.com.br`)
- São registros novos, não substituem os existentes

✅ **Onde encontrar os registros:**
- Dashboard do Resend → Domains → `vioslabs.com.br`
- Copie os valores exatos (Tipo, Nome, Valor)

✅ **Como adicionar com segurança:**
- Adicione apenas registros com os nomes específicos do Resend
- Não modifique registros existentes do domínio principal
- Tire screenshot antes de fazer alterações
