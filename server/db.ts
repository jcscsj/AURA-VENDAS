import { desc, eq, sql, lt, gt, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, categories, products, banners, orders, Category, Product, Banner, Order, InsertCategory, InsertProduct, InsertBanner, InsertOrder, localAccounts, LocalAccount, InsertLocalAccount, admins, Admin, InsertAdmin, siteConfig, SiteConfig, InsertSiteConfig } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== CATEGORIAS =====
export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories);
}

export async function createCategory(data: InsertCategory): Promise<Category | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(categories).values(data);
  const id = Number((result as any).insertId || (result as any).lastInsertRowid);
  if (isNaN(id)) {
    console.error("[DB] Failed to extract insert ID:", result);
    return null;
  }
  return db.select().from(categories).where(eq(categories.id, id)).then(r => r[0] || null);
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(categories).where(eq(categories.id, id));
}

// ===== PRODUTOS =====
export async function getProducts(): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products);
}

export async function createProduct(data: InsertProduct): Promise<Product | null> {
  const db = await getDb();
  if (!db) return null;
  const safeData = { ...data, benefits: data.benefits || [] };
  const result = await db.insert(products).values(safeData);
  const id = Number((result as any).insertId || (result as any).lastInsertRowid);
  if (isNaN(id)) {
    console.error("[DB] Failed to extract insert ID:", result);
    return null;
  }
  return db.select().from(products).where(eq(products.id, id)).then(r => r[0] || null);
}

export async function updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(products).set(data).where(eq(products.id, id));
  return db.select().from(products).where(eq(products.id, id)).then(r => r[0] || null);
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(products).where(eq(products.id, id));
}

// ===== BANNERS =====
export async function getBanners(): Promise<Banner[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(banners);
}

export async function createBanner(data: InsertBanner): Promise<Banner | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(banners).values(data);
  const id = Number((result as any).insertId || (result as any).lastInsertRowid);
  if (isNaN(id)) {
    console.error("[DB] Failed to extract insert ID:", result);
    return null;
  }
  return db.select().from(banners).where(eq(banners.id, id)).then(r => r[0] || null);
}

export async function updateBanner(id: number, data: Partial<InsertBanner>): Promise<Banner | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(banners).set(data).where(eq(banners.id, id));
  return db.select().from(banners).where(eq(banners.id, id)).then(r => r[0] || null);
}

export async function deleteBanner(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(banners).where(eq(banners.id, id));
}

// ===== PEDIDOS =====
export async function getOrders(): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    // Use Drizzle ORM para gerenciar os nomes das colunas
    const result = await db.select().from(orders);
    return result;
  } catch (error) {
    console.error("[DB] Error fetching orders:", error);
    return [];
  }
}

export async function createOrder(data: InsertOrder): Promise<Order | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    // Use Drizzle ORM para inserir o pedido
    const result = await db.insert(orders).values({
      playerNick: data.playerNick,
      gameId: data.gameId,
      discordId: data.discordId,
      discord: data.discord,
      items: data.items,
      subtotal: data.subtotal,
      discount: data.discount,
      total: data.total,
      status: data.status || 'pending',
    });
    
    // Buscar o pedido criado (último)
    const orders_list = await db.select().from(orders).orderBy(desc(orders.id)).limit(1);
    
    if (orders_list.length > 0) {
      return orders_list[0];
    }
    
    return null;
  } catch (error) {
    console.error("[DB] Error creating order:", error);
    return null;
  }
}

export async function updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(orders).set(data).where(eq(orders.id, id));
  return db.select().from(orders).where(eq(orders.id, id)).then(r => r[0] || null);
}

// ===== CONTAS LOCAIS =====
export async function createLocalAccount(data: InsertLocalAccount): Promise<LocalAccount | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.insert(localAccounts).values(data);
    const header = Array.isArray(result) ? result[0] : result;
    const id = Number((header as any)?.insertId || (header as any)?.lastInsertRowid);
    if (isNaN(id)) {
      console.error("[DB] Failed to extract insert ID:", result);
      return null;
    }
    return db.select().from(localAccounts).where(eq(localAccounts.id, id)).then(r => r[0] || null);
  } catch (error) {
    console.error("[DB] Error creating local account:", error);
    return null;
  }
}

export async function getLocalAccountByEmail(email: string): Promise<LocalAccount | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }
  
  try {
    const result = await db.select().from(localAccounts).where(eq(localAccounts.email, email)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Error in getLocalAccountByEmail:", error);
    throw error;
  }
}

