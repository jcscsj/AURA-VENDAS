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
  const db_instance = await getDb();
  if (!db_instance || !data.openId) return;

  try {
    const role = data.openId === ENV.ownerOpenId ? 'admin' : 'user';
    
    // FATO TÉCNICO: Usamos IF(VALUES(`coluna`) != '', ...)
    // Isso protege seus dados. Se o 'name' novo vier vazio, o banco mantém o antigo.
    await db_instance.execute(sql`
      INSERT INTO \`users\` (\`openId\`, \`name\`, \`email\`, \`loginMethod\`, \`discordId\`, \`role\`, \`lastSignedIn\`)
      VALUES (${data.openId}, ${data.name || ''}, ${data.email || ''}, 'discord', ${data.discordId || ''}, ${role}, NOW())
      ON DUPLICATE KEY UPDATE
      \`name\` = IF(VALUES(\`name\`) != '', VALUES(\`name\`), \`name\`),
      \`email\` = IF(VALUES(\`email\`) != '', VALUES(\`email\`), \`email\`),
      \`discordId\` = IF(VALUES(\`discordId\`) != '', VALUES(\`discordId\`), \`discordId\`),
      \`lastSignedIn\` = NOW()
    `);
    
    console.log(`[DB] Usuário ${data.openId} sincronizado com proteção de dados.`);
  } catch (error) {
    console.error("[DB Error] Erro no upsertUser:", error);
  }
}
export async function getUserByOpenId(openId: string) {
  const db_instance = await getDb();
  if (!db_instance) return undefined;
  
  try {
    // FATO TÉCNICO: Usamos SQL puro para garantir que a busca pelo openId (ex: discord_4544...) funcione
    const [rows] = await db_instance.execute(sql`SELECT * FROM \`users\` WHERE \`openId\` = ${openId} LIMIT 1`);
    const users_list = rows as any[];
    
    return users_list.length > 0 ? users_list[0] : undefined;
  } catch (error) {
    console.error("[DB Error] Erro ao buscar usuário por openId:", error);
    return undefined;
  }
}

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb(); if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Garante que estamos salvando os nomes corretos das colunas
    await db.update(users)
      .set({
        name: data.name,
        gameId: data.gameId,          // ID do FiveM
        characterName: data.characterName, // Nome do Personagem
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    const result = await db.select().from(users).where(eq(users.id, userId));
    return result[0] || null;
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    throw error;
  }
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
  const db_i = await getDb(); if (!db_i) return [];
  return db_i.select().from(banners).orderBy(asc(banners.order));
}

// CRIAR BANNER
export async function createBanner(data: any) {
  const db_i = await getDb(); if (!db_i) return null;
  try {
    const last = await db_i.select().from(banners).orderBy(desc(banners.order)).limit(1).then((r:any) => r[0]);
    const nextOrder = last ? last.order + 1 : 1;
    await db_i.execute(sql`INSERT INTO \`banners\` (\`title\`, \`imageUrl\`, \`link\`, \`order\`) VALUES (${data.title || ''}, ${data.imageUrl}, ${data.link || ''}, ${nextOrder})`);
    return db_i.select().from(banners).orderBy(desc(banners.id)).limit(1).then((r:any) => r[0]);
  } catch (e) { return null; }
}

// EXCLUIR BANNER
export async function deleteBanner(id: number) {
  const db_i = await getDb();
  if (!db_i) return;
  try {
    await db_i.delete(banners).where(eq(banners.id, id));
    console.log(`[DB] Banner ${id} removido com sucesso.`);
  } catch (error) {
    console.error("[DB Error] Erro ao deletar banner:", error);
  }
}

// ATUALIZAR BANNER
export async function updateBanner(id: number, data: any) {
  const db_i = await getDb(); if (!db_i) return null;
  try {
    await db_i.execute(sql`UPDATE \`banners\` SET \`title\` = ${data.title || ''}, \`imageUrl\` = ${data.imageUrl}, \`link\` = ${data.link || ''}, \`updatedAt\` = NOW() WHERE \`id\` = ${id}`);
    return db_i.select().from(banners).where(eq(banners.id, id)).then((r:any) => r[0]);
  } catch (e) { return null; }
}
// ===== PEDIDOS (ORDERS) =====
export async function getOrders() {
  const db = await getDb(); if (!db) return[];
  return db.select().from(orders);
}

