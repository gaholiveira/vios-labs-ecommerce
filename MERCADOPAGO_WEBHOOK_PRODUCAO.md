# Mercado Pago — Webhook em Produção

## O que foi ajustado

1. **Verificação do pedido (`/api/orders/verify`)**  
   Passa a usar **service role** no Supabase. Assim o pedido é encontrado pelo `session_id` (ou `preference_id`) mesmo para **guest**: a página de sucesso não depende mais de sessão com o e-mail do comprador.

2. **Página de sucesso**
   - **Pedido encontrado:** mostra "Pedido Confirmado" e o botão "Ver Meus Pedidos" (para todos, não só logados).
   - **Pedido não encontrado** (após ~30 s de polling): mostra mensagem em destaque: "Pagamento aprovado. Estamos confirmando seu pedido. Você receberá o e-mail em breve..."
   - **Erro ao verificar:** mostra orientação para contatar o suporte.

3. **Webhook (`/api/webhooks/mercadopago`)**
   - Suporte a **GET** com `topic=payment` e `id=<payment_id>` (alguns fluxos do MP usam GET).
   - Fallback para obter `preference_id`: além de `payment.order` e busca por `external_reference`, tenta `payment.metadata.preference_id`.
   - **Metadata** da preferência aceita como objeto ou string JSON.
   - **Logs** em produção quando não conseguir `preference_id` ou quando metadata estiver incompleta (para debug no Vercel).
   - **E-mail obrigatório:** o checkout (formulário) passa a exigir e-mail para todos (guest e logado). A API rejeita com 400 se faltar. O webhook, se ainda assim não tiver e-mail no metadata/payer, usa um fallback (`FALLBACK_ORDER_EMAIL` ou `pedido-sem-email@vioslabs.com.br`) para não perder o pedido e registra um warning nos logs.

4. **DeprecationWarning `url.parse()`**  
   O aviso `[DEP0169] url.parse() is deprecated` vem de **dependência** (Node ou SDK do Mercado Pago), não do código do projeto. Pode ser ignorado até que a dependência use a WHATWG URL API. Não afeta o funcionamento do webhook.

---

## Checklist produção

- [ ] **URL do webhook**  
       A preferência é criada com `notification_url: ${origin}/api/webhooks/mercadopago`.  
       Em produção, `origin` deve ser a URL pública do site (ex.: `https://vioslabs.com.br`).  
       Confirme em `api/checkout/mercadopago/route.ts` que `NEXT_PUBLIC_SITE_URL` (ou a lógica de `origin`) está correta no deploy.

- [ ] **HTTPS**  
       O Mercado Pago só chama URLs **HTTPS** em produção. O domínio deve ter SSL válido.

- [ ] **Variáveis de ambiente (Vercel/produção)**
  - `MERCADOPAGO_ACCESS_TOKEN` (obrigatório)
  - `NEXT_PUBLIC_SITE_URL` = URL pública do site (ex.: `https://vioslabs.com.br`)
  - `RESEND_API_KEY` (para e-mail de confirmação)
  - `MERCADOPAGO_WEBHOOK_SECRET` (opcional; se usar, deve ser o mesmo configurado no painel do MP)

- [ ] **Supabase**
  - Script `fix_confirm_reservation_multiple.sql` aplicado (confirmar todas as reservas do mesmo `stripe_session_id`).
  - Constraint UNIQUE em `inventory_reservations.stripe_session_id` removida (`fix_inventory_reservations_constraint.sql`).

---

## Se o pedido ainda não for criado

1. **Logs no Vercel**  
   Em _Project → Logs_, filtre por `[MERCADOPAGO WEBHOOK]`.
   - "Could not resolve preference_id" → o pagamento não está ligado à preferência (ou `payment.order` / busca por `external_reference` falhou).
   - "Preference not found or no metadata" → `preference_id` ok, mas preferência sem metadata (improvável se o checkout estiver enviando os dados).
   - "Missing customer_email" → metadata da preferência sem `customer_email`.
   - "Error creating order" / "Error creating order_items" → erro de banco (Supabase).

2. **Painel do Mercado Pago**  
   Em _Suas integrações → Webhooks_, confira se há URL de produção e se o evento **Payments** está ativo.  
   A URL definida **na preferência** tem prioridade; mesmo assim, vale garantir que a URL de produção no painel está correta.

3. **Testar o webhook manualmente (GET)**  
   Se você tiver um `payment_id` aprovado (ex.: do painel do MP):  
   `GET https://seu-dominio.com/api/webhooks/mercadopago?topic=payment&id=PAYMENT_ID`  
   Isso deve disparar o processamento do pagamento e criar o pedido (e enviar o e-mail) se os dados estiverem corretos.

Com isso, a confirmação visual na volta do PIX e o e-mail do Resend passam a funcionar quando o webhook for chamado e conseguir resolver `preference_id` e metadata.
