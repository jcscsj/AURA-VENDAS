import { desc, eq, sql, lt, gt, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { ENV } from './_core/env';

const { users, categories, products, banners, orders, admins, localAccounts, siteConfig, coupons } = schema;
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
      INSERT INTO \`users\` 
      (\`openId\`, \`name\`, \`email\`, \`loginMethod\`, \`discordId\`, \`profilePicture\`, \`role\`, \`lastSignedIn\`)
      VALUES 
      (${data.openId}, ${data.name || ''}, ${data.email || ''}, 'discord', ${data.discordId || ''}, ${data.profilePicture || ''}, ${role}, NOW())
      ON DUPLICATE KEY UPDATE
      \`name\` = IF(VALUES(\`name\`) != '', VALUES(\`name\`), \`name\`),
      \`email\` = IF(VALUES(\`email\`) != '', VALUES(\`email\`), \`email\`),
      \`discordId\` = IF(VALUES(\`discordId\`) != '', VALUES(\`discordId\`), \`discordId\`),
      \`profilePicture\` = IF(VALUES(\`profilePicture\`) != '', VALUES(\`profilePicture\`), \`profilePicture\`),
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
    const last = await db.select().from(categories).orderBy(desc(categories.order)).limit(1).then((r:any) => r[0]);
    const nextOrder = last ? last.order + 1 : 1;
    
    // FATO TÉCNICO: Agora inserimos o nome E o tipo (catalog ou benefits)
    await db.execute(sql`
      INSERT INTO \`categories\` (\`name\`, \`type\`, \`order\`) 
      VALUES (${data.name}, ${data.type || 'catalog'}, ${nextOrder})
    `);
    
    const res = await db.select().from(categories).orderBy(desc(categories.id)).limit(1);
    return res[0] || null;
  } catch (e) { return null; }
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
  const db_i = await getDb(); if (!db_i) return null;
  try {
    const benefitsString = Array.isArray(data.benefits) ? JSON.stringify(data.benefits) : "[]";
    const showTagValue = data.showTag === false ? 0 : 1;

    await db_i.update(products)
      .set({
        name: data.name,
        categoryId: data.categoryId,
        description: data.description,
        price: data.price,
        oldPrice: data.oldPrice || null,
        image: data.image,
        tag: data.tag || 'Novo',
        showTag: showTagValue, // <--- GRAVA AQUI
        benefits: benefitsString,
        updatedAt: new Date()
      })
      .where(eq(products.id, id));

    return db_i.select().from(products).where(eq(products.id, id)).then(r => r[0]);
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
  const db_i = await getDb(); 
  if (!db_i) return [];
  try {
    // FATO TÉCNICO: SQL puro garante que pegamos e-mail e cpf mesmo que o Drizzle bugue
    const [rows] = await db_i.execute(sql`SELECT * FROM \`orders\` ORDER BY id DESC`);
    return rows as any[];
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return [];
  }
}

