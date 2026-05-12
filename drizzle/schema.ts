import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";


/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  discordId: varchar("discordId", { length: 64 }), // ID do Discord do usuário
  gameId: varchar("gameId", { length: 50 }), // ID do jogo (5M)
  characterName: varchar("characterName", { length: 255 }), // Nome do personagem no jogo
  profilePicture: varchar("profilePicture", { length: 512 }), // URL da foto de perfil
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Categorias de produtos
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }),
  type: varchar('type', { length: 20 }).notNull().default('catalog'),
  order: int('order').notNull().default(0),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// Produtos
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }),
  categoryId: int("categoryId"),
  description: text("description"),
  price: int("price"), // em centavos
  oldPrice: int("oldPrice"),
  image: varchar("image", { length: 512 }),
  tag: varchar('tag', { length: 50 }).default('Novo'),
  // ADICIONE ESTA LINHA:
  showTag: boolean('showTag').default(true),
  rarity: varchar("rarity", { length: 50 }),
  benefits: json("benefits").$type<string[]>(),
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Banners
export const banners = mysqlTable('banners', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }),
  imageUrl: text('imageUrl').notNull(),
  link: text('link'), // Adiciona o campo de link no código
  order: int('order').notNull().default(0), // Adiciona o campo de ordem no código
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
});

export type Banner = typeof banners.$inferSelect;
export type InsertBanner = typeof banners.$inferInsert;

// Pedidos
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  playerNick: varchar("playerNick", { length: 255 }),
  gameId: varchar("gameId", { length: 50 }),
  
  // ADICIONAMOS ESTAS DUAS CAIXAS PARA OS DADOS FINANCEIROS:
  email: varchar("email", { length: 255 }),
  cpf: varchar("cpf", { length: 20 }),
  
  discordId: varchar("discordId", { length: 255 }), // Aumentamos para 255 por segurança
  discord: varchar("discord", { length: 255 }),
  
  // Mantemos o formato de itens da IA
  items: json("items").$type<{ productId: number; quantity: number; price: number; name?: string }[]>(),
  
  subtotal: int("subtotal"),
  discount: int("discount"),
  total: int("total"),
  status: varchar("status", { length: 50 }).default('pending'),

  // FATO TÉCNICO: .defaultNow() resolve o erro do "N/A" na data
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Tabela para armazenar Discord user info
export const discordUsers = mysqlTable("discordUsers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  discordId: varchar("discordId", { length: 64 }).notNull().unique(),
  discordUsername: varchar("discordUsername", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type DiscordUser = typeof discordUsers.$inferSelect;
export type InsertDiscordUser = typeof discordUsers.$inferInsert;

// Tabela para armazenar contas locais (email/senha)
export const localAccounts = mysqlTable("localAccounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  gameId: varchar("gameId", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type LocalAccount = typeof localAccounts.$inferSelect;
export type InsertLocalAccount = typeof localAccounts.$inferInsert;
// Tabela para rastrear clientes Stripe
export const stripeCustomers = mysqlTable("stripeCustomers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type InsertStripeCustomer = typeof stripeCustomers.$inferInsert;

// Tabela para rastrear pagamentos
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderId: int("orderId"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).notNull().unique(),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }).unique(),
  amount: int("amount").notNull(), // em centavos
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // pending, succeeded, failed, canceled
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela para cupons
export const coupons = mysqlTable('coupons', {
  id: int('id').primaryKey().autoincrement(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: varchar('type', { length: 20 }).notNull().default('percentage'),
  value: int('value').notNull(),
  isActive: boolean('isActive').default(true),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// Tabela para armazenar contas de ADM com senha especial
export const admins = mysqlTable("admins", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: int("isActive").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

// Tabela para armazenar configurações do site
export const siteConfig = mysqlTable("siteConfig", {
  id: int("id").autoincrement().primaryKey(),
  heroTitle: text("heroTitle"), // "Eleve sua experiência no FiveM"
  heroSubtitle: text("heroSubtitle"), // "Bem-vindo à Aura City"
  heroDescription: text("heroDescription"), // "Descubra pacotes VIP, veículos premium..."
  welcomeText: text("welcomeText"), // Texto de boas-vindas
  catalogTitle: varchar("catalogTitle", { length: 255 }), // "Catálogo"
  benefitsTitle: varchar("benefitsTitle", { length: 255 }), // "Benefícios"
  couponBannerText: text('couponBannerText'),
  couponBannerEnabled: boolean('couponBannerEnabled').default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteConfig = typeof siteConfig.$inferSelect;
export type InsertSiteConfig = typeof siteConfig.$inferInsert;
