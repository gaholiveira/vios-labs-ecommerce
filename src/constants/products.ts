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
    description: 'Desenvolvido para pessoas que desejam complementar cuidados com pele, cabelo e unhas, buscam suporte nutricional para beleza e bem-estar e valorizam uma abordagem de autocuidado de dentro para fora. O VIOS Glow é uma joia biotecnológica em cápsulas, desenvolvida para quem exige a máxima performance estética. Esta fórmula de alta absorção foi desenhada para restaurar a arquitetura dérmica e elevar o brilho natural da pele, cabelos e unhas ao seu ápice. Com complexo vitamínico completo e minerais essenciais, o Glow oferece suporte estrutural de dentro para fora, unindo precisão farmacêutica a biodisponibilidade otimizada.',
    shortDescription: 'Vitaminas e minerais selecionados para suporte nutricional da pele, cabelos e unhas.',
    category: 'Suplemento',
    soldOut: true,
  },
  {
    id: 'prod_2',
    name: 'Vios Sleep',
    tagline: 'Melatonina para Sono Reparador',
    price: 179.00,
    image: '/images/products/sleepnew.jpeg',
    description: 'Desenvolvido para pessoas que buscam melhorar a rotina de sono, possuem rotina intensa e desejam suporte para descanso adequado. Indicado para quem valoriza recuperação e qualidade do sono e deseja complementar hábitos voltados ao descanso noturno. O VIOS Sleep é uma joia biotecnológica em forma de solução oral, desenhada para quem busca a perfeição no ciclo de repouso. Esta fórmula líquida de alta pureza utiliza a melatonina para harmonizar o ritmo circadiano, permitindo que o organismo alcance um estado de restauração profunda e contínua. Projetado para uma absorção imediata, o VIOS Sleep oferece uma experiência sensorial calmante com o delicado sabor de maracujá, preparando os sentidos para o relaxamento absoluto sem a ingestão de açúcares ou calorias.',
    shortDescription: 'Melatonina líquida para suporte ao ciclo natural do sono e ao descanso noturno.',
    category: 'Suplemento',
    anvisaRecord: '25351.088701/2025-70',
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
    description: 'Desenvolvido para pessoas com rotina intensa que desejam complementar a ingestão de magnésio, buscam suporte nutricional para função muscular e nervosa e praticam atividade física. Também indicado para quem deseja fortalecer o equilíbrio mineral da rotina diária. O VIOS MAG3 é uma joia da engenharia molecular, desenvolvida para quem busca o equilíbrio sistêmico através da tripla infusão de magnésio. Esta fórmula avançada une três formas distintas do mineral para garantir uma cobertura biológica completa, proporcionando alta absorção e um efeito prolongado no organismo. Projetado para ser uma combinação inteligente e potente, o MAG3 é o aliado definitivo para manter a homeostase corporal, oferecendo suporte contínuo à saúde óssea e neuromuscular.',
    shortDescription: 'Magnésio em três formas para suporte energético, muscular e neurometabólico.',
    category: 'Suplemento',
    anvisaRecord: '25351.066423/2025-08',
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
    description: 'Desenvolvido para pessoas com rotina intensa e alta demanda de energia, que buscam suporte nutricional para foco e produtividade. Indicado para praticantes de atividade física ou treinos intensos e para profissionais e estudantes que desejam manter desempenho mental. O VIOS Pulse é uma joia da bioengenharia, desenvolvida para quem busca o ápice da performance física e mental. Este suplemento de alta performance combina ativos de precisão para proporcionar um estado de foco inabalável e energia contínua, elevando a termogênese e a resistência sistêmica. Projetado como um estimulante de elite, o Pulse é o aliado definitivo para transformar rituais de atividade física em experiências de máximo rendimento e clareza cognitiva.',
    shortDescription: 'Fórmula com cafeína e complexo B para suporte à energia, foco e desempenho mental.',
    category: 'Suplemento',
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
    description: 'Desenvolvido para pessoas que buscam suporte nutricional para articulações, praticam atividade física regularmente e desejam manter mobilidade e conforto nos movimentos. Indicado para quem valoriza saúde articular e qualidade de vida. O VIOS Move é uma joia da engenharia biotecnológica, desenhada para quem busca a máxima preservação da mobilidade e do bem-estar estrutural. Esta fórmula avançada combina ativos de precisão para fortalecer os tecidos musculares e proteger a integridade de ossos e articulações. Projetado como um suporte multiações, o Move atua na redução de processos inflamatórios e na otimização da lubrificação articular, sendo o aliado definitivo para uma vida em movimento e alta performance funcional.',
    shortDescription: 'Fórmula com colágeno tipo II, cúrcuma e minerais para suporte nutricional das articulações.',
    category: 'Suplemento',
    anvisaRecord: '25351.215933/2025-15',
  },
];