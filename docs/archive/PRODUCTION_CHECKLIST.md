# ✅ Checklist de Produção - VIOS Labs

## 📋 Checklist Completo

### 1. Configurações do Next.js ✅
- [x] `next.config.ts` configurado
- [ ] Verificar otimizações de produção
- [ ] Verificar compressão e minificação
- [ ] Verificar configurações de imagens

### 2. Variáveis de Ambiente 🔒
- [x] `.env` criado com todas as variáveis
- [ ] Verificar se todas as variáveis estão configuradas na Vercel
- [ ] Verificar se secrets não estão expostos no código
- [ ] Verificar URLs de produção vs desenvolvimento

### 3. Console Logs 🧹
- [ ] Remover ou condicionar `console.log` para produção
- [x] Manter `console.error` e `console.warn` (úteis para debugging)
- [ ] Verificar logs de debug em APIs

### 4. Segurança 🔐
- [ ] Verificar validação de inputs
- [ ] Verificar proteção de rotas sensíveis
- [ ] Verificar CORS e headers de segurança
- [ ] Verificar rate limiting

### 5. Performance ⚡
- [ ] Verificar lazy loading de componentes
- [ ] Verificar otimização de imagens
- [ ] Verificar code splitting
- [ ] Verificar cache strategies

### 6. Banco de Dados 🗄️
- [ ] Verificar se todas as tabelas existem
- [ ] Verificar se funções RPC estão criadas
- [ ] Verificar políticas RLS
- [ ] Verificar índices para performance

### 7. Integrações 🔌
- [ ] Verificar configuração do Stripe (chaves de produção)
- [ ] Verificar webhook do Stripe configurado
- [ ] Verificar configuração do Supabase
- [ ] Verificar configuração do Resend (email)

### 8. Build e Deploy 🚀
- [ ] Testar build local (`pnpm build`)
- [ ] Verificar se não há erros de TypeScript
- [ ] Verificar se não há warnings críticos
- [ ] Verificar configurações da Vercel

### 9. Testes 🧪
- [ ] Testar fluxo de checkout completo
- [ ] Testar autenticação (login/registro)
- [ ] Testar carrinho de compras
- [ ] Testar webhooks do Stripe

### 10. Monitoramento 📊
- [ ] Configurar logs de erro (Sentry, LogRocket, etc.)
- [ ] Configurar analytics
- [ ] Configurar monitoramento de performance
