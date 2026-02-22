export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
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
  availableQuantity?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  /** Produto esgotado (ex.: Glow) — botão desabilitado com label "Esgotado" */
  soldOut?: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Vios Glow',
    price: 219.00,
    image: '/images/products/glownew.jpeg',
    description: 'O VIOS Glow é uma joia biotecnológica em cápsulas, desenvolvida para quem exige a máxima performance estética. Esta fórmula de alta absorção foi desenhada para restaurar a arquitetura dérmica e elevar o brilho natural da pele, cabelos e unhas ao seu ápice. Com complexo vitamínico completo e minerais essenciais, o Glow oferece suporte estrutural de dentro para fora, unindo precisão farmacêutica a biodisponibilidade otimizada.',
    shortDescription: 'Hair, Skin & Nails. Complexo vitamínico em cápsulas.',
    category: 'Suplemento',
    soldOut: true,
  },
  {
    id: 'prod_2',
    name: 'Vios Sleep',
    price: 179.00,
    image: '/images/products/sleep.jpeg',
    description: 'O VIOS Sleep é uma joia biotecnológica em forma de solução oral, desenhada para quem busca a perfeição no ciclo de repouso. Esta fórmula líquida de alta pureza utiliza a melatonina para harmonizar o ritmo circadiano, permitindo que o organismo alcance um estado de restauração profunda e contínua. Projetado para uma absorção imediata, o VIOS Sleep oferece uma experiência sensorial calmante com o delicado sabor de maracujá, preparando os sentidos para o relaxamento absoluto sem a ingestão de açúcares ou calorias.',
    shortDescription: 'Sono reparador em solução oral. Sabor maracujá.',
    category: 'Suplemento',
    anvisaRecord: '25351.088701/2025-70',
  },
  {
    id: 'prod_3',
    name: 'Vios Mag3',
    price: 167.00,
    image: '/images/products/mag3.jpeg',
    description: 'O VIOS MAG3 é uma joia da engenharia molecular, desenvolvida para quem busca o equilíbrio sistêmico através da tripla infusão de magnésio. Esta fórmula avançada une três formas distintas do mineral para garantir uma cobertura biológica completa, proporcionando alta absorção e um efeito prolongado no organismo. Projetado para ser uma combinação inteligente e potente, o MAG3 é o aliado definitivo para manter a homeostase corporal, oferecendo suporte contínuo à saúde óssea e neuromuscular.',
    shortDescription: 'Tripla infusão de magnésio. Ossos e músculos.',
    category: 'Suplemento',
    anvisaRecord: '25351.066423/2025-08',
  },
  {
    id: 'prod_4',
    name: 'Vios Pulse',
    price: 197.00,
    image: '/images/products/pulse.jpeg',
    description: 'O VIOS Pulse é uma joia da bioengenharia, desenvolvida para quem busca o ápice da performance física e mental. Este suplemento de alta performance combina ativos de precisão para proporcionar um estado de foco inabalável e energia contínua, elevando a termogênese e a resistência sistêmica. Projetado como um estimulante de elite, o Pulse é o aliado definitivo para transformar rituais de atividade física em experiências de máximo rendimento e clareza cognitiva.',
    shortDescription: 'Foco e energia para performance física e mental.',
    category: 'Suplemento',
  },
  {
    id: 'prod_5',
    name: 'Vios Move',
    price: 189.00,
    image: '/images/products/move.jpeg',
    description: 'O VIOS Move é uma joia da engenharia biotecnológica, desenhada para quem busca a máxima preservação da mobilidade e do bem-estar estrutural. Esta fórmula avançada combina ativos de precisão para fortalecer os tecidos musculares e proteger a integridade de ossos e articulações. Projetado como um suporte multiações, o Move atua na redução de processos inflamatórios e na otimização da lubrificação articular, sendo o aliado definitivo para uma vida em movimento e alta performance funcional.',
    shortDescription: 'Mobilidade, articulações e bem-estar estrutural.',
    category: 'Suplemento',
    anvisaRecord: '25351.215933/2025-15',
  },
];