'use client';
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Product } from '@/constants/products';
import { Kit } from '@/constants/kits';

interface CartItem extends Product {
  quantity: number;
  // Para kits, armazena os IDs dos produtos que compõem o kit
  kitProducts?: string[];
  isKit?: boolean;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  addKitToCart: (kit: Kit) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean; // Estado para abrir/fechar
  setIsOpen: (open: boolean) => void;
  totalItems: number;
  totalPrice: number;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (message: string) => void;
  hideToast: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false); // Começa fechado
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const hideToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id && !item.isKit);
      if (existing) {
        setToastMessage(`${product.name} adicionado novamente ao carrinho`);
        return prev.map((item) =>
          item.id === product.id && !item.isKit ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      setToastMessage(`${product.name} adicionado ao carrinho`);
      return [...prev, { ...product, quantity: 1, isKit: false }];
    });
    setIsOpen(true); // Abre o carrinho automaticamente ao adicionar
  }, []);

  const addKitToCart = useCallback((kit: Kit) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === kit.id && item.isKit);
      if (existing) {
        setToastMessage(`${kit.name} adicionado novamente ao carrinho`);
        return prev.map((item) =>
          item.id === kit.id && item.isKit ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      setToastMessage(`${kit.name} adicionado ao carrinho`);
      // Criar um item de carrinho a partir do kit
      const kitAsCartItem: CartItem = {
        id: kit.id,
        name: kit.name,
        price: kit.price,
        image: '/images/products/glow.jpeg', // Imagem placeholder - será substituída pelo template
        description: kit.description,
        category: kit.badge === 'kit' ? 'Kit' : 'Protocolo',
        quantity: 1,
        kitProducts: kit.products,
        isKit: true,
      };
      return [...prev, kitAsCartItem];
    });
    setIsOpen(true); // Abre o carrinho automaticamente ao adicionar
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const totalPrice = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart,
      addKitToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isOpen, 
      setIsOpen, 
      totalItems,
      totalPrice,
      isMenuOpen, 
      setIsMenuOpen, 
      isSearchOpen, 
      setIsSearchOpen,
      toastMessage,
      showToast,
      hideToast
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart error');
  return context;
};