import { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { Category, Product, Banner, Order } from "@/../../drizzle/schema";

export type CartLine = {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

interface ShopContextType {
  // Dados do Banco
  categories: Category[];
  products: Product[];
  banners: Banner[];
  orders: Order[];
  isLoading: boolean;
  refetch: () => void;
  
  // Dados do Carrinho Global
  cart: CartLine[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: any) => void;
  updateQuantity: (productId: number, direction: "increase" | "decrease") => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  // Queries originais do banco
  const { data: categories =[] } = trpc.shop.categories.list.useQuery();
  const { data: products =[] } = trpc.shop.products.list.useQuery();
  const { data: banners =[] } = trpc.shop.banners.list.useQuery();
  const { data: orders =[] } = trpc.shop.orders.list.useQuery(undefined, { enabled: false });
  const utils = trpc.useUtils();

  const refetch = () => {
    utils.shop.categories.list.invalidate();
    utils.shop.products.list.invalidate();
    utils.shop.banners.list.invalidate();
  };

  useEffect(() => {
    setIsLoading(false);
  }, [categories, products, banners]);

  // ==========================================
  // LÓGICA DO CARRINHO GLOBAL (Com memória local)
  // ==========================================
  const [cart, setCart] = useState<CartLine[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("auracity-cart");
      return saved ? JSON.parse(saved) : [];
    }
    return[];
  });
  
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("auracity-cart", JSON.stringify(cart));
  },[cart]);

  const addToCart = (product: any) => {
    setCart((current) => {
      const exists = current.find((item) => item.id === product.id);
      if (exists) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, direction: "increase" | "decrease") => {
    setCart((current) =>
      current.map((item) => {
        if (item.id !== productId) return item;
        const nextQuantity = direction === "increase" ? item.quantity + 1 : item.quantity - 1;
        return { ...item, quantity: nextQuantity };
      }).filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: number) => {
    setCart((current) => current.filter((item) => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  return (
    <ShopContext.Provider value={{ 
      categories, products, banners, orders, isLoading, refetch,
      cart, cartOpen, setCartOpen, addToCart, updateQuantity, removeItem, clearCart
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop deve ser usado dentro do ShopProvider");
  return context;
}
