import { desc, eq, sql, lt, gt, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  users, User, InsertUser, 
  categories, Category, InsertCategory, 
  products, Product, InsertProduct, 
  banners, Banner, InsertBanner, 
  orders, Order, InsertOrder, 
  localAccounts, LocalAccount, InsertLocalAccount, 
  admins, Admin, InsertAdmin, 
  siteConfig, SiteConfig, InsertSiteConfig 
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Inicialização segura do banco de dados (Lazy Loading)
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Falha ao conectar:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== USUÁRIOS (CONTAS E PERFIL) =====
export async function getUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  } catch (error) {
    console.error("[DB] Erro ao buscar usuários:", error);
    return [];
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "discordId"] as const;

    textFields.forEach((field) => {
      if (user[field] !== undefined) {
        const val = user[field] ?? null;
        values[field] = val as any;
        updateSet[field] = val;
      }
    });

    if (user.lastSignedIn) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    
    // Define admin se for o dono configurado no ENV
    if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[DB] Falha no upsertUser:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
  const result = await db.select().from(users).where(eq(users.id, userId));
  return result[0];
}

// ===== CATEGORIAS =====
export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.order));
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(categories).values(data);
  const id = (result as any)[0]?.insertId;
  return db.select().from(categories).where(eq(categories.id, id)).then(r => r[0]);
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(categories).set(data).where(eq(categories.id, id));
  return db.select().from(categories).where(eq(categories.id, id)).then(r => r[0]);
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(categories).where(eq(categories.id, id));
}

// ===== PRODUTOS =====
export async function getProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(asc(products.order));
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(products).values(data);
  const id = (result as any)[0]?.insertId;
  return db.select().from(products).where(eq(products.id, id)).then(r => r[0]);
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(products).set(data).where(eq(products.id, id));
  return db.select().from(products).where(eq(products.id, id)).then(r => r[0]);
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(products).where(eq(products.id, id));
}

// ===== BANNERS =====
export async function getBanners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(banners).orderBy(asc(banners.order));
}

export async function createBanner(data: InsertBanner) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(banners).values(data);
  const id = (result as any)[0]?.insertId;
  return db.select().from(banners).where(eq(banners.id, id)).then(r => r[0]);
}

export async function updateBanner(id: number, data: Partial<InsertBanner>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(banners).set(data).where(eq(banners.id, id));
  return db.select().from(banners).where(eq(banners.id, id)).then(r => r[0]);
}

export async function deleteBanner(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(banners).where(eq(banners.id, id));
}

// ===== PEDIDOS (ORDERS) =====
export async function getOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(orders).values(data);
  const res = await db.select().from(orders).orderBy(desc(orders.id)).limit(1);
  return res[0];
}

export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) return null;
  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId));
  return db.select().from(orders).where(eq(orders.id, orderId)).then(r => r[0]);
}

export async function getOrdersByGameId(gameId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.gameId, gameId));
}

// ===== CONTAS LOCAIS E ADMINS =====
export async function getAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const res = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  return res[0];
}

export async function createAdmin(data: InsertAdmin) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(admins).values(data);
  const res = await db.select().from(admins).orderBy(desc(admins.id)).limit(1);
  return res[0];
}

export async function updateAdminLastSignedIn(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(admins).set({ lastSignedIn: new Date() }).where(eq(admins.id, id));
}

export async function updateAdminPassword(id: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(admins).set({ passwordHash }).where(eq(admins.id, id));
}

export async function getLocalAccountByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const res = await db.select().from(localAccounts).where(eq(localAccounts.email, email)).limit(1);
  return res[0];
}

export async function createLocalAccount(data: InsertLocalAccount) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(localAccounts).values(data);
  const res = await db.select().from(localAccounts).orderBy(desc(localAccounts.id)).limit(1);
  return res[0];
}

// ===== CONFIGURAÇÃO DO SITE =====
export async function getSiteConfig() {
  const db = await getDb();
  if (!db) return null;
  const res = await db.select().from(siteConfig).limit(1);
  return res[0];
}

