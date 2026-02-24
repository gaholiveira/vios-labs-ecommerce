# PWA — VIOS Labs

O site VIOS Labs está configurado como **Progressive Web App (PWA)**.

## O que é PWA?

PWA é uma tecnologia que permite que o site se comporte como um app nativo:

1. **Instalável** — O usuário pode "Adicionar à tela inicial" no celular ou "Instalar app" no desktop (Chrome, Edge).
2. **Ícones e splash** — Ao instalar, o app usa ícones e cores da marca.
3. **Standalone** — Abre em janela própria, sem barra do navegador.
4. **Service Worker** (opcional) — Cache offline e carregamento mais rápido em visitas repetidas.

## O que foi implementado

| Recurso | Status |
|---------|--------|
| Web App Manifest | ✅ `/manifest.webmanifest` |
| Ícones (32, 192, 512px) | ✅ Gerados dinamicamente |
| Apple Touch Icon | ✅ 180x180 |
| Metadata PWA (layout) | ✅ `themeColor`, `appleWebApp` |
| Service Worker | ⚠️ Requer `pnpm build:pwa` |

## Service Worker (cache offline)

O Next.js 16 usa **Turbopack** por padrão no build. O plugin PWA (`@ducanh2912/next-pwa`) usa **webpack** para gerar o service worker.

- **Build padrão** (`pnpm build`): manifest + ícones funcionam; **sem** service worker.
- **Build PWA completo** (`pnpm build:pwa`): gera `sw.js` e `workbox-*.js` em `public/` para cache offline.

Para produção com cache offline, use `pnpm build:pwa` ou configure o deploy para usar `--webpack`.

## Como testar

1. Faça o build e inicie: `pnpm build && pnpm start`
2. Abra no Chrome (desktop ou mobile)
3. No menu (⋮) ou na barra de endereço, procure **"Instalar VIOS Labs"** ou **"Adicionar à tela inicial"**
4. Instale e abra — o app deve abrir em modo standalone

## Personalização

- **Ícones**: Edite `src/app/icon.tsx` e `src/app/apple-icon.tsx`
- **Cores**: Ajuste `theme_color` e `background_color` em `src/app/manifest.ts`
- **Nome**: Altere `name` e `short_name` no manifest
