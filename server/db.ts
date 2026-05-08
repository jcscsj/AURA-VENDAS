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
  const db = await getDb(); if (!db) return[];
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

// ===== CATEGORIAS (INSERÇÃO BLINDADA) =====
export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  // FATO TÉCNICO: Sem o .orderBy, o banco retorna por ordem de ID, ignorando as setas.
  return db.select().from(categories).orderBy(asc(categories.order));
}
export async function createCategory(data: any) {
  const db = await getDb();
  if (!db) return null;
  try {
    // Busca a maior ordem atual
    const lastCategory = await db.select().from(categories).orderBy(desc(categories.order)).limit(1).then(r => r[0]);
    const nextOrder = lastCategory ? lastCategory.order + 1 : 1;

    // Insere com a próxima ordem disponível
    await db.execute(sql`INSERT INTO \`categories\` (\`name\`, \`order\`) VALUES (${data.name}, ${nextOrder})`);
    
    const res = await db.select().from(categories).orderBy(desc(categories.id)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return null;
  }
}
export async function updateCategory(id: number, data: any) {
  const db = await getDb(); if (!db) return null;
  await db.update(categories).set({ name: data.name }).where(eq(categories.id, id));
  return db.select().from(categories).where(eq(categories.id, id)).then(r => r[0]);
}

export async function deleteCategory(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(categories).where(eq(categories.id, id));
}

// ===== PRODUTOS (INSERÇÃO BLINDADA) =====
export async function getProducts() {
  const db = await getDb(); 
  if (!db) return [];
  const res = await db.select().from(products).orderBy(asc(products.order));
  
  // FATO TÉCNICO: Convertemos o texto do banco de volta para Lista (Array)
  return res.map(p => ({
    ...p,
    benefits: typeof p.benefits === 'string' ? JSON.parse(p.benefits) : (p.benefits || [])
  }));
}

export async function createProduct(data: any) {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.execute(sql`
      INSERT INTO \`products\` 
      (\`name\`, \`categoryId\`, \`description\`, \`price\`, \`image\`, \`tag\`, \`rarity\`, \`order\`) 
      VALUES 
      (${data.name}, ${data.categoryId}, ${data.description || ''}, ${data.price}, ${data.image || ''}, 'Novo', 'Premium', 0)
    `);
    
    const res = await db.select().from(products).orderBy(desc(products.id)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return null;
  }
}
export async function updateProduct(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  try {
    // Transformamos a lista em texto para o MySQL aceitar
    const benefitsString = Array.isArray(data.benefits) ? JSON.stringify(data.benefits) : "[]";

    await db.update(products)
      .set({
        name: data.name,
        categoryId: data.categoryId,
        description: data.description,
        price: data.price,
        oldPrice: data.oldPrice || null,
        image: data.image,
        benefits: benefitsString,
        updatedAt: new Date()
      })
      .where(eq(products.id, id));

    return db.select().from(products).where(eq(products.id, id)).then(r => r[0]);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return null;
  }
}

export async function deleteProduct(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(products).where(eq(products.id, id));
}

// ===== BANNERS (INSERÇÃO BLINDADA) =====
export async function getBanners() {
  const db = await getDb(); if (!db) return[];
  return db.select().from(banners);
}

export async function createBanner(data: any) {
  const db = await getDb(); if (!db) return null;
  await db.insert(banners).values({ title: data.title, imageUrl: data.imageUrl });
  return db.select().from(banners).orderBy(desc(banners.id)).limit(1).then(r => r[0]);
}

export async function updateBanner(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.update(banners)
      .set({
        title: data.title,
        imageUrl: data.imageUrl,
        updatedAt: new Date()
      })
      .where(eq(banners.id, id));

    return db.select().from(banners).where(eq(banners.id, id)).then(r => r[0]);
  } catch (error) {
    console.error("Erro ao atualizar banner:", error);
    return null;
  }
}
export async function deleteBanner(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(banners).where(eq(banners.id, id));
}

// ===== PEDIDOS (ORDERS) =====
export async function getOrders() {
  const db = await getDb(); if (!db) return[];
  return db.select().from(orders);
}

