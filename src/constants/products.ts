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
  /** CTA principal (ex.: "Quero dormir melhor") — substitui "Comprar agora" / botão do card */
  ctaPrimary?: string;
  /** CTA secundário (ex.: "Adicionar à sacola") — opcional */
  ctaSecondary?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'prod_2',
    name: 'Vios Sleep',
    tagline: 'Melatonina para Sono Reparador',
    price: 159.90,
    oldPrice: 179.00,
    image: 'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/sleepnew.jpeg',
    additionalImages: [
      'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/sleeptabela.jpg',
    ],
    description: 'Suporte nutricional avançado para um sono profundo e restaurador. Melatonina em solução líquida de alta absorção desenvolvida para auxiliar na regulação do ciclo circadiano e favorecer o início do sono, contribuindo para uma rotina noturna equilibrada.',
    shortDescription: 'Melatonina em gotas para auxiliar no sono profundo e no descanso noturno.',
    category: 'Suplemento',
    badge: 'bestseller',
    anvisaRecord: '25351.088701/2025-70',
    unitsSold: 40,
    ctaPrimary: 'Quero dormir melhor',
  },
  {
    id: 'prod_1',
    name: 'Vios Glow',
    tagline: 'Hair, Skin & Nails',
    price: 199.90,
    oldPrice: 219.00,
    image: 'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/glownew.jpeg',
    additionalImages: [
      'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/tabelaglow.jpg',
      'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/glowcaps.jpeg',
      'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/glowdown.jpeg',
    ],
    description: 'Nutrição estratégica para pele, cabelos e vitalidade. Vitaminas e minerais selecionados para oferecer suporte nutricional à saúde da pele e contribuir para o equilíbrio antioxidante do organismo.',
    shortDescription: 'Nutrição que auxilia na beleza e vitalidade de pele, cabelos e unhas.',
    category: 'Suplemento',
    unitsSold: 32,
    ctaPrimary: 'Quero cuidar da beleza',
  },
  {
    id: 'prod_4',
    name: 'Vios Pulse',
    tagline: 'Foco e Energia para Performance',
    price: 179.90,
    oldPrice: 197.00,
    image: 'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/pulsenew.jpeg',
    additionalImages: [
      'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/pulsetabela.jpg',
      'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/pulsecaps.jpeg',
      'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/pulsedown.jpeg',
    ],
    description: 'Suporte nutricional para energia, foco e desempenho. Uma formulação pensada para auxiliar na disposição física e mental, contribuindo para maior clareza, vitalidade e desempenho em momentos de alta exigência.',
    shortDescription: 'Cafeína e complexo B para auxiliar na energia, foco e desempenho ao longo do dia.',
    category: 'Suplemento',
    unitsSold: 24,
    ctaPrimary: 'Quero energia e foco',
  },
  {
    id: 'prod_3',
    name: 'Vios Mag3',
    tagline: 'Tripla Infusão de Magnésio',
    price: 147.90,
    oldPrice: 167.00,
    image: 'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/mag3new.jpeg',
    additionalImages: [
      'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/mag3tabela.jpg',
      'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/mag3caps.jpeg',
      'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/mag3down.jpeg',
    ],
    description: 'Magnésio avançado para suporte metabólico e equilíbrio neuromuscular. Uma formulação cuidadosamente desenvolvida para auxiliar no funcionamento muscular, no suporte ao sistema nervoso e no equilíbrio do organismo em rotinas de alta demanda.',
    shortDescription: 'Tripla infusão de magnésio para auxiliar na energia, função muscular e equilíbrio.',
    category: 'Suplemento',
    anvisaRecord: '25351.066423/2025-08',
    unitsSold: 28,
    ctaPrimary: 'Quero equilíbrio mineral',
  },
  {
    id: 'prod_5',
    name: 'Vios Move',
    tagline: 'Mobilidade e Articulações',
    price: 169.90,
    oldPrice: 189.00,
    image: 'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/movenew.jpeg',
    additionalImages: [
      'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/movetabela.jpg',
      'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/movecaps.jpeg',
      'https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/products/movedown.jpeg',
    ],
    description: 'Suporte nutricional para mobilidade e conforto articular. Formulação desenvolvida para auxiliar na manutenção da saúde das articulações e na funcionalidade do sistema musculoesquelético.',
    shortDescription: 'Colágeno tipo II e cúrcuma para auxiliar na mobilidade e conforto articular.',
    category: 'Suplemento',
    anvisaRecord: '25351.215933/2025-15',
    unitsSold: 20,
    ctaPrimary: 'Quero mobilidade',
  },
];