export async function getLocalAccountById(id: number): Promise<LocalAccount | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(localAccounts).where(eq(localAccounts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateLocalAccount(id: number, data: Partial<InsertLocalAccount>): Promise<LocalAccount | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(localAccounts).set(data).where(eq(localAccounts.id, id));
  return db.select().from(localAccounts).where(eq(localAccounts.id, id)).then(r => r[0] || null);
}

export async function getOrdersByGameId(gameId: string): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select().from(orders).where(eq(orders.gameId, gameId));
    return result;
  } catch (error) {
    console.error("[DB] Error fetching orders by gameId:", error);
    return [];
  }
}

export async function updateOrderStatus(orderId: number, status: string): Promise<Order | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId));
    const result = await db.select().from(orders).where(eq(orders.id, orderId));
    return result[0] || null;
  } catch (error) {
    console.error("[DB] Error updating order status:", error);
    return null;
  }
}

export async function updateUserProfile(userId: number, data: { name?: string; gameId?: string; characterName?: string; profilePicture?: string }): Promise<any> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.gameId) updateData.gameId = data.gameId;
    if (data.characterName) updateData.characterName = data.characterName;
    if (data.profilePicture) updateData.profilePicture = data.profilePicture;
    updateData.updatedAt = new Date();

    await db.update(users).set(updateData).where(eq(users.id, userId));
    
    const result = await db.select().from(users).where(eq(users.id, userId));
    return result[0] || null;
  } catch (error) {
    console.error("[DB] Error updating user profile:", error);
    throw error;
  }
}


// ===== ADMINS =====
export async function createAdmin(data: InsertAdmin): Promise<Admin | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.insert(admins).values(data);
    const header = Array.isArray(result) ? result[0] : result;
    const id = Number((header as any)?.insertId || (header as any)?.lastInsertRowid);
    if (isNaN(id)) {
      console.error("[DB] Failed to extract insert ID:", result);
      return null;
    }
    return db.select().from(admins).where(eq(admins.id, id)).then(r => r[0] || null);
  } catch (error) {
    console.error("[DB] Error creating admin:", error);
    return null;
  }
}

export async function getAdminByEmail(email: string): Promise<Admin | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Error in getAdminByEmail:", error);
    return null;
  }
}

export async function getAdminById(id: number): Promise<Admin | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Error in getAdminById:", error);
    return null;
  }
}

export async function updateAdminLastSignedIn(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.update(admins).set({ lastSignedIn: new Date() }).where(eq(admins.id, id));
  } catch (error) {
    console.error("[DB] Error updating admin lastSignedIn:", error);
  }
}

export async function updateAdminPassword(id: number, passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.update(admins).set({ passwordHash }).where(eq(admins.id, id));
  } catch (error) {
    console.error("[DB] Error updating admin password:", error);
  }
}

export async function updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(categories).set(data).where(eq(categories.id, id));
  return db.select().from(categories).where(eq(categories.id, id)).then(r => r[0] || null);
}


// Funções de movimento para reordenação
export async function moveCategoryUp(id: number): Promise<Category | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const category = await db.select().from(categories).where(eq(categories.id, id)).then(r => r[0]);
    if (!category) return null;
    
    const prevCategory = await db.select().from(categories)
      .where(lt(categories.order, category.order))
      .orderBy(desc(categories.order))
      .limit(1)
      .then(r => r[0]);
    
    if (!prevCategory) return category;
    
    // Trocar as ordens
    const tempOrder = category.order;
    await db.update(categories).set({ order: prevCategory.order }).where(eq(categories.id, id));
    await db.update(categories).set({ order: tempOrder }).where(eq(categories.id, prevCategory.id));
    
    return db.select().from(categories).where(eq(categories.id, id)).then(r => r[0] || null);
  } catch (error) {
    console.error("[DB] Error moving category up:", error);
    return null;
  }
}

export async function moveCategoryDown(id: number): Promise<Category | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const category = await db.select().from(categories).where(eq(categories.id, id)).then(r => r[0]);
    if (!category) return null;
    
    const nextCategory = await db.select().from(categories)
      .where(gt(categories.order, category.order))
      .orderBy(asc(categories.order))
      .limit(1)
      .then(r => r[0]);
    
    if (!nextCategory) return category;
    
    // Trocar as ordens
    const tempOrder = category.order;
    await db.update(categories).set({ order: nextCategory.order }).where(eq(categories.id, id));
    await db.update(categories).set({ order: tempOrder }).where(eq(categories.id, nextCategory.id));
    
    return db.select().from(categories).where(eq(categories.id, id)).then(r => r[0] || null);
  } catch (error) {
    console.error("[DB] Error moving category down:", error);
    return null;
  }
}