export async function createOrder(data: any) {
  const db = await getDb();
  if (!db) return null;
  try {
    const itemsJson = JSON.stringify(data.items);
    // Inserção direta para garantir que todos os campos sejam preenchidos
    await db.execute(sql`
      INSERT INTO \`orders\` 
      (\`playerNick\`, \`gameId\`, \`discord\`, \`discordId\`, \`items\`, \`subtotal\`, \`discount\`, \`total\`, \`status\`, \`createdAt\`) 
      VALUES 
      (${data.playerNick}, ${data.gameId}, ${data.discord || 'Não informado'}, ${data.discordId || ''}, ${itemsJson}, ${data.subtotal}, ${data.discount}, ${data.total}, 'pending', NOW())
    `);
    
    const res = await db.select().from(orders).orderBy(desc(orders.id)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error("Erro ao salvar pedido:", error);
    return null;
  }
}

export async function updateOrderStatus(id: number, status: string) {
  const db = await getDb(); if (!db) return null;
  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id));
  return db.select().from(orders).where(eq(orders.id, id)).then(r => r[0]);
}

export async function getOrdersByGameId(gameId: string) {
  const db = await getDb(); if (!db) return[];
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
  const db = await getDb(); 
  if (!db) return null;
  try {
    // FATO TÉCNICO: Usamos SQL puro para garantir que ele SEMPRE atualize a linha 1
    await db.execute(sql`
      INSERT INTO \`siteConfig\` (id, heroTitle, heroSubtitle, heroDescription) 
      VALUES (1, ${data.heroTitle || ''}, ${data.heroSubtitle || ''}, ${data.heroDescription || ''}) 
      ON DUPLICATE KEY UPDATE 
      heroTitle = VALUES(heroTitle), 
      heroSubtitle = VALUES(heroSubtitle), 
      heroDescription = VALUES(heroDescription), 
      updatedAt = NOW()
    `);
    return getSiteConfig();
  } catch (error) {
    console.error("Erro ao salvar config:", error);
    return null;
  }
}

export async function moveCategoryUp(id: number) {
  const db = await getDb(); if (!db) return null;
  try {
    const current = await db.select().from(categories).where(eq(categories.id, id)).then(r => r[0]);
    if (!current) return null;

    const prev = await db.select().from(categories)
      .where(lt(categories.order, current.order))
      .orderBy(desc(categories.order)).limit(1).then(r => r[0]);

    if (prev) {
      // Troca os valores usando SQL Direto para não ter erro
      await db.execute(sql`UPDATE \`categories\` SET \`order\` = ${prev.order} WHERE \`id\` = ${current.id}`);
      await db.execute(sql`UPDATE \`categories\` SET \`order\` = ${current.order} WHERE \`id\` = ${prev.id}`);
    }
    return current;
  } catch (e) { return null; }
}
export async function moveCategoryDown(id: number) {
  const db = await getDb(); if (!db) return null;
  try {
    const current = await db.select().from(categories).where(eq(categories.id, id)).then(r => r[0]);
    if (!current) return null;

    const next = await db.select().from(categories)
      .where(gt(categories.order, current.order))
      .orderBy(asc(categories.order)).limit(1).then(r => r[0]);

    if (next) {
      await db.execute(sql`UPDATE \`categories\` SET \`order\` = ${next.order} WHERE \`id\` = ${current.id}`);
      await db.execute(sql`UPDATE \`categories\` SET \`order\` = ${current.order} WHERE \`id\` = ${next.id}`);
    }
    return current;
  } catch (e) { return null; }
}
export async function moveProductUp(id: number) { return null; }
export async function moveProductDown(id: number) { return null; }
export async function moveBannerUp(id: number) { return null; }
export async function moveBannerDown(id: number) { return null; }
export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, id));
}

// ===== LOGS CONSOLE =====
export async function logSystem(message: string, type: string = 'info') {
  const db = await getDb();
  if (db) {
    await db.execute(sql`INSERT INTO \`system_logs\` (\`message\`, \`type\`) VALUES (${message}, ${type})`);
  }
}
