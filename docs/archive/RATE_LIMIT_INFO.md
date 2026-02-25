# 📧 Informações sobre Rate Limit de Email

## O que é Rate Limit?

O **Rate Limit** (limite de taxa) é uma proteção do Supabase que limita quantos emails podem ser enviados em um período de tempo. Isso ajuda a prevenir:

- Spam
- Abuso do sistema
- Custos excessivos

## Quando acontece?

O erro "email rate limit exceeded" aparece quando:

1. **Muitas solicitações em pouco tempo**: Você solicitou muitos emails de reset de senha, confirmação, etc. em um curto período
2. **Testes repetidos**: Durante desenvolvimento/testes, você pode ter enviado muitos emails
3. **Limite do plano**: Dependendo do seu plano do Supabase, há limites diferentes

## Como resolver?

### Solução Imediata

**Aguarde alguns minutos** (geralmente 5-15 minutos) antes de tentar novamente. O limite é temporário e será resetado automaticamente.

### Para Desenvolvimento

1. **Use emails diferentes**: Em vez de usar o mesmo email repetidamente, teste com emails diferentes
2. **Aguarde entre testes**: Deixe alguns minutos entre cada teste
3. **Use modo de desenvolvimento**: Alguns serviços oferecem modo "dev" que tem limites mais altos

### Verificar Limites no Supabase

1. Acesse o Dashboard do Supabase
2. Vá em **Settings → API**
3. Verifique os limites do seu plano
4. Considere fazer upgrade se precisar de mais emails

## Limites Típicos do Supabase

- **Free Tier**: ~3-5 emails por hora por usuário
- **Pro Tier**: Limites mais altos (varia)
- **Enterprise**: Limites customizados

## Melhorias Aplicadas

✅ **Mensagem amigável**: Agora o erro mostra uma mensagem clara explicando o problema
✅ **Tratamento específico**: O sistema detecta rate limit e mostra mensagem apropriada
✅ **Aplicado em todas as páginas**: 
   - `/forgot-password` (reset de senha)
   - `/register` (cadastro)
   - `/api/auth/resend-confirmation` (reenvio de confirmação)

## Mensagem Exibida

Quando o rate limit é atingido, o usuário verá:

> "Muitas solicitações foram feitas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente. Isso ajuda a proteger nosso sistema contra abusos."

## Prevenção

Para evitar rate limit em produção:

1. **Implemente cooldown no frontend**: Desabilite o botão por alguns segundos após envio
2. **Use debounce**: Evite múltiplos cliques acidentais
3. **Monitore uso**: Acompanhe quantos emails estão sendo enviados
4. **Configure limites apropriados**: Ajuste limites no Supabase se necessário

## Verificar Status

Para verificar se ainda está em rate limit:

1. Aguarde 5-15 minutos
2. Tente novamente com um email diferente
3. Se persistir, verifique o dashboard do Supabase para ver se há bloqueios

## Suporte

Se o problema persistir após aguardar:

1. Verifique o dashboard do Supabase para logs de erro
2. Consulte a documentação do Supabase sobre rate limits
3. Entre em contato com o suporte do Supabase se necessário
