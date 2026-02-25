# Auditoria de Acessibilidade — VIOS Labs

**Data:** 2025-02-24  
**Ferramentas:** axe-core (WCAG 2.1), análise manual, ESLint jsx-a11y

## Resumo

A auditoria identificou e corrigiu diversos pontos de acessibilidade. O projeto já possuía boa base (SkipLink, aria-labels em ícones, etc.).

## Correções Aplicadas

### 1. Navbar
- **aria-expanded** no botão hambúrguer agora reflete o estado real (`isMenuOpen`)
- **aria-label** dinâmico: "Abrir menu" / "Fechar menu" conforme estado

### 2. ProductCard
- **aria-label** no botão "Colocar na sacola": `Colocar {produto} na sacola` ou `{produto} esgotado`

### 3. Hero (Home)
- **aria-label** no CTA "Explorar Loja": "Explorar loja e ver produtos"
- **id="main-content"** no `<main>` para o SkipLink funcionar

### 4. SearchOverlay
- **aria-label** no input de busca: "Buscar produtos"
- **type="search"** para semântica correta

### 5. Essência
- **id="main-content"** no `<main>` para SkipLink

### 6. ESLint
- Ignorados `playwright-report/` e `test-results/` para evitar ruído no lint

## Estrutura de Testes

### Teste E2E (axe-core)
```bash
# Com servidor rodando em localhost:3000
pnpm test:a11y
```

Páginas auditadas: Home, Essência, Produto, Checkout (WCAG 2.1 A/AA).

### Lighthouse
```bash
pnpm lighthouse:a11y
```

Gera relatório HTML em `lighthouse-a11y-report.html` e abre no navegador.

## Boas Práticas Já Presentes

- SkipLink para pular navegação
- aria-label em botões de ícone (busca, sacola, menu, fechar)
- role="img" e aria-label em avaliações por estrelas
- alt em imagens de produto
- alt="" em imagens decorativas (hero Essência)
- role="menu" e role="menuitem" no DropdownMenu
- min-h-[44px] / min-w-[44px] em áreas de toque (mobile)

## Recomendações Futuras

1. **Contraste:** Revisar contraste de texto em fundos claros (ex.: `text-brand-softblack/65`)
2. **Foco visível:** Garantir outline/focus-ring visível em todos os elementos interativos
3. **Redução de movimento:** Respeitar `prefers-reduced-motion` em animações (já parcialmente implementado)
4. **Lighthouse:** Rodar `pnpm lighthouse:a11y` manualmente com Chrome para métricas completas
