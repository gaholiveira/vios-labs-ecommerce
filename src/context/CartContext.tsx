"use client";
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { Product, PRODUCTS } from "@/constants/products";
import { Kit, KITS } from "@/constants/kits";
import { trackAddToCart } from "@/lib/analytics";

const CART_STORAGE_KEY = "vios_cart";

interface CartItem extends Product {
  quantity: number;
  // Para kits, armazena os IDs dos produtos que compõem o kit
  kitProducts?: string[];
  isKit?: boolean;
}

function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    const productIds = new Set(PRODUCTS.map((p) => p.id));
    const kitIds = new Set(KITS.map((k) => k.id));
    return parsed.filter((item) => {
      if (!item?.id || typeof item.quantity !== "number" || item.quantity < 1)
        return false;
      return item.isKit ? kitIds.has(item.id) : productIds.has(item.id);
    });
  } catch {
    return [];
  }
}

function saveCartToStorage(cart: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Ignora falhas (quota excedida, privado, etc.)
  }
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  addKitToCart: (kit: Kit) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  toastMessage: string | null;
  toastType: "default" | "error";
  showToast: (message: string, type?: "default" | "error") => void;
  hideToast: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"default" | "error">("default");

  const showToast = useCallback(
    (message: string, type: "default" | "error" = "default") => {
      setToastMessage(message);
      setToastType(type);
    },
    [],
  );

  const hideToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && !item.isKit,
      );
      const newQty = existing ? existing.quantity + 1 : 1;
      trackAddToCart({
        itemId: product.id,
        itemName: product.name,
        price: product.price,
        quantity: newQty,
        category: product.category,
      });
      if (existing) {
        setToastMessage(`${product.name} adicionado novamente à sacola`);
        setToastType("default");
        return prev.map((item) =>
          item.id === product.id && !item.isKit
            ? { ...item, quantity: newQty }
            : item,
        );
      }
      setToastMessage(`${product.name} adicionado à sacola`);
      setToastType("default");
      return [...prev, { ...product, quantity: 1, isKit: false }];
    });
    setIsCartDrawerOpen(true);
  }, []);

  const addKitToCart = useCallback((kit: Kit) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === kit.id && item.isKit);
      const newQty = existing ? existing.quantity + 1 : 1;
      const category = kit.badge === "kit" ? "Kit" : "Protocolo";
      trackAddToCart({
        itemId: kit.id,
        itemName: kit.name,
        price: kit.price,
        quantity: newQty,
        category,
      });
      if (existing) {
        setToastMessage(`${kit.name} adicionado novamente à sacola`);
        setToastType("default");
        return prev.map((item) =>
          item.id === kit.id && item.isKit
            ? { ...item, quantity: newQty }
            : item,
        );
      }
      setToastMessage(`${kit.name} adicionado à sacola`);
      setToastType("default");
      const kitAsCartItem: CartItem = {
        id: kit.id,
        name: kit.name,
        price: kit.price,
        image: kit.image || "/images/products/glow.jpeg",
        description: kit.description,
        category,
        quantity: 1,
        kitProducts: kit.products,
        isKit: true,
      };
      return [...prev, kitAsCartItem];
    });
    setIsCartDrawerOpen(true);
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
        item.id === productId ? { ...item, quantity } : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  useEffect(() => {
    setCart(loadCartFromStorage());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveCartToStorage(cart);
  }, [cart, isHydrated]);

  const totalItems = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart],
  );

  const totalPrice = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart],
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        addKitToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isMenuOpen,
        setIsMenuOpen,
        isSearchOpen,
        setIsSearchOpen,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        toastMessage,
        toastType,
        showToast,
        hideToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart error");
  return context;
};
