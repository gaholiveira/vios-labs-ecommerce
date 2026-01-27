import { PRODUCTS } from './products';

export interface Kit {
  id: string;
  name: string;
  price: number;
  oldPrice?: number; // Preço individual (sem desconto)
  products: string[]; // IDs dos produtos que compõem o kit
  description: string; // Frase de apoio
  badge?: 'kit' | 'protocolo';
  image?: string; // URL da imagem do kit (opcional - se não fornecido, usa template)
}

const kitsData = [
  {
    id: 'kit_1',
    name: 'Sinergia Absoluta',
    products: ['prod_1', 'prod_2', 'prod_3', 'prod_4', 'prod_5'],
    description: 'A totalidade da biotecnologia VIOS em um único protocolo.',
    badge: 'kit' as const,
    price: 797.00,
    oldPrice: 951.00,
    image: '/images/kits/sinergia.png'
  },
  {
    id: 'kit_2',
    name: 'Protocolo Essencial VIOS',
    products: ['prod_1', 'prod_4', 'prod_2'], // Glow + Pulse + Sleep
    description: 'O tripé da vitalidade: estética, cognição e restauração.',
    badge: 'protocolo' as const,
    price: 527.00,
    oldPrice: 595.00,
  },
  {
    id: 'kit_3',
    name: 'Eixo Cognitivo',
    products: ['prod_4', 'prod_3', 'prod_2'], // Pulse + Mag3 + Sleep
    description: 'Sustentação mental e estabilidade neurológica.',
    badge: 'protocolo' as const,
    price: 477.00,
    oldPrice: 543.00,
  },
  {
    id: 'kit_4',
    name: 'Dinâmica Sistêmica',
    products: ['prod_4', 'prod_3', 'prod_5'], // Pulse + Mag3 + Move
    description: 'Performance e longevidade para o corpo em movimento.',
    badge: 'protocolo' as const,
    price: 487.00,
    oldPrice: 553.00,
  },
  {
    id: 'kit_5',
    name: 'Ritmo Circadiano',
    products: ['prod_4', 'prod_2'], // Pulse + Sleep
    description: 'A ciência da alternância: propulsão e repouso.',
    badge: 'protocolo' as const,
    price: 337.00,
    oldPrice: 376.00,
  },
  {
    id: 'kit_6',
    name: 'Bio-Regeneração',
    products: ['prod_1', 'prod_2'], // Glow + Sleep
    description: 'Otimização dérmica via indução do sono profundo.',
    badge: 'protocolo' as const,
    price: 347.00,
    oldPrice: 398.00,
  },
];

export const KITS: Kit[] = kitsData;
