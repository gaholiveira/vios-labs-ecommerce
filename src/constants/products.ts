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
    price: 219.00,
    image: '/images/products/glow.jpeg',
    description: 'Unhas, cabelo e pele',
    category: 'Suplemento'
  },
  {
    id: 'prod_2',
    name: 'Vios Sleep',
    price: 179.00,
    image: '/images/products/sleep.jpeg',
    description: 'Sono tranquilo.',
    category: 'Suplemento'
  },
  {
    id: 'prod_3',
    name: 'Vios Mag3',
    price: 167.00,
    image: '/images/products/mag3.jpeg',
    description: 'Saude total',
    category: 'Suplemento'
  },
  {
    id: 'prod_4',
    name: 'Vios Pulse',
    price: 197.00,
    image: '/images/products/pulse.jpeg',
    description: 'Energia na hora do treino',
    category: 'Suplemento'
  },
  {
    id: 'prod_5',
    name: 'Vios Move',
    price: 189.00,
    image: '/images/products/move.jpeg',
    description: 'Para terceira idade',
    category: 'Suplemento'
  }
];