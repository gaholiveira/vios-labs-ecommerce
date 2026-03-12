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
import { trackAddToCart, trackRemoveFromCart } from "@/lib/analytics";
import { fbTrackAddToCart } from "@/lib/meta-pixel";

const CART_STORAGE_KEY = "vios_cart";

export interface CartItem extends Product {
  quantity: number;
  kitProducts?: string[];
  isKit?: boolean;
}

// ============================================================================
// Storage helpers
// ============================================================================
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

// ============================================================================
// Hook: cart operations + persistence
// ============================================================================
function useCartStore() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setCart(loadCartFromStorage());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveCartToStorage(cart);
  }, [cart, isHydrated]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && !item.isKit,
      );
      const quantityAdded = 1;
      const newQty = existing ? existing.quantity + quantityAdded : quantityAdded;
      trackAddToCart({
        itemId: product.id,
        itemName: product.name,
        price: product.price,
        quantity: quantityAdded,
        category: product.category,
      });
      fbTrackAddToCart({
        contentId: product.id,
        contentName: product.name,
        value: product.price * quantityAdded,
        quantity: quantityAdded,
      });
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && !item.isKit
            ? { ...item, quantity: newQty }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1, isKit: false }];
    });
  }, []);

  const addKitToCart = useCallback((kit: Kit) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === kit.id && item.isKit);
      const quantityAdded = 1;
      const newQty = existing ? existing.quantity + quantityAdded : quantityAdded;
      const category = kit.badge === "kit" ? "Kit" : "Protocolo";
      trackAddToCart({
        itemId: kit.id,
        itemName: kit.name,
        price: kit.price,
        quantity: quantityAdded,
        category,
      });
      fbTrackAddToCart({
        contentId: kit.id,
        contentName: kit.name,
        value: kit.price * quantityAdded,
        quantity: quantityAdded,
      });
      if (existing) {
        return prev.map((item) =>
          item.id === kit.id && item.isKit
            ? { ...item, quantity: newQty }
            : item,
        );
      }
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
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.id === productId);
      if (item) {
        trackRemoveFromCart({
          itemId: item.id,
          itemName: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
        });
      }
      return prev.filter((i) => i.id !== productId);
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => {
        const item = prev.find((i) => i.id === productId);
        if (item) {
          trackRemoveFromCart({
            itemId: item.id,
            itemName: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category,
          });
        }
        return prev.filter((i) => i.id !== productId);
      });
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

  const totalItems = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart],
  );

  const totalPrice = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart],
  );

  return {
    cart,
    addToCart,
    addKitToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };
}

// ============================================================================
// Hook: UI overlay/drawer/toast state
// ============================================================================
function useUIStore() {
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

  return {
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
  };
}

// ============================================================================
// Context + Provider
// ============================================================================
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, openDrawer?: boolean) => void;
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
  const cartStore = useCartStore();
  const uiStore = useUIStore();

  // addToCart expõe openDrawer como segundo argumento e dispara toast + drawer
  const addToCart = useCallback(
    (product: Product, openDrawer = true) => {
      const isExisting = cartStore.cart.some(
        (item) => item.id === product.id && !item.isKit,
      );
      cartStore.addToCart(product);
      uiStore.showToast(
        isExisting
          ? `${product.name} adicionado novamente à sacola`
          : `${product.name} adicionado à sacola`,
      );
      if (openDrawer) uiStore.setIsCartDrawerOpen(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartStore.cart, cartStore.addToCart, uiStore.showToast, uiStore.setIsCartDrawerOpen],
  );

  // addKitToCart sempre abre o drawer e dispara toast
  const addKitToCart = useCallback(
    (kit: Kit) => {
      const isExisting = cartStore.cart.some(
        (item) => item.id === kit.id && item.isKit,
      );
      cartStore.addKitToCart(kit);
      uiStore.showToast(
        isExisting
          ? `${kit.name} adicionado novamente à sacola`
          : `${kit.name} adicionado à sacola`,
      );
      uiStore.setIsCartDrawerOpen(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartStore.cart, cartStore.addKitToCart, uiStore.showToast, uiStore.setIsCartDrawerOpen],
  );

  return (
    <CartContext.Provider
      value={{
        cart: cartStore.cart,
        addToCart,
        addKitToCart,
        removeFromCart: cartStore.removeFromCart,
        updateQuantity: cartStore.updateQuantity,
        clearCart: cartStore.clearCart,
        totalItems: cartStore.totalItems,
        totalPrice: cartStore.totalPrice,
        isMenuOpen: uiStore.isMenuOpen,
        setIsMenuOpen: uiStore.setIsMenuOpen,
        isSearchOpen: uiStore.isSearchOpen,
        setIsSearchOpen: uiStore.setIsSearchOpen,
        isCartDrawerOpen: uiStore.isCartDrawerOpen,
        setIsCartDrawerOpen: uiStore.setIsCartDrawerOpen,
        toastMessage: uiStore.toastMessage,
        toastType: uiStore.toastType,
        showToast: uiStore.showToast,
        hideToast: uiStore.hideToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
};
