export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  badge?: 'bestseller' | 'novo' | 'vegano';
  oldPrice?: number;
  rating?: number;
  reviews?: number;
}

export const PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Vios Glow',
    price: 289.90,
    image: '/images/produto-1.jpg',
    description: 'Unhas, cabelo e pele',
    category: 'Suplemento'
  },
  {
    id: 'prod_2',
    name: 'Vios Sleep',
    price: 199.00,
    image: '/images/vios-sleep.png',
    description: 'Sono tranquilo.',
    category: 'Suplemento'
  },
  {
    id: 'prod_3',
    name: 'Vios Mag3',
    price: 129.00,
    image: '/images/produto-3.jpg',
    description: 'Saude total',
    category: 'Suplemento'
  },
  {
    id: 'prod_4',
    name: 'Vios Pulse',
    price: 549.90,
    image: '/images/produto-4.jpg',
    description: 'Energia na hora do treino',
    category: 'Suplemento'
  },
  {
    id: 'prod_5',
    name: 'Vios Move',
    price: 159.00,
    image: '/images/produto-5.jpg',
    description: 'Para terceira idade',
    category: 'Suplemento'
  }
];