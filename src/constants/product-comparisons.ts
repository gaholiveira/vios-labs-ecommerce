/**
 * Dados de comparativo VIOS vs produto comum de farmácia.
 * Linguagem factual, sem claims terapêuticos (conformidade ANVISA).
 */

export interface ComparisonRow {
  criterion: string;
  viosValue: string;
  pharmacyValue: string;
}

export interface ProductComparison {
  productId: string;
  pharmacyProductName: string;
  rows: ComparisonRow[];
}

export const PRODUCT_COMPARISONS: Record<string, ProductComparison> = {
  prod_1: {
    productId: "prod_1",
    pharmacyProductName: "Complexo vitamínico genérico",
    rows: [
      {
        criterion: "Complexo vitamínico",
        viosValue: "Completo (A, C, E, B1–B12, Biotina)",
        pharmacyValue: "Parcial ou incompleto",
      },
      {
        criterion: "Minerais essenciais",
        viosValue: "Cálcio, Cromo, Selênio, Zinco",
        pharmacyValue: "Geralmente ausentes ou em baixa dosagem",
      },
      {
        criterion: "Forma de entrega",
        viosValue: "Cápsulas com biodisponibilidade otimizada",
        pharmacyValue: "Comprimidos de liberação convencional",
      },
      {
        criterion: "Dose diária",
        viosValue: "2 cápsulas",
        pharmacyValue: "Múltiplos comprimidos por dia",
      },
    ],
  },
  prod_2: {
    productId: "prod_2",
    pharmacyProductName: "Melatonina convencional",
    rows: [
      {
        criterion: "Forma de entrega",
        viosValue: "Solução oral (absorção imediata)",
        pharmacyValue: "Comprimido (liberação gradual)",
      },
      {
        criterion: "Dosagem por gota",
        viosValue: "0,2 mg por gota (precisão ajustável)",
        pharmacyValue: "Dose fixa por comprimido (1–3 mg)",
      },
      {
        criterion: "Experiência sensorial",
        viosValue: "Sabor maracujá, zero açúcar",
        pharmacyValue: "Sem sabor ou com aditivos",
      },
      {
        criterion: "Ingestão",
        viosValue: "1 gota ao dia",
        pharmacyValue: "1 comprimido ou mais",
      },
    ],
  },
  prod_3: {
    productId: "prod_3",
    pharmacyProductName: "Magnésio convencional",
    rows: [
      {
        criterion: "Formas do mineral",
        viosValue: "Três formas (Bisglicinato, Dimalato, Óxido)",
        pharmacyValue: "Uma forma (geralmente óxido)",
      },
      {
        criterion: "Biodisponibilidade",
        viosValue: "Alta (quelato + formas complementares)",
        pharmacyValue: "Baixa a moderada",
      },
      {
        criterion: "Conforto digestivo",
        viosValue: "Otimizado (Bisglicinato quelatado)",
        pharmacyValue: "Pode causar desconforto",
      },
      {
        criterion: "Magnésio elementar por dose",
        viosValue: "250 mg (60% VD)",
        pharmacyValue: "Variável, muitas vezes subótimo",
      },
    ],
  },
  prod_4: {
    productId: "prod_4",
    pharmacyProductName: "Estimulante genérico",
    rows: [
      {
        criterion: "Matriz de ativos",
        viosValue: "Cafeína + Complexo B + L-Arginina + minerais",
        pharmacyValue: "Cafeína isolada ou B isolado",
      },
      {
        criterion: "Complexo B",
        viosValue: "Completo (B1, B2, B3, B5, B6, B9, B12)",
        pharmacyValue: "Parcial ou ausente",
      },
      {
        criterion: "Suporte mineral",
        viosValue: "Cálcio, Magnésio, Zinco quelato",
        pharmacyValue: "Geralmente ausente",
      },
      {
        criterion: "Dose diária",
        viosValue: "2 cápsulas (60 cápsulas = 30 dias)",
        pharmacyValue: "Múltiplas unidades por dia",
      },
    ],
  },
  prod_5: {
    productId: "prod_5",
    pharmacyProductName: "Suplemento articular genérico",
    rows: [
      {
        criterion: "Colágeno",
        viosValue: "Tipo II não desnaturado (20 mg)",
        pharmacyValue: "Tipo I hidrolisado ou ausente",
      },
      {
        criterion: "Complexo anti-inflamatório",
        viosValue: "Cúrcuma + MSM",
        pharmacyValue: "Geralmente ausente ou isolado",
      },
      {
        criterion: "Vitaminas ósseas",
        viosValue: "D3 (333% VD) + K2",
        pharmacyValue: "D3 em dose baixa ou ausente",
      },
      {
        criterion: "Pool mineral",
        viosValue: "Cálcio, Magnésio, Zinco Bisglicinato",
        pharmacyValue: "Variável ou incompleto",
      },
    ],
  },
};

export function getProductComparison(productId: string): ProductComparison | null {
  return PRODUCT_COMPARISONS[productId] ?? null;
}
