# Configuração dos Templates de Email do Supabase

## Reset de senha (fluxo próprio)

O app **não usa** o template Supabase para reset de senha. O fluxo é:
1. Usuário solicita em `/forgot-password`
2. Server action gera senha temporária e atualiza no Supabase (service role)
3. Email enviado via **Resend** com a senha
4. Usuário faz login e altera a senha em **Perfil**

O template **Reset password** do Supabase pode ficar como está (não é usado).

---

## Problema: Confirmação de email

Se o link de **confirmação de cadastro** está com comportamento incorreto, verifique o seguinte:

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

## 3. Template Reset password (VIOS)

Use este HTML no **Reset password** do Supabase. O link usa `{{ .ConfirmationURL }}` corretamente.

**Se o link não for clicável:** verifique se o **Site URL** no Supabase (Authentication → URL Configuration) começa com `https://`. URLs sem protocolo são sanitizadas pelo Go e quebram o link.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #faf9f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 480px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 4px;">
          <tr>
            <td style="padding: 40px;">
              
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 20px; font-weight: 600; letter-spacing: 2px; color: #082f1e; text-transform: uppercase;">VIOS LABS</span>
              </div>

              <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 400; color: #1a1a1a; text-align: center; font-family: 'Times New Roman', serif;">
                Recuperação de Acesso
              </h1>

              <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                Recebemos uma solicitação para redefinir a senha da sua conta VIOS. Clique no link abaixo para criar uma nova senha segura.
              </p>

              <table align="center" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 30px;">
                <tr>
                  <td align="center" style="background-color: #082f1e; border-radius: 2px;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 32px; color: #ffffff !important; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
                      Redefinir Senha
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; font-size: 11px; color: #999999; text-align: center;">
                Se o botão não funcionar, copie e cole este link no navegador:
              </p>
              <p style="margin: 0 0 20px; font-size: 11px; color: #082f1e; text-align: center; word-break: break-all;">
                <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener noreferrer" style="color: #082f1e; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>

              <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
                Este link expira em breve. Se você não solicitou esta alteração, sua conta continua segura e nenhuma ação é necessária.
              </p>

            </td>
          </tr>
        </table>

        <div style="margin-top: 20px; text-align: center;">
          <p style="font-size: 10px; color: #b3b3b3; text-transform: uppercase; letter-spacing: 1px;">
            © VIOS LABS • Science of Longevity
          </p>
        </div>

      </td>
    </tr>
  </table>

</body>
</html>
```

### Link não clicável — checklist

| Causa | Solução |
|-------|---------|
| Site URL sem `https://` | Supabase → Authentication → URL Configuration → Site URL deve ser `https://vioslabs.com.br` |
| Link tracking do Resend | Desative (veja seção 4) — pode reescrever o link |
| Cliente de email bloqueando | Use o link de fallback (texto abaixo do botão) |
| Template com variável errada | Use exatamente `{{ .ConfirmationURL }}` (com ponto e maiúsculas) |

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

## 6. redirectTo com `next` para recovery

O `forgot-password` envia `redirectTo: /auth/callback?next=/update-password`. Assim, mesmo se o Supabase enviar `type=email` para recovery (igual ao signup), o callback identifica recovery pelo `next` e redireciona para `/update-password`.

**Adicione a URL permitida no Supabase:**
```
https://seu-dominio.com/auth/callback?next=/update-password
```

---

## 7. Página com botão obrigatório (recomendação Supabase)

O app usa uma página intermediária em `/auth/confirm` com o botão **"Continuar"** que o usuário deve clicar antes de prosseguir. Isso evita que scanners de email consumam o token automaticamente.

**Fluxo:** Link no email → Supabase verifica → redireciona para `/auth/callback` → redireciona para `/auth/confirm` → usuário clica em "Continuar" → exchange → redireciona para `/update-password` ou `/login`.

## 8. Reset de senha (senha temporária)

O app usa **senha temporária** enviada por email (Resend). Não usa link do Supabase.

**Fluxo:** Usuário solicita → server action gera senha → atualiza no Supabase (admin) → envia email com senha → usuário faz login → altera senha em Perfil.

---

## Resumo

1. Template **Reset password** separado e usando `{{ .ConfirmationURL }}`
2. Link tracking do Resend **desativado**
3. Redirect URL `https://seu-dominio.com/auth/callback` na lista de URLs permitidas do Supabase
4. Página `/auth/confirm` com botão obrigatório (recomendação Supabase para evitar consumo por scanners)
