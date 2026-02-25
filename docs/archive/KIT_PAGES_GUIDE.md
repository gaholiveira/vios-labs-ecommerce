# 📦 Guia de Páginas de Kits - VIOS LABS

**Data:** 26 de Janeiro de 2026  
**Status:** ✅ **IMPLEMENTADO**

---

## 📋 Resumo

Páginas individuais para cada kit foram criadas, seguindo a mesma estrutura das páginas de produtos. Cada kit agora tem sua própria URL (`/kit/[id]`) com conteúdo detalhado e estruturado.

---

## 🎯 Estrutura Implementada

### Rotas Criadas

- ✅ `/kit/[id]/page.tsx` - Página dinâmica do kit
- ✅ `/kit/[id]/loading.tsx` - Loading state
- ✅ `/kit/[id]/not-found.tsx` - Página 404 para kit não encontrado

### Componentes Criados

- ✅ `KitPageContent.tsx` - Componente principal da página do kit
- ✅ `KitCard.tsx` - Atualizado para linkar para página do kit

### Atualizações

- ✅ Tipo `Kit` expandido com campos de conteúdo
- ✅ `sitemap.ts` atualizado para incluir kits
- ✅ SEO e metadata configurados

---

## 📝 Como Estruturar o Conteúdo dos Kits

### 1. Campos Básicos (Já Existem)

```typescript
{
  id: 'kit_1',
  name: 'Sinergia Absoluta',
  price: 797.00,
  oldPrice: 951.00,
  products: ['prod_1', 'prod_2', 'prod_3', 'prod_4', 'prod_5'],
  description: 'Frase curta de apoio', // Usado no card
  badge: 'kit' | 'protocolo',
  image: '/images/kits/sinergia.png', // Opcional
}
```

### 2. Campos de Conteúdo Detalhado (Novos)

#### 2.1 `longDescription` (Opcional)

Descrição longa e detalhada do kit, usada na página do kit.

```typescript
longDescription: "Descrição completa e detalhada do kit, explicando sua proposta, benefícios e diferenciais. Pode ter múltiplos parágrafos.";
```

#### 2.2 `benefits` (Opcional)

Array de benefícios principais do kit.

```typescript
benefits: ["Benefício 1", "Benefício 2", "Benefício 3"];
```

#### 2.3 `howToUse` (Opcional)

Instruções de uso do kit.

```typescript
howToUse: "Instruções detalhadas de como usar o kit, incluindo dosagem, horários e recomendações.";
```

#### 2.4 `content` (Opcional - Estrutura Completa)

Conteúdo estruturado para a página do kit.

```typescript
content: {
  // Hero Section
  hero: {
    title: "Título Principal (opcional, usa name se não fornecido)",
    subtitle: "Subtítulo do kit",
    description: "Descrição hero (usa longDescription se não fornecido)"
  },

  // Seção "Sobre"
  about: {
    title: "Sobre o Kit", // Opcional
    paragraphs: [
      "Primeiro parágrafo sobre o kit...",
      "Segundo parágrafo explicando mais detalhes...",
      "Terceiro parágrafo com informações adicionais..."
    ]
  },

  // Seção "Produtos"
  products: {
    title: "Produtos Incluídos", // Opcional
    description: "Descrição sobre a combinação de produtos e sinergia"
  },

  // Seção "Benefícios"
  benefits: {
    title: "Benefícios", // Opcional
    items: [
      {
        title: "Benefício 1",
        description: "Descrição detalhada do benefício 1"
      },
      {
        title: "Benefício 2",
        description: "Descrição detalhada do benefício 2"
      }
    ]
  },

  // Seção "Como Usar"
  usage: {
    title: "Como Usar", // Opcional
    instructions: [
      "Instrução 1: Como usar o primeiro produto",
      "Instrução 2: Como usar o segundo produto",
      "Instrução 3: Recomendações gerais"
    ]
  },

  // Seção "FAQ"
  faq: [
    {
      question: "Pergunta frequente 1?",
      answer: "Resposta detalhada para a pergunta 1."
    },
    {
      question: "Pergunta frequente 2?",
      answer: "Resposta detalhada para a pergunta 2."
    }
  ]
}
```

