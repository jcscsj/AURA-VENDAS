import { desc, eq, sql, lt, gt, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { ENV } from './_core/env';

const { users, categories, products, banners, orders, admins, localAccounts, siteConfig } = schema;
let _db: any = null;

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _db = drizzle(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Falha ao conectar:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== USUÁRIOS =====
export async function getUsers() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(users).orderBy(desc(users.id));
}

export async function upsertUser(data: any) {
  const db = await getDb(); if (!db) return;
  if (data.openId === ENV.ownerOpenId) data.role = 'admin';
  await db.insert(users).values(data).onDuplicateKeyUpdate({ set: data });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const res = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return res[0];
}

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb(); if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserProfile(id: number, data: any) {
  const db = await getDb(); if (!db) return null;
  await db.update(users).set(data).where(eq(users.id, id));
  return db.select().from(users).where(eq(users.id, id)).then(r => r[0]);
}

// ===== CATEGORIAS =====
export async function getCategories() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(categories);
}

export async function createCategory(data: any) {
  const db = await getDb();
  if (!db) return null;
  // FATO TÉCNICO: O TiDB não retorna o ID assim. Inserimos e puxamos a última linha.
  await db.insert(categories).values(data);
  const res = await db.select().from(categories).orderBy(desc(categories.id)).limit(1);
  return res[0] || null;
}

export async function updateCategory(id: number, data: any) {
  const db = await getDb(); if (!db) return null;
  await db.update(categories).set(data).where(eq(categories.id, id));
  return db.select().from(categories).where(eq(categories.id, id)).then(r => r[0]);
}

export async function deleteCategory(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(categories).where(eq(categories.id, id));
}

// ===== PRODUTOS =====
export async function getProducts() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(products);
}

export async function createProduct(data: any) {
  const db = await getDb(); if (!db) return null;
  const res = await db.insert(products).values(data);
  return db.select().from(products).where(eq(products.id, (res as any)[0].insertId)).then(r => r[0]);
}

export async function updateProduct(id: number, data: any) {
  const db = await getDb(); if (!db) return null;
  await db.update(products).set(data).where(eq(products.id, id));
  return db.select().from(products).where(eq(products.id, id)).then(r => r[0]);
}

export async function deleteProduct(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(products).where(eq(products.id, id));
}

// ===== BANNERS (O QUE ESTAVA FALTANDO) =====
export async function getBanners() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(banners);
}

export async function createBanner(data: any) {
  const db = await getDb(); if (!db) return null;
  const res = await db.insert(banners).values(data);
  return db.select().from(banners).where(eq(banners.id, (res as any)[0].insertId)).then(r => r[0]);
}

export async function updateBanner(id: number, data: any) {
  const db = await getDb(); if (!db) return null;
  await db.update(banners).set(data).where(eq(banners.id, id));
  return db.select().from(banners).where(eq(banners.id, id)).then(r => r[0]);
}

export async function deleteBanner(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(banners).where(eq(banners.id, id));
}

// ===== PEDIDOS (ORDERS) =====
export async function getOrders() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(orders);
}

export async function createOrder(data: any) {
  const db = await getDb(); if (!db) return null;
  await db.insert(orders).values(data);
  return db.select().from(orders).orderBy(desc(orders.id)).limit(1).then(r => r[0]);
}

export async function updateOrderStatus(id: number, status: string) {
  const db = await getDb(); if (!db) return null;
  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id));
  return db.select().from(orders).where(eq(orders.id, id)).then(r => r[0]);
}

export async function getOrdersByGameId(gameId: string) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(orders).where(eq(orders.gameId, gameId));
}

// ===== ADMINS E CONTAS LOCAIS =====
export async function getAdminByEmail(email: string) {
  const db = await getDb(); if (!db) return null;
  return db.select().from(admins).where(eq(admins.email, email)).limit(1).then(r => r[0]);
}

export async function createAdmin(data: any) {
  const db = await getDb(); if (!db) return null;
  await db.insert(admins).values(data);
  return db.select().from(admins).orderBy(desc(admins.id)).limit(1).then(r => r[0]);
}

export async function updateAdminLastSignedIn(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(admins).set({ lastSignedIn: new Date() }).where(eq(admins.id, id));
}

export async function updateAdminPassword(id: number, hash: string) {
  const db = await getDb(); if (!db) return;
  await db.update(admins).set({ passwordHash: hash }).where(eq(admins.id, id));
}

export async function getLocalAccountByEmail(email: string) {
  const db = await getDb(); if (!db) return null;
  return db.select().from(localAccounts).where(eq(localAccounts.email, email)).limit(1).then(r => r[0]);
}

export async function createLocalAccount(data: any) {
  const db = await getDb(); if (!db) return null;
  await db.insert(localAccounts).values(data);
  return db.select().from(localAccounts).orderBy(desc(localAccounts.id)).limit(1).then(r => r[0]);
}

// ===== CONFIG SITE E MOVIMENTOS =====
export async function getSiteConfig() {
  const db = await getDb(); if (!db) return null;
  return db.select().from(siteConfig).limit(1).then(r => r[0]);
}

export async function updateSiteConfig(data: any) {
  const db = await getDb(); if (!db) return null;
  const curr = await getSiteConfig();
  if (curr) await db.update(siteConfig).set(data).where(eq(siteConfig.id, curr.id));
  else await db.insert(siteConfig).values(data);
  return getSiteConfig();
}

export async function moveCategoryUp(id: number) { return null; }
export async function moveCategoryDown(id: number) { return null; }
export async function moveProductUp(id: number) { return null; }
export async function moveProductDown(id: number) { return null; }
export async function moveBannerUp(id: number) { return null; }
export async function moveBannerDown(id: number) { return null; }
