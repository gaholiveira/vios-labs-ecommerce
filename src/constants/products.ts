export interface Product {
  id: string;
  name: string;
  /** Tagline para título da página (ex.: "Tripla Infusão de Magnésio") */
  tagline?: string;
  price: number;
  image: string;
  /** Imagens adicionais (conceituais) para galeria na página do produto */
  additionalImages?: string[];
  description: string;
  /** Frase curta para o card (conversão); ex.: benefício ou diferencial em uma linha */
  shortDescription?: string;
  category: string;
  badge?: 'bestseller' | 'novo' | 'vegano';
  oldPrice?: number;
  rating?: number;
  reviews?: number;
  anvisaRecord?: string;
  // Informações de estoque (opcionais, carregadas sob demanda)
  stockQuantity?: number;
  /** Quantidade disponível (carregada da API de estoque, para badges de urgência) */
  availableQuantity?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  /** Produto esgotado (ex.: Glow) — botão desabilitado com label "Esgotado" */
  soldOut?: boolean;
  /** Unidades vendidas — prova social; inicialmente valores recomendados para conversão */
  unitsSold?: number;
}

export const PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Vios Glow',
    tagline: 'Hair, Skin & Nails',
    price: 219.00,
    image: '/images/products/glownew.jpeg',
    additionalImages: [
      '/images/products/glowcaps.jpeg',
      '/images/products/glowdown.jpeg',
    ],
    description: 'Nutrição estratégica para pele, cabelos e vitalidade. Vitaminas e minerais selecionados para oferecer suporte nutricional à saúde da pele e contribuir para o equilíbrio antioxidante do organismo.',
    shortDescription: 'Vitaminas e minerais selecionados para suporte nutricional da pele, cabelos e unhas.',
    category: 'Suplemento',
    unitsSold: 127,
  },
  {
    id: 'prod_2',
    name: 'Vios Sleep',
    tagline: 'Melatonina para Sono Reparador',
    price: 179.00,
    image: '/images/products/sleepnew.jpeg',
    description: 'Suporte nutricional avançado para um sono profundo e restaurador. Melatonina em solução líquida de alta absorção desenvolvida para auxiliar na regulação do ciclo circadiano e favorecer o início do sono, contribuindo para uma rotina noturna equilibrada.',
    shortDescription: 'Melatonina líquida para suporte ao ciclo natural do sono e ao descanso noturno.',
    category: 'Suplemento',
    anvisaRecord: '25351.088701/2025-70',
    unitsSold: 89,
  },
  {
    id: 'prod_3',
    name: 'Vios Mag3',
    tagline: 'Tripla Infusão de Magnésio',
    price: 167.00,
    image: '/images/products/mag3new.jpeg',
    additionalImages: [
      '/images/products/mag3caps.jpeg',
      '/images/products/mag3down.jpeg',
    ],
    description: 'Magnésio avançado para suporte metabólico e equilíbrio neuromuscular. Uma formulação cuidadosamente desenvolvida para auxiliar no funcionamento muscular, no suporte ao sistema nervoso e no equilíbrio do organismo em rotinas de alta demanda.',
    shortDescription: 'Magnésio em três formas para suporte energético, muscular e neurometabólico.',
    category: 'Suplemento',
    anvisaRecord: '25351.066423/2025-08',
    unitsSold: 64,
  },
  {
    id: 'prod_4',
    name: 'Vios Pulse',
    tagline: 'Foco e Energia para Performance',
    price: 197.00,
    image: '/images/products/pulsenew.jpeg',
    additionalImages: [
      '/images/products/pulsecaps.jpeg',
      '/images/products/pulsedown.jpeg',
    ],
    description: 'Suporte nutricional para energia, foco e desempenho. Uma formulação pensada para auxiliar na disposição física e mental, contribuindo para maior clareza, vitalidade e desempenho em momentos de alta exigência.',
    shortDescription: 'Fórmula com cafeína e complexo B para suporte à energia, foco e desempenho mental.',
    category: 'Suplemento',
    unitsSold: 48,
  },
  {
    id: 'prod_5',
    name: 'Vios Move',
    tagline: 'Mobilidade e Articulações',
    price: 189.00,
    image: '/images/products/movenew.jpeg',
    additionalImages: [
      '/images/products/movecaps.jpeg',
      '/images/products/movedown.jpeg',
    ],
    description: 'Suporte nutricional para mobilidade e conforto articular. Formulação desenvolvida para auxiliar na manutenção da saúde das articulações e na funcionalidade do sistema musculoesquelético.',
    shortDescription: 'Fórmula com colágeno tipo II, cúrcuma e minerais para suporte nutricional das articulações.',
    category: 'Suplemento',
    anvisaRecord: '25351.215933/2025-15',
    unitsSold: 36,
  },
];