# VIOS Labs — E-commerce

Plataforma de e-commerce de suplementos premium. Estética "Pharmaceutical Luxury": minimalista, sofisticada e científica.

---

## Visão geral

- **Marca:** VIOS Labs — *A Ciência da Longevidade*
- **Checkout:** One-page (dados, endereço, frete, pagamento). PIX (5% desc.) e cartão (3x sem juros).
- **Fluxo:** Carrinho → Checkout (Pagar.me) → Webhook cria pedido, e-mail e venda no Bling (NF-e).

---

## Stack

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Framework     | Next.js 16 (App Router)             |
| UI            | React 19, TypeScript 5, Tailwind CSS 4 |
| Auth & DB     | Supabase (Auth + PostgreSQL)        |
| Pagamentos    | Pagar.me (PIX + cartão)             |
| E-mail        | Resend                              |
| ERP / NF-e    | Bling (API v3)                      |
| Frete         | Melhor Envio (cotação por CEP)      |
| Animações     | Framer Motion, Lenis                 |
| Validação     | Zod                                 |

**Gerenciador de pacotes:** PNPM.

---

## Pré-requisitos

- Node.js 20+
- PNPM (`npm install -g pnpm`)

---

## Instalação

```bash
git clone <repositório>
cd vios-labs-ecommerce
pnpm install
```

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com as variáveis necessárias. Principais grupos:

- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Pagar.me:** credenciais de API e webhook para checkout e PIX
- **Bling:** OAuth ou tokens para contatos, vendas e NF-e
- **Resend:** API key para envio de e-mails
- **Melhor Envio:** token para cotação de frete

Consulte a documentação de cada serviço e os arquivos `.md` do projeto (ex.: `BLING_INTEGRATION.md`, `CHECKOUT_BRASIL_SETUP.md`) para detalhes.

---

## Scripts

| Comando        | Descrição                    |
|----------------|------------------------------|
| `pnpm dev`     | Servidor de desenvolvimento  |
| `pnpm build`   | Build de produção            |
| `pnpm start`   | Servidor de produção         |
| `pnpm lint`    | ESLint                       |

Abra [http://localhost:3000](http://localhost:3000) após `pnpm dev`.

---

## Estrutura principal

```
src/
├── actions/          # Server Actions (ex.: checkout)
├── app/              # App Router (rotas, layouts, API)
│   ├── api/          # Webhooks e APIs (Pagar.me, Bling, frete, etc.)
│   ├── checkout/     # Página de checkout (one-page)
│   ├── produto/      # Página de produto
│   ├── kit/          # Página de kit
│   └── ...
├── components/       # UI, cart, checkout, shop
├── context/          # CartContext
├── lib/              # Bling, Pagar.me, e-mail, config
├── types/            # Tipos (checkout, database)
├── utils/            # Formatação, validação, Supabase
└── middleware.ts     # Session refresh e proteção de rotas
```

---

## Deploy

Build otimizado com Next.js (Turbopack). Adequado para Vercel ou qualquer host que suporte Node.js. Configure as variáveis de ambiente no painel do provedor e, se usar webhooks (Pagar.me, Bling), exponha a URL pública nas respectivas configurações.

---

## Documentação interna

- `BLING_INTEGRATION.md` — Integração Bling (contatos, vendas, NF-e)
- `CHECKOUT_BRASIL_SETUP.md` — Configuração Pagar.me e checkout
- `GUEST_CHECKOUT_FLOW.md` — Checkout para visitantes
- `INVENTORY_SYSTEM.md` — Reserva de estoque
- Outros `.md` na raiz para fluxos e troubleshooting específicos.
