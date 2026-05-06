import { relations } from "drizzle-orm";
import { users, categories, products, banners, orders } from "./schema";

// Relações para queries
export const usersRelations = relations(users, ({ many }) => ({
  // Adicione relações conforme necessário
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const bannersRelations = relations(banners, ({ many }) => ({
  // Adicione relações conforme necessário
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  // Adicione relações conforme necessário
}));