---

## 📄 Exemplo Completo

```typescript
{
  id: 'kit_1',
  name: 'Sinergia Absoluta',
  price: 797.00,
  oldPrice: 951.00,
  products: ['prod_1', 'prod_2', 'prod_3', 'prod_4', 'prod_5'],
  description: 'A totalidade da biotecnologia VIOS em um único protocolo.',
  badge: 'kit',
  image: '/images/kits/sinergia.png',

  // Campos novos
  longDescription: "O Sinergia Absoluta representa o ápice da biotecnologia VIOS, unindo os cinco produtos essenciais em um protocolo completo de longevidade e performance. Esta combinação estratégica foi desenvolvida para maximizar os resultados através da sinergia entre os componentes.",

  benefits: [
    "Suporte completo para estética, cognição e performance",
    "Otimização sistêmica através de múltiplos mecanismos",
    "Economia significativa comparado à compra individual"
  ],

  howToUse: "Siga as instruções individuais de cada produto incluído no kit. Recomendamos manter uma rotina consistente para melhores resultados.",

  content: {
    hero: {
      subtitle: "O Protocolo Completo de Longevidade",
      description: "Cinco produtos essenciais unidos em uma única experiência de transformação biológica."
    },

    about: {
      title: "Sobre o Sinergia Absoluta",
      paragraphs: [
        "O Sinergia Absoluta representa a totalidade da biotecnologia VIOS em um único protocolo. Esta combinação estratégica foi desenvolvida para maximizar os resultados através da sinergia entre os componentes.",
        "Cada produto foi cuidadosamente selecionado para complementar os demais, criando um efeito sinérgico que potencializa os benefícios individuais.",
        "Este kit é ideal para quem busca uma abordagem completa de otimização biológica, cobrindo desde a estética até a performance física e cognitiva."
      ]
    },

    products: {
      title: "Produtos Incluídos",
      description: "Cinco produtos essenciais que trabalham em sinergia para resultados completos."
    },

    benefits: {
      title: "Benefícios Principais",
      items: [
        {
          title: "Otimização Estética",
          description: "VIOS Glow e Sleep trabalham juntos para melhorar a qualidade da pele através do sono reparador e nutrientes essenciais."
        },
        {
          title: "Performance Cognitiva",
          description: "VIOS Pulse e MAG3 fornecem suporte completo para energia mental e equilíbrio neuromuscular."
        },
        {
          title: "Mobilidade e Longevidade",
          description: "VIOS Move garante suporte articular e ósseo para manter a atividade física ao longo do tempo."
        }
      ]
    },

    usage: {
      title: "Como Usar o Kit",
      instructions: [
        "VIOS Glow: 2 cápsulas por dia, preferencialmente com uma refeição",
        "VIOS Sleep: 1 gota 30 minutos antes de dormir",
        "VIOS MAG3: 2 cápsulas por dia, com água",
        "VIOS Pulse: 2 cápsulas antes de atividades físicas ou mentais",
        "VIOS Move: 2 cápsulas por dia, preferencialmente com uma refeição"
      ]
    },

    faq: [
      {
        question: "Posso usar todos os produtos ao mesmo tempo?",
        answer: "Sim, todos os produtos foram desenvolvidos para serem usados em conjunto, criando uma sinergia que potencializa os resultados."
      },
      {
        question: "Quanto tempo leva para ver resultados?",
        answer: "Os resultados variam de pessoa para pessoa, mas geralmente começam a ser notados após 2-4 semanas de uso consistente."
      },
      {
        question: "O kit tem desconto comparado à compra individual?",
        answer: "Sim, o Sinergia Absoluta oferece uma economia significativa comparado à compra individual dos produtos."
      }
    ]
  }
}
```