export async function createOrder(data: any) {
  const db_i = await getDb(); if (!db_i) return null;
  try {
    const itemsJson = JSON.stringify(data.items);
    // FATO TÉCNICO: Usamos as crases (`) para o TiDB não confundir os nomes das colunas
    await db_i.execute(sql`
      INSERT INTO \`orders\` 
      (\`playerNick\`, \`gameId\`, \`email\`, \`cpf\`, \`discord\`, \`discordId\`, \`items\`, \`subtotal\`, \`discount\`, \`total\`, \`status\`, \`createdAt\`) 
      VALUES 
      (${data.playerNick}, ${data.gameId}, ${data.email || null}, ${data.cpf || null}, ${data.discord}, ${data.discordId}, ${itemsJson}, ${data.subtotal}, ${data.discount}, ${data.total}, 'pending', NOW())
    `);
    
    const res = await db_i.select().from(orders).orderBy(desc(orders.id)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error("[DB Error] Erro ao criar pedido:", error);
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
  const db_i = await getDb(); if (!db_i) return null;
  try {
    // Convertemos o "true/false" do JavaScript para "1/0" do banco de dados
    const bannerStatus = data.couponBannerEnabled ? 1 : 0;
    
    await db_i.execute(sql`
      INSERT INTO \`siteConfig\` (id, heroTitle, heroDescription, couponBannerText, couponBannerEnabled) 
      VALUES (1, ${data.heroTitle || ''}, ${data.heroDescription || ''}, ${data.couponBannerText || ''}, ${bannerStatus}) 
      ON DUPLICATE KEY UPDATE 
      heroTitle = VALUES(heroTitle), 
      heroDescription = VALUES(heroDescription), 
      couponBannerText = VALUES(couponBannerText), 
      couponBannerEnabled = VALUES(couponBannerEnabled),
      updatedAt = NOW()
    `);
    return getSiteConfig();
  } catch (e) { return null; }
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

// ===== CUPONS =====
export async function getCoupons() {
  const db_i = await getDb(); if (!db_i) return [];
  return db_i.select().from(coupons).orderBy(desc(coupons.id));
}

export async function createCoupon(data: any) {
  const db_i = await getDb(); if (!db_i) return null;
  try {
    await db_i.execute(sql`
      INSERT INTO \`coupons\` (\`code\`, \`type\`, \`value\`, \`isActive\`) 
      VALUES (${data.code.toUpperCase()}, ${data.type}, ${data.value}, true)
    `);
    const res = await db_i.select().from(coupons).orderBy(desc(coupons.id)).limit(1);
    return res[0] || null;
  } catch (e) { return null; }
}

export async function deleteCoupon(id: number) {
  const db_i = await getDb(); if (!db_i) return;
  await db_i.delete(coupons).where(eq(coupons.id, id));
}

export async function getCouponByCode(code: string) {
  const db_i = await getDb(); if (!db_i) return null;
  const res = await db_i.select().from(coupons).where(eq(coupons.code, code.toUpperCase())).limit(1);
  return res[0] || null;
}

// ===== LOGS CONSOLE =====
export async function logSystem(message: string, type: string = 'info') {
  const db = await getDb();
  if (db) {
    await db.execute(sql`INSERT INTO \`system_logs\` (\`message\`, \`type\`) VALUES (${message}, ${type})`);
  }
}

// ===== FUNÇÃO PARA GERAR PAGAMENTO NA CAKTO =====
export async function createCaktoPayment(order: any) {
  try {
    // 1. OBTENÇÃO DO TOKEN (OAuth2)
    const authReq = await fetch("https://api.cakto.com.br/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: process.env.CAKTO_CLIENT_ID,
        client_secret: process.env.CAKTO_CLIENT_SECRET,
        grant_type: "client_credentials"
      })
    });

    if (!authReq.ok) {
      const err = await authReq.text();
      console.error("[Cakto Auth] Falha:", err);
      return null;
    }

    const { access_token } = await authReq.json();

    // 2. CRIAÇÃO DO PAGAMENTO PIX
    // FATO: A Cakto exige o valor como número decimal (ex: 10.50) e não centavos inteiros.
    const paymentReq = await fetch("https://api.cakto.com.br/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        external_id: order.id.toString(),
        amount: Number(order.total / 100), 
        description: `Aura City - Compra #${order.id}`,
        payment_method: "pix",
        customer: {
          name: order.playerNick,
          email: order.email,
          document: order.cpf?.replace(/\D/g, "")
        },
        webhook_url: `https://aura-shop-huf9.onrender.com/api/webhook/cakto`
      })
    });

    const data = await paymentReq.json();
    
    if (!paymentReq.ok) {
      console.error("[Cakto API Error]:", data);
      return null;
    }

    // Retorna os dados que o seu Checkout.tsx já está pronto para ler
    return {
      pix_code: data.pix_code,
      pix_qr_code: data.pix_qr_code
    };

  } catch (error) {
    console.error("[Cakto Fatal]:", error);
    return null;
  }
}