export async function moveProductUp(id: number): Promise<Product | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const product = await db.select().from(products).where(eq(products.id, id)).then(r => r[0]);
    if (!product) return null;
    
    const prevProduct = await db.select().from(products)
      .where(lt(products.order, product.order))
      .orderBy(desc(products.order))
      .limit(1)
      .then(r => r[0]);
    
    if (!prevProduct) return product;
    
    // Trocar as ordens
    const tempOrder = product.order;
    await db.update(products).set({ order: prevProduct.order }).where(eq(products.id, id));
    await db.update(products).set({ order: tempOrder }).where(eq(products.id, prevProduct.id));
    
    return db.select().from(products).where(eq(products.id, id)).then(r => r[0] || null);
  } catch (error) {
    console.error("[DB] Error moving product up:", error);
    return null;
  }
}

export async function moveProductDown(id: number): Promise<Product | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const product = await db.select().from(products).where(eq(products.id, id)).then(r => r[0]);
    if (!product) return null;
    
    const nextProduct = await db.select().from(products)
      .where(gt(products.order, product.order))
      .orderBy(asc(products.order))
      .limit(1)
      .then(r => r[0]);
    
    if (!nextProduct) return product;
    
    // Trocar as ordens
    const tempOrder = product.order;
    await db.update(products).set({ order: nextProduct.order }).where(eq(products.id, id));
    await db.update(products).set({ order: tempOrder }).where(eq(products.id, nextProduct.id));
    
    return db.select().from(products).where(eq(products.id, id)).then(r => r[0] || null);
  } catch (error) {
    console.error("[DB] Error moving product down:", error);
    return null;
  }
}

export async function moveBannerUp(id: number): Promise<Banner | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const banner = await db.select().from(banners).where(eq(banners.id, id)).then(r => r[0]);
    if (!banner) return null;
    
    const prevBanner = await db.select().from(banners)
      .where(lt(banners.order, banner.order))
      .orderBy(desc(banners.order))
      .limit(1)
      .then(r => r[0]);
    
    if (!prevBanner) return banner;
    
    // Trocar as ordens
    const tempOrder = banner.order;
    await db.update(banners).set({ order: prevBanner.order }).where(eq(banners.id, id));
    await db.update(banners).set({ order: tempOrder }).where(eq(banners.id, prevBanner.id));
    
    return db.select().from(banners).where(eq(banners.id, id)).then(r => r[0] || null);
  } catch (error) {
    console.error("[DB] Error moving banner up:", error);
    return null;
  }
}

export async function moveBannerDown(id: number): Promise<Banner | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const banner = await db.select().from(banners).where(eq(banners.id, id)).then(r => r[0]);
    if (!banner) return null;
    
    const nextBanner = await db.select().from(banners)
      .where(gt(banners.order, banner.order))
      .orderBy(asc(banners.order))
      .limit(1)
      .then(r => r[0]);
    
    if (!nextBanner) return banner;
    
    // Trocar as ordens
    const tempOrder = banner.order;
    await db.update(banners).set({ order: nextBanner.order }).where(eq(banners.id, id));
    await db.update(banners).set({ order: tempOrder }).where(eq(banners.id, nextBanner.id));
    
    return db.select().from(banners).where(eq(banners.id, id)).then(r => r[0] || null);
  } catch (error) {
    console.error("[DB] Error moving banner down:", error);
    return null;
  }
}


// Funções de configuração do site
export async function getSiteConfig(): Promise<SiteConfig | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.select().from(siteConfig).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Error getting site config:", error);
    return null;
  }
}

export async function updateSiteConfig(data: Partial<InsertSiteConfig>): Promise<SiteConfig | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const config = await db.select().from(siteConfig).limit(1);
    
    if (config.length > 0) {
      await db.update(siteConfig).set(data).where(eq(siteConfig.id, config[0].id));
    } else {
      await db.insert(siteConfig).values(data as InsertSiteConfig);
    }
    
    return db.select().from(siteConfig).limit(1).then(r => r[0] || null);
  } catch (error) {
    console.error("[DB] Error updating site config:", error);
    return null;
  }
}