export async function createOrder(data: any) {
  const db_instance = await getDb();
  if (!db_instance) return null;
  try {
    const itemsJson = JSON.stringify(data.items);
    // FATO TÉCNICO: Gravamos o discord e o discordId exatamente como chegam
    await db_instance.execute(sql`
      INSERT INTO \`orders\` 
      (\`playerNick\`, \`gameId\`, \`discord\`, \`discordId\`, \`items\`, \`subtotal\`, \`discount\`, \`total\`, \`status\`, \`createdAt\`) 
      VALUES 
      (${data.playerNick}, ${data.gameId}, ${data.discord}, ${data.discordId}, ${itemsJson}, ${data.subtotal}, ${data.discount}, ${data.total}, 'pending', NOW())
    `);
    
    const res = await db_instance.select().from(orders).orderBy(desc(orders.id)).limit(1);
    return res[0] || null;
  } catch (error) {
    // Escreve o erro direto no console do seu site para você ler!
    await logSystem(`ERRO NO BANCO: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    return null;
  }
}

export async function deleteOrder(id: number) {
  const db_instance = await getDb();
  if (!db_instance) return;
  try {
    await db_instance.delete(orders).where(eq(orders.id, id));
  } catch (error) {
    console.error("Erro ao deletar pedido no banco:", error);
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

// === MOVER PRODUTOS ===
export async function moveProductUp(id: number) {
  const db_i = await getDb(); if (!db_i) return null;
  const curr = await db_i.select().from(products).where(eq(products.id, id)).then((r:any) => r[0]);
  if (!curr) return null;
  const prev = await db_i.select().from(products).where(lt(products.order, curr.order)).orderBy(desc(products.order)).limit(1).then((r:any) => r[0]);
  if (prev) {
    await db_i.execute(sql`UPDATE \`products\` SET \`order\` = ${prev.order} WHERE \`id\` = ${curr.id}`);
    await db_i.execute(sql`UPDATE \`products\` SET \`order\` = ${curr.order} WHERE \`id\` = ${prev.id}`);
  }
  return curr;
}
export async function moveProductDown(id: number) {
  const db_i = await getDb(); if (!db_i) return null;
  const curr = await db_i.select().from(products).where(eq(products.id, id)).then((r:any) => r[0]);
  if (!curr) return null;
  const next = await db_i.select().from(products).where(gt(products.order, curr.order)).orderBy(asc(products.order)).limit(1).then((r:any) => r[0]);
  if (next) {
    await db_i.execute(sql`UPDATE \`products\` SET \`order\` = ${next.order} WHERE \`id\` = ${curr.id}`);
    await db_i.execute(sql`UPDATE \`products\` SET \`order\` = ${curr.order} WHERE \`id\` = ${next.id}`);
  }
  return curr;
}

// === MOVER BANNERS ===
export async function moveBannerUp(id: number) {
  const db_i = await getDb(); if (!db_i) return null;
  const curr = await db_i.select().from(banners).where(eq(banners.id, id)).then((r:any) => r[0]);
  if (!curr) return null;
  const prev = await db_i.select().from(banners).where(lt(banners.order, curr.order)).orderBy(desc(banners.order)).limit(1).then((r:any) => r[0]);
  if (prev) {
    await db_i.execute(sql`UPDATE \`banners\` SET \`order\` = ${prev.order} WHERE \`id\` = ${curr.id}`);
    await db_i.execute(sql`UPDATE \`banners\` SET \`order\` = ${curr.order} WHERE \`id\` = ${prev.id}`);
  }
  return curr;
}
export async function moveBannerDown(id: number) {
  const db_i = await getDb(); if (!db_i) return null;
  const curr = await db_i.select().from(banners).where(eq(banners.id, id)).then((r:any) => r[0]);
  if (!curr) return null;
  const next = await db_i.select().from(banners).where(gt(banners.order, curr.order)).orderBy(asc(banners.order)).limit(1).then((r:any) => r[0]);
  if (next) {
    await db_i.execute(sql`UPDATE \`banners\` SET \`order\` = ${next.order} WHERE \`id\` = ${curr.id}`);
    await db_i.execute(sql`UPDATE \`banners\` SET \`order\` = ${curr.order} WHERE \`id\` = ${next.id}`);
  }
  return curr;
}
// ===== DELETAR USUÁRIO =====
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
