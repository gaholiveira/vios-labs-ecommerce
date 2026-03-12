# VIOS Labs — E-commerce

> **A Ciência da Longevidade** — Plataforma de e-commerce de suplementos premium com estética "Pharmaceutical Luxury": minimalista, sofisticada e científica.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com/)

---

## Índice

- [Visão geral](#visão-geral)
- [Stack](#stack)
- [Funcionalidades](#funcionalidades)
- [Arquitetura de performance](#arquitetura-de-performance)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Testes](#testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Integrações](#integrações)
- [Deploy](#deploy)
- [Documentação](#documentação)

---

## Visão geral

VIOS Labs é um e-commerce de suplementos high-end construído com foco em **performance**, **segurança** e **experiência de compra fluida**. O checkout é one-page (dados, endereço, frete e pagamento em uma única tela), com suporte a **PIX** (5% de vantagem) e **cartão de crédito** (3x sem juros).

**Fluxo principal:**

```
Produto → Carrinho → Checkout (Pagar.me) → Webhook order.paid
  → Pedido no Supabase
  → E-mail de confirmação (Resend)
  → Venda + NF-e no Bling
  → Sequência de e-mails pós-compra (D+3, D+7)
```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript 5, Tailwind CSS 4 |
| Auth & DB | Supabase (Auth + PostgreSQL + Storage) |
| Pagamentos | Pagar.me (PIX + cartão tokenizado) |
| E-mail | Resend (confirmação + sequências pós-compra) |
| ERP / NF-e | Bling API v3 |
| Frete | Melhor Envio (cotação por CEP) |
| Animações | Framer Motion, Lenis (scroll suave desktop) |
| Validação | Zod |
| Testes E2E | Playwright |
| PWA | @ducanh2912/next-pwa |
| Analytics | Google Analytics 4, Meta Pixel (Advanced Matching) |

**Gerenciador de pacotes:** PNPM (obrigatório).

---

## Funcionalidades

### Loja
- Catálogo de produtos e kits com páginas estáticas pré-geradas (`generateStaticParams`)
- Cards com prova social: unidades vendidas, rating e estoque em tempo real
- Badges de urgência (últimas unidades, poucos disponíveis)
- Carrinho com persistência em `localStorage` e drawer lateral animado

### Checkout
- **One-page checkout:** dados, endereço (ViaCEP), cotação de frete (Melhor Envio) e pagamento em uma tela
- PIX com 5% de desconto; cartão em até 3x sem juros
- CPF coletado na etapa de pagamento com contexto claro de emissão de nota fiscal
- Reserva de estoque temporária durante o processo de compra

### Reviews e prova social
- Sistema de avaliações com moderação (status: pending → approved)
- **Upload de foto opcional** nos reviews: armazenadas no Supabase Storage (`review-images`), com validação de tipo (JPG/PNG/WEBP) e tamanho (máx. 3 MB)
- Modal de foto full-screen com animação ao clicar no thumbnail
- Seção "A experiência de quem usa" na home com carousel mobile e grid desktop

### E-mails pós-compra
- **D+3:** check-in de experiência com link direto para avaliação do produto
- **D+7:** nudge de recompra com CTA para o produto adquirido
- Templates com identidade visual VIOS (dourado, tipografia minimalista)
- Processados por Vercel Cron (`/api/cron/email-sequence`, horário)

### Analytics e remarketing
- **Google Analytics 4:** eventos ViewItem, AddToCart, BeginCheckout, AddPaymentInfo, Purchase
- **Meta Pixel:** eventos com Advanced Matching (e-mail hasheado em SHA-256 via Web Crypto API)

### Autenticação e conta
- Supabase Auth (e-mail/senha + OAuth)
- Histórico de pedidos
- Confirmação de e-mail com reenvio

### Infraestrutura
- **Webhook Pagar.me** com validação HMAC-SHA256 (`x-pagarme-signature`)
- **Rate limiting** in-memory (sliding window) em todas as rotas públicas
- **Cron jobs** Vercel: limpeza de reservas expiradas (15 min) e envio de e-mails (1 hora)
- **Bling:** contato → venda → NF-e, com fallback inteligente para CPF já cadastrado
- **Error Boundaries** em raiz, checkout e global
- **PWA:** manifest, ícones, service worker (build separado)

---

## Arquitetura de performance

A home page utiliza arquitetura híbrida Server/Client para máximo desempenho de LCP:

```
page.tsx (Server Component)
├── HomeHero (Client)          ← hero + auth handler + viewport hook
├── StatusStories (Client)
├── section#produtos
│   ├── TextReveal (Client)
│   ├── CheckoutBenefitsBar (Server)
│   └── HomeProductsGrid (Client) ← fetch reviews + inventory ao entrar na view
└── HomeBelowFold (Client)
    ├── ProductTestimonialsSection (dynamic, ssr:false)
    ├── EssenceSection (dynamic, ssr:false)
    └── AboutSection (dynamic, ssr:false)
```

- Apenas **2 imagens above-the-fold** com `priority` (preload)
- Scripts de terceiros (GA4, Meta Pixel) com `strategy="lazyOnload"`
- Lenis (scroll suave) carregado apenas em dispositivos não-touch (~25 KB economizados)
- Fonte Inter com `display: optional` — sem font blocking
- `console.log` removido em produção; `console.warn` preservado para diagnósticos críticos

---

## Pré-requisitos

- **Node.js** 20+
- **PNPM** — `npm install -g pnpm`

---

## Instalação

```bash
git clone <repositório>
cd vios-labs-ecommerce
pnpm install
cp .env.example .env   # Configure as variáveis
pnpm dev
```

---

## Variáveis de ambiente

| Grupo | Variáveis principais |
|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Pagar.me | `PAGARME_API_KEY`, `PAGARME_WEBHOOK_SECRET` |
| Bling | `BLING_CLIENT_ID`, `BLING_CLIENT_SECRET` (ou `BLING_ACCESS_TOKEN` / `BLING_REFRESH_TOKEN`) |
| Resend | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| Melhor Envio | `MELHOR_ENVIO_TOKEN` |
| Analytics | `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_FB_PIXEL_ID` |
| Site | `NEXT_PUBLIC_SITE_URL` (ex.: `https://vioslabs.com.br`) |
| Segurança | `ADMIN_SECRET_TOKEN`, `CRON_SECRET`, `ENABLE_TEST_COUPON` |

Consulte os arquivos de documentação na raiz para detalhes de cada integração.

---

## Scripts

| Comando | Descrição |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento (Turbopack) |
| `pnpm build` | Build de produção |
| `pnpm build:pwa` | Build com webpack (gera service worker para cache offline) |
| `pnpm start` | Servidor de produção |
| `pnpm lint` | ESLint |
| `pnpm test` | Testes E2E (Playwright) |
| `pnpm test:ui` | Playwright com interface visual |
| `pnpm test:headed` | Playwright com browser visível |

---

## Testes

Testes E2E com Playwright cobrem a home e o fluxo de checkout.

```bash
pnpm exec playwright install   # Instalar browsers (uma vez)
pnpm dev                       # Terminal 1
pnpm test                      # Terminal 2
```

Ver `TESTES.md` para detalhes.

---

## Estrutura do projeto

```
src/
├── actions/                # Server Actions (checkout, review, reset-password)
├── app/
│   ├── api/
│   │   ├── checkout/pagarme/   # Criação de pedido (PIX + cartão)
│   │   ├── webhooks/pagarme/   # Webhook order.paid (HMAC validado)
│   │   ├── reviews/            # GET reviews, POST upload de foto, summary, featured
│   │   ├── inventory/          # Reserve e status de estoque
│   │   ├── cron/               # cleanup-reservations, email-sequence
│   │   ├── bling/              # sync-products, oauth-callback
│   │   └── shipping/           # Cotação Melhor Envio
│   ├── checkout/               # One-page checkout (layout sem chrome)
│   ├── produto/[id]/           # Página de produto (SSG)
│   ├── kit/[id]/               # Página de kit (SSG)
│   ├── orders/                 # Histórico de pedidos
│   └── (legal)/                # Privacidade, termos, trocas
├── components/
│   ├── ui/                     # Skeleton, ErrorBoundary, CustomCursor, TextReveal
│   ├── cart/                   # CartDrawer, ShippingMeter
│   ├── checkout/               # CheckoutForm, DadosSection, CheckoutPaymentStep
│   ├── shop/                   # ProductReviews, ReviewForm (com upload de foto)
│   ├── HomeHero.tsx            # Hero section (Client Component isolado)
│   ├── HomeProductsGrid.tsx    # Grid de produtos com reviews/inventory fetch
│   └── HomeBelowFold.tsx       # Seções abaixo do fold (dynamic ssr:false)
├── context/                    # CartContext → useCartStore + useUIStore
├── hooks/                      # useAuth, useMobileViewportHeight, useAuthUrlHandler,
│                               #   useCheckoutFormState
├── lib/                        # bling, pagarme, email, meta-pixel, analytics,
│                               #   checkout-config
├── types/                      # checkout, database
├── utils/
│   ├── supabase/               # client, server, admin (centralizado)
│   ├── rate-limit.ts           # Sliding window rate limiter
│   ├── errorMessage.ts         # getErrorMessage(err: unknown)
│   └── ...                     # cep, validation, format, auth
└── middleware.ts               # Session refresh, proteção de rotas

supabase/migrations/            # Migrations SQL versionadas
e2e/                            # Testes Playwright
vercel.json                     # Cron jobs (cleanup, email-sequence)
```

---

## Integrações

### Supabase Storage — `review-images`
Bucket público para fotos de reviews. Upload exclusivo via API (service role). Criar manualmente no Dashboard com as policies:

| Operação | Role | Policy |
|---|---|---|
| SELECT | anon, authenticated | `true` |
| INSERT | anon, authenticated | `false` |

### Pagar.me Webhook
- Endpoint: `POST /api/webhooks/pagarme`
- Validação: HMAC-SHA256 com `PAGARME_WEBHOOK_SECRET`
- Evento `order.paid`: cria pedido, envia e-mail, cria venda no Bling, agenda sequências de e-mail

### Bling API v3
- Contato obrigatório antes da venda (busca ou cria por CPF)
- Mapeamento de produtos via `BLING_PRODUCT_ID_PROD_*` ou `BLING_PRODUCT_MAP`
- Token renovado automaticamente via pg_cron no Supabase

### Vercel Cron Jobs
| Route | Schedule | Função |
|---|---|---|
| `/api/cron/cleanup-reservations` | `*/15 * * * *` | Remove reservas de estoque expiradas |
| `/api/cron/email-sequence` | `0 * * * *` | Envia e-mails D+3 e D+7 pendentes |

---

## Deploy

Otimizado para **Vercel** (recomendado) com Turbopack no build padrão.

1. Configure todas as variáveis de ambiente no painel da Vercel.
2. Configure a URL pública para webhooks no painel do Pagar.me e Bling.
3. Crie o bucket `review-images` no Supabase com as policies acima.
4. Execute as migrations SQL (`supabase/migrations/`) no banco de produção.
5. Para PWA com cache offline, use `pnpm build:pwa` no script de build.

---

## Documentação

| Arquivo | Descrição |
|---|---|
| `BLING_INTEGRATION.md` | Integração Bling (contatos, vendas, NF-e) |
| `CHECKOUT_BRASIL_SETUP.md` | Configuração Pagar.me e checkout |
| `GUEST_CHECKOUT_FLOW.md` | Checkout para visitantes |
| `INVENTORY_SYSTEM.md` | Reserva de estoque |
| `PWA.md` | PWA, manifest, service worker |
| `TESTES.md` | Testes E2E com Playwright |

---

## Licença

Projeto privado — VIOS Labs © 2026. Todos os direitos reservados.
