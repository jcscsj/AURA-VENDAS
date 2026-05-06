import { desc, eq, sql, lt, gt, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { ENV } from './_core/env';

// Puxamos as tabelas do schema de forma segura
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
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(users);
  } catch (error) {
    return [];
  }
}

export async function upsertUser(user: any) {
  const db = await getDb();
  if (!db || !user.openId) return;
  try {
    const data = { ...user };
    if (user.openId === ENV.ownerOpenId) data.role = 'admin';
    await db.insert(users).values(data).onDuplicateKeyUpdate({ set: data });
  } catch (e) {
    console.error(e);
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return res[0];
}

// ===== CATEGORIAS =====
export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories);
}

export async function createCategory(data: any) {
  const db = await getDb();
  if (!db) return null;
  const res = await db.insert(categories).values(data);
  const id = (res as any)[0]?.insertId;
  return db.select().from(categories).where(eq(categories.id, id)).then((r: any) => r[0]);
}

export async function updateCategory(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  await db.update(categories).set(data).where(eq(categories.id, id));
  return db.select().from(categories).where(eq(categories.id, id)).then((r: any) => r[0]);
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
  return db.select().from(products);
}

export async function createProduct(data: any) {
  const db = await getDb();
  if (!db) return null;
  const res = await db.insert(products).values(data);
  const id = (res as any)[0]?.insertId;
  return db.select().from(products).where(eq(products.id, id)).then((r: any) => r[0]);
}

export async function updateProduct(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  await db.update(products).set(data).where(eq(products.id, id));
  return db.select().from(products).where(eq(products.id, id)).then((r: any) => r[0]);
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(products).where(eq(products.id, id));
}

// ===== PEDIDOS (ORDERS) =====
export async function getOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders);
}

export async function createOrder(data: any) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(orders).values(data);
  return db.select().from(orders).orderBy(desc(orders.id)).limit(1).then((r: any) => r[0]);
}

// ===== ADMINS E CONTAS LOCAIS =====
export async function getAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  return db.select().from(admins).where(eq(admins.email, email)).limit(1).then((r: any) => r[0]);
}

export async function createAdmin(data: any) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(admins).values(data);
  return db.select().from(admins).orderBy(desc(admins.id)).limit(1).then((r: any) => r[0]);
}

export async function getLocalAccountByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  return db.select().from(localAccounts).where(eq(localAccounts.email, email)).limit(1).then((r: any) => r[0]);
}

// ===== CONFIG SITE =====
export async function getSiteConfig() {
  const db = await getDb();
  if (!db) return null;
  return db.select().from(siteConfig).limit(1).then((r: any) => r[0]);
}

export async function updateSiteConfig(data: any) {
  const db = await getDb();
  if (!db) return null;
  const current = await getSiteConfig();
  if (current) {
    await db.update(siteConfig).set(data).where(eq(siteConfig.id, current.id));
  } else {
    await db.insert(siteConfig).values(data);
  }
  return getSiteConfig();
}