---

## 🎨 Estrutura da Página

A página do kit segue esta estrutura:

1. **Hero Section**
   - Imagem do kit (ou template)
   - Badge (Kit/Protocolo)
   - Título (hero.title ou name)
   - Subtítulo (hero.subtitle)
   - Preço (com economia se houver)
   - Descrição (hero.description ou longDescription)

2. **Produtos Incluídos**
   - Grid com cards dos produtos
   - Links para páginas individuais de cada produto
   - Imagens e descrições curtas

3. **Accordion com Informações**
   - Sobre o Kit
   - Produtos Incluídos
   - Benefícios
   - Como Usar
   - FAQ (se fornecido)

4. **Sticky Bar** (Mobile)
   - Aparece quando o botão principal sai da tela
   - Nome do kit e botão de ação

---

## 🔗 URLs e SEO

### URLs Geradas

- `/kit/kit_1` - Sinergia Absoluta
- `/kit/kit_2` - Protocolo Essencial Vios
- `/kit/kit_3` - Eixo Cognitivo
- `/kit/kit_4` - Dinâmica Sistêmica
- `/kit/kit_5` - Ritmo Circadiano
- `/kit/kit_6` - Bio-Regeneração

### SEO

- ✅ Metadata completo (title, description, OpenGraph)
- ✅ Imagens otimizadas
- ✅ URLs canônicas
- ✅ Incluído no sitemap.xml

---

## 📝 Como Adicionar Conteúdo

### Opção 1: Campos Simples

Para kits simples, use apenas os campos básicos:

```typescript
{
  id: 'kit_1',
  name: 'Sinergia Absoluta',
  // ... campos básicos
  longDescription: "Descrição longa aqui",
  benefits: ["Benefício 1", "Benefício 2"],
  howToUse: "Instruções de uso"
}
```

### Opção 2: Conteúdo Estruturado

Para kits com conteúdo rico, use o objeto `content`:

```typescript
{
  id: 'kit_1',
  name: 'Sinergia Absoluta',
  // ... campos básicos
  content: {
    hero: { ... },
    about: { ... },
    benefits: { ... },
    usage: { ... },
    faq: [ ... ]
  }
}
```

---

## ✅ Checklist de Implementação

- [x] Tipo `Kit` expandido com campos de conteúdo
- [x] Rota `/kit/[id]/page.tsx` criada
- [x] Componente `KitPageContent` criado
- [x] Loading state implementado
- [x] Página 404 criada
- [x] `KitCard` atualizado para linkar
- [x] Sitemap atualizado
- [x] SEO configurado
- [ ] Conteúdo dos kits preenchido (próximo passo)

---

## 🚀 Próximos Passos

1. **Preencher Conteúdo dos Kits**
   - Adicionar `longDescription` para cada kit
   - Adicionar `benefits` (array)
   - Adicionar `howToUse`
   - Criar objeto `content` completo (opcional)

2. **Adicionar Imagens**
   - Garantir que cada kit tenha imagem em `/public/images/kits/`
   - Ou usar template automático

3. **Testar Páginas**
   - Verificar layout em diferentes tamanhos de tela
   - Testar links para produtos
   - Verificar SEO e metadata

---

## 📚 Arquivos Modificados/Criados

### Criados

- `src/app/kit/[id]/page.tsx`
- `src/app/kit/[id]/loading.tsx`
- `src/app/kit/[id]/not-found.tsx`
- `src/components/KitPageContent.tsx`
- `KIT_PAGES_GUIDE.md`

### Modificados

- `src/constants/kits.ts` - Tipo `Kit` expandido
- `src/components/KitCard.tsx` - Link para página do kit
- `src/app/sitemap.ts` - Incluído kits

---

**Status:** ✅ **IMPLEMENTAÇÃO COMPLETA**

**Próximo Passo:** Preencher conteúdo dos kits em `src/constants/kits.ts`
