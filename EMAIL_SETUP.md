# 📧 Configuração de E-mails de Confirmação de Pedido

Este guia explica como configurar o envio automático de e-mails de confirmação de pedido após o checkout.

## 📋 Pré-requisitos

1. Conta no [Resend](https://resend.com) (plano gratuito: 3.000 e-mails/mês)
2. Domínio verificado no Resend (opcional, mas recomendado)
3. Variáveis de ambiente configuradas

## 🚀 Passo a Passo

### 1. Criar Conta no Resend

1. Acesse [https://resend.com](https://resend.com)
2. Clique em **Sign Up** e crie sua conta
3. Verifique seu e-mail

### 2. Obter API Key do Resend

1. No Dashboard do Resend, vá para **API Keys**
2. Clique em **Create API Key**
3. Escolha um nome (ex: "VIOS LABS Production")
4. Selecione as permissões necessárias (envio de e-mails)
5. **Copie a API Key** (ela só aparece uma vez!)

### 3. Configurar Domínio (Opcional mas Recomendado)

Para usar um domínio personalizado (ex: `noreply@vioslabs.com.br`):

1. No Dashboard do Resend, vá para **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `vioslabs.com.br`)
4. Adicione os registros DNS conforme instruído:
   - **SPF Record**: Para autenticação
   - **DKIM Records**: Para assinatura
   - **DMARC Record** (opcional): Para segurança adicional
5. Aguarde a verificação (pode levar algumas horas)

### 4. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email do remetente (use domínio verificado se tiver)
RESEND_FROM_EMAIL=noreply@vioslabs.com.br
# OU use o domínio padrão do Resend:
# RESEND_FROM_EMAIL=noreply@resend.dev

# Nome do site (opcional)
NEXT_PUBLIC_SITE_NAME=VIOS LABS

# URL do site (para links no email)
NEXT_PUBLIC_SITE_URL=https://vioslabs.com.br
```

### 5. Instalar Dependência

Execute no terminal:

```bash
pnpm install resend
```

### 6. Verificar Configuração

Após configurar, teste o envio de e-mail:

1. Faça um checkout de teste
2. Complete o pagamento
3. Verifique o e-mail do cliente (incluindo spam)
4. Verifique os logs do servidor para confirmação

## 📧 Template do E-mail

O template do e-mail inclui:

- ✅ **Header elegante** com logo/nome da VIOS LABS
- ✅ **Detalhes do pedido** (ID, data)
- ✅ **Lista de produtos** com imagens
- ✅ **Total do pedido** formatado em BRL
- ✅ **Próximos passos** (rastreamento)
- ✅ **Botão CTA** para acompanhar pedido
- ✅ **Footer** com informações de contato

### Design

O template segue o design **Luxury Minimalist** da VIOS LABS:
- Cores: Verde (#082f1e), Off-white (#faf9f6)
- Tipografia: Clean, legível
- Layout: Responsivo, funciona em todos os clientes de email

## 🔧 Como Funciona

1. **Checkout Completo**: Usuário completa pagamento no Stripe
2. **Webhook Stripe**: Recebe evento `checkout.session.completed`
3. **Pedido Criado**: Salva pedido no Supabase
4. **E-mail Enviado**: Chama API `/api/send-order-confirmation`
5. **Resend Processa**: Resend envia o e-mail para o cliente

### Fluxo Técnico

```
Stripe Webhook → Supabase (salvar pedido) → API Route → Resend → Cliente
```

## 📝 Personalização

### Alterar Template

Edite o arquivo `src/app/api/send-order-confirmation/route.ts`:

- Função `generateOrderConfirmationEmail()`: Template HTML
- Cores, fontes, layout podem ser ajustados
- Adicione/remova seções conforme necessário

### Adicionar Variáveis

Para adicionar novos dados ao e-mail:

1. Atualize o tipo `OrderConfirmationEmailData`
2. Passe os dados no webhook do Stripe
3. Use no template HTML

## 🧪 Testes

### Teste Local

1. Configure variáveis de ambiente
2. Execute `pnpm dev`
3. Faça checkout de teste
4. Verifique logs do servidor

### Teste em Produção

1. Configure variáveis de ambiente no Vercel/plataforma
2. Faça checkout de teste
3. Verifique e-mail recebido

## 📊 Monitoramento

### Dashboard do Resend

No Dashboard do Resend você pode:
- Ver e-mails enviados
- Verificar taxa de entrega
- Ver e-mails que falharam
- Analisar estatísticas

### Logs do Servidor

O webhook registra:
- ✅ Sucesso: `Order confirmation email sent to [email]`
- ⚠️ Erro: `Error sending confirmation email: [error]`

## 🔒 Segurança

- ✅ API Key armazenada como variável de ambiente
- ✅ Validação de dados antes de enviar
- ✅ Template HTML sanitizado
- ✅ Rate limiting via Resend (plano gratuito: 100 e-mails/dia)

## ❓ Troubleshooting

### E-mail não está sendo enviado

1. **Verifique API Key**: Certifique-se que `RESEND_API_KEY` está configurada
2. **Verifique logs**: Procure por erros no console do servidor
3. **Verifique spam**: E-mails podem estar na pasta de spam
4. **Verifique domínio**: Se usar domínio personalizado, certifique-se que está verificado

### E-mail na pasta de spam

1. **Configure SPF/DKIM**: Certifique-se que os registros DNS estão corretos
2. **Use domínio verificado**: Prefira usar domínio próprio ao invés de `@resend.dev`
3. **Evite palavras spam**: Use texto claro e profissional

### Erro de API Key

- Certifique-se que a chave está correta
- Verifique se não expirou
- Verifique permissões no Resend

## 📚 Recursos

- [Documentação do Resend](https://resend.com/docs)
- [Best Practices de Email](https://resend.com/docs/send-emails/best-practices)
- [Template Examples](https://resend.com/docs/send-emails/templates)

## ✅ Checklist

- [ ] Conta criada no Resend
- [ ] API Key obtida e configurada
- [ ] Domínio verificado (opcional)
- [ ] Variáveis de ambiente configuradas
- [ ] Pacote `resend` instalado
- [ ] Teste de envio realizado
- [ ] E-mail recebido e verificado

## 🎯 Próximos Passos (Opcional)

- [ ] E-mail de atualização de status (enviado, entregue)
- [ ] E-mail de rastreamento quando pedido é despachado
- [ ] E-mail de boas-vindas para novos usuários
- [ ] E-mail de recuperação de carrinho abandonado
- [ ] Templates em múltiplos idiomas
