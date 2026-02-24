# Testes E2E — VIOS Labs

Testes automatizados com **Playwright**.

## Pré-requisitos

```bash
pnpm install
pnpm exec playwright install
```

## Executar testes

```bash
# Rodar todos os testes (app deve estar em http://localhost:3000)
pnpm test

# Com interface visual
pnpm test:ui

# Modo headed (ver o browser)
pnpm test:headed
```

## Antes de rodar

1. Inicie o servidor: `pnpm dev`
2. Em outro terminal: `pnpm test`

Ou use `PLAYWRIGHT_BASE_URL` se o app estiver em outra URL:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3001 pnpm test
```

## Estrutura

| Arquivo | Descrição |
|---------|-----------|
| `e2e/home.spec.ts` | Smoke tests da página inicial |
| `e2e/checkout.spec.ts` | Fluxo de checkout (adicionar ao carrinho, formulário, CEP) |

## CI

Em CI, o Playwright inicia o servidor automaticamente (`pnpm exec next start`) antes dos testes.
