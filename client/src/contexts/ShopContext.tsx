import { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { Category, Product, Banner, Order } from "@/../../drizzle/schema";

interface ShopContextType {
  categories: Category[];
  products: Product[];
  banners: Banner[];
  orders: Order[];
  isLoading: boolean;
  refetch: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  // Queries
  const { data: categories = [] } = trpc.shop.categories.list.useQuery();
  const { data: products = [] } = trpc.shop.products.list.useQuery();
  const { data: banners = [] } = trpc.shop.banners.list.useQuery();
  const { data: orders = [] } = trpc.shop.orders.list.useQuery(undefined, {
    enabled: false, // Orders são privadas do admin
  });

  const utils = trpc.useUtils();

  const refetch = () => {
    utils.shop.categories.list.invalidate();
    utils.shop.products.list.invalidate();
    utils.shop.banners.list.invalidate();
  };

  useEffect(() => {
    setIsLoading(false);
  }, [categories, products, banners]);

  return (
    <ShopContext.Provider value={{ categories, products, banners, orders, isLoading, refetch }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within ShopProvider");
  }
  return context;
}
