# VIOS Labs — E-commerce

> **A Ciência da Longevidade** — Plataforma de e-commerce de suplementos premium com estética "Pharmaceutical Luxury": minimalista, sofisticada e científica.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## Índice

- [Visão geral](#visão-geral)
- [Stack](#stack)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Testes](#testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Deploy](#deploy)
- [Documentação](#documentação)

---

## Visão geral

VIOS Labs é um e-commerce de suplementos high-end desenvolvido com foco em performance, segurança e experiência de compra fluida. O checkout é one-page (dados, endereço, frete e pagamento em uma única tela), com suporte a **PIX** (10% de desconto) e **cartão de crédito** (até 3x sem juros).

**Fluxo principal:** Carrinho → Checkout (Pagar.me) → Webhook cria pedido no Supabase, envia e-mail de confirmação e registra venda no Bling (NF-e).

---

## Stack

| Camada       | Tecnologia                          |
|--------------|-------------------------------------|
| Framework    | Next.js 16 (App Router)              |
| UI           | React 19, TypeScript 5, Tailwind CSS 4 |
| Auth & DB    | Supabase (Auth + PostgreSQL)        |
| Pagamentos   | Pagar.me (PIX + cartão tokenizado)  |
| E-mail       | Resend                              |
| ERP / NF-e   | Bling (API v3)                      |
| Frete        | Melhor Envio (cotação por CEP)      |
| Animações    | Framer Motion, Lenis               |
| Validação    | Zod                                 |
| Testes E2E   | Playwright                          |
| PWA          | @ducanh2912/next-pwa                |

**Gerenciador de pacotes:** PNPM (obrigatório).

---

## Funcionalidades

- **Catálogo** — Produtos, kits e páginas dedicadas
- **Carrinho** — Persistência em localStorage, drawer lateral
- **Checkout one-page** — Dados, endereço (ViaCEP), frete (Melhor Envio), PIX e cartão
- **Autenticação** — Supabase Auth (e-mail/senha, OAuth)
- **Pedidos** — Histórico, confirmação por e-mail
- **Integração Bling** — Vendas, NF-e, sincronização de produtos
- **PWA** — Instalável, manifest, ícones (service worker com `build:pwa`)
- **Error Boundaries** — Fallbacks em erro (raiz, checkout, global)
- **Acessibilidade** — Skip link, aria-labels, contraste
- **SEO** — Metadata, OpenGraph, sitemap

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
```

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz. Principais grupos:

| Grupo      | Variáveis principais |
|------------|----------------------|
| Supabase   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Pagar.me   | Credenciais de API e URL do webhook |
| Bling      | OAuth ou `BLING_ACCESS_TOKEN` / `BLING_REFRESH_TOKEN` |
| Resend     | `RESEND_API_KEY` |
| Melhor Envio | Token para cotação de frete |
| Site       | `NEXT_PUBLIC_SITE_URL` (ex.: `https://vioslabs.com.br`) |

Consulte os arquivos de documentação na raiz para detalhes de cada integração.

---

## Scripts

| Comando         | Descrição |
|-----------------|-----------|
| `pnpm dev`      | Servidor de desenvolvimento |
| `pnpm build`    | Build de produção (Turbopack) |
| `pnpm build:pwa`| Build com webpack (gera service worker para cache offline) |
| `pnpm start`    | Servidor de produção |
| `pnpm lint`     | ESLint |
| `pnpm test`     | Testes E2E (Playwright) |
| `pnpm test:ui`  | Playwright com interface visual |
| `pnpm test:headed` | Playwright com browser visível |

**Desenvolvimento:** `pnpm dev` e acesse [http://localhost:3000](http://localhost:3000).

---

## Testes

Testes E2E com Playwright cobrem a home e o fluxo de checkout.

```bash
pnpm exec playwright install   # Instalar browsers (uma vez)
pnpm dev                       # Em um terminal
pnpm test                      # Em outro terminal
```

Ver `TESTES.md` para detalhes.

---

## Estrutura do projeto

```
src/
├── actions/           # Server Actions
├── app/               # App Router
│   ├── api/           # Webhooks (Pagar.me), checkout, Bling, frete, inventory...
│   ├── auth/callback/ # OAuth Supabase
│   ├── checkout/      # One-page checkout (layout sem chrome)
│   ├── produto/[id]/  # Página de produto
│   ├── kit/[id]/      # Página de kit
│   ├── error.tsx      # Error Boundary raiz
│   ├── global-error.tsx
│   ├── manifest.ts    # PWA manifest
│   ├── icon.tsx       # Ícones PWA
│   └── ...
├── components/
│   ├── ui/            # Skeleton, ErrorBoundary, CustomCursor...
│   ├── cart/          # CartDrawer, ShippingMeter
│   ├── checkout/      # CheckoutForm, CheckoutPaymentStep...
│   └── ...
├── context/           # CartContext (localStorage)
├── lib/               # Bling, Pagar.me, e-mail, checkout-config
├── types/             # checkout, database
├── utils/             # auth, cep, validation, Supabase
└── middleware.ts      # Session refresh, proteção de rotas

e2e/                   # Testes Playwright
├── home.spec.ts
└── checkout.spec.ts
```

---

## Deploy

Build otimizado com Next.js. Adequado para **Vercel**, Railway ou qualquer host Node.js.

1. Configure as variáveis de ambiente no painel do provedor.
2. Exponha a URL pública para webhooks (Pagar.me, Bling).
3. Para PWA com cache offline, use `pnpm build:pwa` em vez de `pnpm build` (ou configure o script de build no provedor).

---

## Documentação

| Arquivo | Descrição |
|---------|-----------|
| `BLING_INTEGRATION.md` | Integração Bling (contatos, vendas, NF-e) |
| `CHECKOUT_BRASIL_SETUP.md` | Configuração Pagar.me e checkout |
| `GUEST_CHECKOUT_FLOW.md` | Checkout para visitantes |
| `INVENTORY_SYSTEM.md` | Reserva de estoque |
| `PWA.md` | PWA, manifest, service worker |
| `TESTES.md` | Testes E2E com Playwright |

---

## Licença

Projeto privado — VIOS Labs.
