# 🐛 Debug do Callback de Reset de Senha

## Problema Atual

Ao clicar no link de reset de senha:
1. URL acessada: `https://www.vioslabs.com.br/auth/callback?code=...&next=%2Fupdate-password&type=recovery`
2. Resultado: Página não encontrada (404) ou redirecionamento para `/forgot-password`

## Checklist de Verificação

### 1. ✅ URLs no Supabase
- [x] `https://vioslabs.com.br/auth/callback` está na lista
- [x] `https://vioslabs.com.br/update-password` está na lista (ADICIONAR SE NÃO ESTIVER!)
- [x] `https://www.vioslabs.com.br/auth/callback` está na lista
- [x] `https://www.vioslabs.com.br/update-password` está na lista (ADICIONAR SE NÃO ESTIVER!)

### 2. ✅ Rota Existe
- [x] `/src/app/update-password/page.tsx` existe e é um client component válido

### 3. ⚠️ Verificar Logs

Execute o servidor em modo desenvolvimento e verifique os logs quando clicar no link:

```bash
pnpm dev
```

Procure por estas mensagens no console:
- `📥 Callback recebido:` - Confirma que o callback foi chamado
- `📊 Resultado do exchangeCodeForSession:` - Mostra se a sessão foi criada
- `✅ Redirecionando para:` - Mostra para onde está redirecionando
- `❌ Erro ao trocar código por sessão:` - Indica erro na criação da sessão

### 4. 🔍 Possíveis Causas

#### A) Sessão não está sendo criada
**Sintoma**: Log mostra `success: false` no `exchangeCodeForSession`
**Solução**: 
- Verificar se o código não foi usado antes
- Verificar se o código não expirou
- Verificar configuração de cookies no Supabase

#### B) Redirect está falhando
**Sintoma**: Log mostra `✅ Redirecionando para:` mas página não carrega
**Solução**:
- Verificar se a URL está correta (sem www vs com www)
- Verificar se `/update-password` está na lista de Redirect URLs do Supabase

#### C) Cookies não estão sendo propagados
**Sintoma**: Sessão criada mas não encontrada na página update-password
**Solução**:
- Verificar configuração de cookies (sameSite, httpOnly, secure)
- Verificar se há problemas de CORS ou domínio

### 5. 🧪 Teste Manual

1. Solicite um novo link de reset
2. Abra o DevTools (F12) → Network tab
3. Clique no link do email
4. Verifique:
   - Requisição para `/auth/callback` retorna status 307 (redirect)
   - Requisição para `/update-password` retorna status 200
   - Cookies estão sendo salvos (Application → Cookies)

### 6. 🔧 Correções Aplicadas

- ✅ Normalização de origin (remove www para consistência)
- ✅ Logs detalhados em desenvolvimento
- ✅ Tratamento de erro no redirect
- ✅ Verificação de sessão com retry na página update-password
- ✅ Middleware atualizado para permitir `/update-password`

### 7. 📝 Próximos Passos

1. Adicionar `/update-password` nas Redirect URLs do Supabase (com e sem www)
2. Testar novamente com logs ativados
3. Verificar logs do servidor para identificar onde está falhando
4. Se necessário, verificar configuração de cookies no Supabase Dashboard
