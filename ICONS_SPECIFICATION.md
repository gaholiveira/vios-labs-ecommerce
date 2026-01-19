# Especificação de Ícones e Favicons - VIOS LABS

## 📋 Arquivos Necessários

Você precisa criar e salvar os seguintes arquivos na pasta `public/`:

### 1. **icon.png** (Favicon Principal)
- **Tamanho:** 32x32 pixels OU 64x64 pixels
- **Formato:** PNG com transparência
- **Uso:** Favicon padrão para navegadores (tabs, bookmarks)
- **Arquivo:** `/public/icon.png`

### 2. **apple-icon.png** (Apple Touch Icon)
- **Tamanho:** 180x180 pixels (tamanho recomendado pela Apple)
- **Formato:** PNG
- **Uso:** Ícone quando o site é adicionado à tela inicial do iPhone/iPad
- **Arquivo:** `/public/apple-icon.png`
- **Nota:** Não precisa de transparência, o iOS adiciona bordas arredondadas automaticamente

### 3. **apple-touch-icon-precomposed.png** (Apple Touch Icon Precomposed)
- **Tamanho:** 180x180 pixels
- **Formato:** PNG
- **Uso:** Versão alternativa para compatibilidade com versões antigas do iOS
- **Arquivo:** `/public/apple-touch-icon-precomposed.png`
- **Nota:** Pode ser a mesma imagem do `apple-icon.png` se não tiver bordas arredondadas customizadas

### 4. **favicon.ico** (Opcional, mas recomendado)
- **Tamanho:** 16x16, 32x32, ou múltiplos tamanhos em um único arquivo .ico
- **Formato:** ICO
- **Uso:** Compatibilidade com navegadores antigos
- **Arquivo:** `/public/favicon.ico` OU `/src/app/favicon.ico`
- **Nota:** Já existe um favicon.ico em `/src/app/favicon.ico`. Você pode manter ou substituir.

---

## 🎨 Recomendações de Design

### Para o Favicon (icon.png):
- Use o logo simplificado da VIOS (letra "V" ou frasco minimalista)
- Fundo transparente ou sólido (verde brand `#0a3323` ou branco)
- Texto/ícone bem legível em tamanho pequeno (32x32)

### Para o Apple Icon (180x180):
- Use o logo completo ou versão mais elaborada
- Pode ter fundo sólido (verde brand ou branco)
- Evite bordas muito finas que podem desaparecer
- O iOS adiciona bordas arredondadas automaticamente, então não precisa incluir

---

## ✅ Resumo dos Arquivos

| Arquivo | Tamanho | Localização |
|---------|---------|-------------|
| `icon.png` | 32x32 ou 64x64 | `/public/icon.png` |
| `apple-icon.png` | 180x180 | `/public/apple-icon.png` |
| `apple-touch-icon-precomposed.png` | 180x180 | `/public/apple-touch-icon-precomposed.png` |
| `favicon.ico` (opcional) | 16x16 ou 32x32 | `/public/favicon.ico` ou `/src/app/favicon.ico` |

---

## 🔧 Configuração Aplicada

A configuração já foi adicionada no `src/app/layout.tsx` no metadata:

```typescript
icons: {
  icon: '/icon.png',
  shortcut: '/icon.png',
  apple: '/apple-icon.png',
  other: [
    {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png',
    },
  ],
},
```

---

## 📝 Próximos Passos

1. Crie os arquivos de imagem nos tamanhos especificados acima
2. Salve-os na pasta `public/` com os nomes exatos:
   - `icon.png`
   - `apple-icon.png`
   - `apple-touch-icon-precomposed.png`
3. Teste em diferentes dispositivos:
   - Desktop: Verifique o favicon na aba do navegador
   - iPhone/iPad: Adicione à tela inicial e verifique o ícone

---

## 🛠️ Ferramentas Recomendadas

- **Para criar favicons:** [Favicon.io](https://favicon.io/), [RealFaviconGenerator](https://realfavicongenerator.net/)
- **Para editar imagens:** Photoshop, Figma, Canva, ou qualquer editor de imagens
- **Para converter para .ico:** Use ferramentas online ou exporte diretamente do editor
