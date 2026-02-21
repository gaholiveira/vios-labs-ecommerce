# Configuração dos Templates de Email do Supabase

## Problema: Reset de senha e confirmação de email com o mesmo comportamento

Se o link de **redefinir senha** está redirecionando para a tela de login (como se fosse confirmação de email), verifique o seguinte:

---

## 1. Templates separados no Supabase

**Supabase Dashboard → Authentication → Email Templates**

Existem templates **diferentes** para cada tipo de email:

| Template | Uso | Variável do link |
|----------|-----|------------------|
| **Confirm signup** | Confirmação de cadastro | `{{ .ConfirmationURL }}` |
| **Reset password** | Redefinição de senha | `{{ .ConfirmationURL }}` |

O **Reset password** deve ter seu próprio conteúdo. Não use o mesmo HTML do Confirm signup.

---

## 2. Link obrigatório: `{{ .ConfirmationURL }}`

Em **ambos** os templates, o link do botão **deve** usar:

```html
<a href="{{ .ConfirmationURL }}">Clique aqui</a>
```

**Não use:**
- `{{ .SiteURL }}/login` — pula a verificação do Supabase
- `{{ .SiteURL }}/auth/callback` — pula a verificação
- Link fixo ou customizado — perde o `type` (recovery vs email)

O `{{ .ConfirmationURL }}` é preenchido pelo Supabase com a URL correta, incluindo:
- `type=recovery` para reset de senha
- `type=email` para confirmação de cadastro

---

## 3. Exemplo do template Reset password

```html
<h2>Redefinir senha</h2>
<p>Você solicitou a redefinição de senha. Clique no link abaixo:</p>
<p><a href="{{ .ConfirmationURL }}">Redefinir minha senha</a></p>
<p>Se não foi você, ignore este email.</p>
```

---

## 4. Resend: desativar link tracking

Se o Resend tiver **link tracking** ativado, os links podem ser reescritos e o parâmetro `type` pode ser perdido.

**Resend Dashboard → Domains → [seu domínio] → Settings**

- Desative **Click Tracking** ou **Link Tracking** para os emails de autenticação.

A documentação do Supabase alerta: *"If you are using an external email provider that enables 'email tracking', the links inside the Supabase email templates will be overwritten and won't perform as expected."*

---

## 5. Verificar o link recebido no email

Ao receber o email de reset de senha, passe o mouse sobre o link (sem clicar) e veja a URL no canto inferior do navegador. Ela deve ser algo como:

```
https://[seu-projeto].supabase.co/auth/v1/verify?token_hash=...&type=recovery&redirect_to=https://vioslabs.com.br/auth/callback
```

Se aparecer `type=email` em vez de `type=recovery`, o template de Reset password está incorreto.

---

## Resumo

1. Template **Reset password** separado e usando `{{ .ConfirmationURL }}`
2. Link tracking do Resend **desativado**
3. Redirect URL `https://seu-dominio.com/auth/callback` na lista de URLs permitidas do Supabase