export async function updateSiteConfig(data: Partial<InsertSiteConfig>) {
  const db = await getDb();
  if (!db) return null;
  const current = await db.select().from(siteConfig).limit(1);
  if (current.length > 0) {
    await db.update(siteConfig).set(data).where(eq(siteConfig.id, current[0].id));
  } else {
    await db.insert(siteConfig).values(data as any);
  }
  return getSiteConfig();
}

// Funções de movimento para reordenação
export async function moveCategoryUp(id: number) {
  const db = await getDb(); if (!db) return null;
  const category = await db.select().from(categories).where(eq(categories.id, id)).then(r => r[0]);
  if (!category) return null;
  const prev = await db.select().from(categories).where(lt(categories.order, category.order)).orderBy(desc(categories.order)).limit(1).then(r => r[0]);
  if (!prev) return category;
  await db.update(categories).set({ order: prev.order }).where(eq(categories.id, id));
  await db.update(categories).set({ order: category.order }).where(eq(categories.id, prev.id));
  return category;
}

export async function moveCategoryDown(id: number) {
  const db = await getDb(); if (!db) return null;
  const category = await db.select().from(categories).where(eq(categories.id, id)).then(r => r[0]);
  if (!category) return null;
  const next = await db.select().from(categories).where(gt(categories.order, category.order)).orderBy(asc(categories.order)).limit(1).then(r => r[0]);
  if (!next) return category;
  await db.update(categories).set({ order: next.order }).where(eq(categories.id, id));
  await db.update(categories).set({ order: category.order }).where(eq(categories.id, next.id));
  return category;
}

export async function moveProductUp(id: number) {
  const db = await getDb(); if (!db) return null;
  const item = await db.select().from(products).where(eq(products.id, id)).then(r => r[0]);
  if (!item) return null;
  const prev = await db.select().from(products).where(lt(products.order, item.order)).orderBy(desc(products.order)).limit(1).then(r => r[0]);
  if (!prev) return item;
  await db.update(products).set({ order: prev.order }).where(eq(products.id, id));
  await db.update(products).set({ order: item.order }).where(eq(products.id, prev.id));
  return item;
}

export async function moveProductDown(id: number) {
  const db = await getDb(); if (!db) return null;
  const item = await db.select().from(products).where(eq(products.id, id)).then(r => r[0]);
  if (!item) return null;
  const next = await db.select().from(products).where(gt(products.order, item.order)).orderBy(asc(products.order)).limit(1).then(r => r[0]);
  if (!next) return item;
  await db.update(products).set({ order: next.order }).where(eq(products.id, id));
  await db.update(products).set({ order: item.order }).where(eq(products.id, next.id));
  return item;
}

export async function moveBannerUp(id: number) {
  const db = await getDb(); if (!db) return null;
  const item = await db.select().from(banners).where(eq(banners.id, id)).then(r => r[0]);
  if (!item) return null;
  const prev = await db.select().from(banners).where(lt(banners.order, item.order)).orderBy(desc(banners.order)).limit(1).then(r => r[0]);
  if (!prev) return item;
  await db.update(banners).set({ order: prev.order }).where(eq(banners.id, id));
  await db.update(banners).set({ order: item.order }).where(eq(banners.id, prev.id));
  return item;
}

export async function moveBannerDown(id: number) {
  const db = await getDb(); if (!db) return null;
  const item = await db.select().from(banners).where(eq(banners.id, id)).then(r => r[0]);
  if (!item) return null;
  const next = await db.select().from(banners).where(gt(banners.order, item.order)).orderBy(asc(banners.order)).limit(1).then(r => r[0]);
  if (!next) return item;
  await db.update(banners).set({ order: next.order }).where(eq(banners.id, id));
  await db.update(banners).set({ order: item.order }).where(eq(banners.id, next.id));
  return item;
}
