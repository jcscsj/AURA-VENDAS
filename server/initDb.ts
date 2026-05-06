import { getDb } from "./db";

export async function initializeDatabase() {
  const db = await getDb();
  if (!db) {
    console.log("[Database] Skipping initialization - database not available");
    return;
  }

  try {
    // Verificar se tabelas já existem
    const tables = await (db as any).execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()"
    );

    const tableNames = (tables as any[]).map((t: any) => t.TABLE_NAME);

    if (!tableNames.includes("categories")) {
      console.log("[Database] Creating categories table...");
      await (db as any).execute(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255),
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    }

    if (!tableNames.includes("products")) {
      console.log("[Database] Creating products table...");
      await (db as any).execute(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255),
          categoryId INT,
          description LONGTEXT,
          price INT,
          oldPrice INT,
          image VARCHAR(512),
          tag VARCHAR(100),
          rarity VARCHAR(50),
          benefits JSON,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    }

    if (!tableNames.includes("banners")) {
      console.log("[Database] Creating banners table...");
      await (db as any).execute(`
        CREATE TABLE IF NOT EXISTS banners (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255),
          imageUrl VARCHAR(512),
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    }

    if (!tableNames.includes("orders")) {
      console.log("[Database] Creating orders table...");
      await (db as any).execute(`
        CREATE TABLE IF NOT EXISTS orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          playerNick VARCHAR(255),
          \`gameId\` VARCHAR(50),
          \`discordId\` VARCHAR(64),
          discord VARCHAR(255),
          items JSON,
          subtotal INT,
          discount INT,
          total INT,
          status VARCHAR(50),
          \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    } else {
      // Se tabela já existe, tentar recriar com estrutura correta
      try {
        console.log("[Database] Checking orders table structure...");
        const columns = await (db as any).execute(`
          SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'orders' AND TABLE_SCHEMA = DATABASE()
        `);
        const columnNames = (columns as any[]).map((c: any) => c.COLUMN_NAME);
        
        // Se faltam colunas, recriar tabela
        if (!columnNames.includes("gameId") || !columnNames.includes("discordId")) {
          console.log("[Database] Recreating orders table with new structure...");
          await (db as any).execute(`DROP TABLE IF EXISTS orders`);
          await (db as any).execute(`
            CREATE TABLE orders (
              id INT AUTO_INCREMENT PRIMARY KEY,
              playerNick VARCHAR(255),
              \`gameId\` VARCHAR(50),
              \`discordId\` VARCHAR(64),
              discord VARCHAR(255),
              items JSON,
              subtotal INT,
              discount INT,
              total INT,
              status VARCHAR(50),
              \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              \`updatedAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
          `);
        }
      } catch (e) {
        console.log("[Database] Error checking orders table:", e);
      }
    }

    if (!tableNames.includes("discordUsers")) {
      console.log("[Database] Creating discordUsers table...");
      await (db as any).execute(`
        CREATE TABLE IF NOT EXISTS discordUsers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT,
          discordId VARCHAR(64) NOT NULL UNIQUE,
          discordUsername VARCHAR(255),
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    if (!tableNames.includes("localAccounts")) {
      console.log("[Database] Creating localAccounts table...");
      await (db as any).execute(`
        CREATE TABLE IF NOT EXISTS localAccounts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(320) NOT NULL UNIQUE,
          passwordHash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          gameId VARCHAR(50) NOT NULL,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          lastSignedIn TIMESTAMP
        )
      `);
    }

    if (!tableNames.includes("admins")) {
      console.log("[Database] Creating admins table...");
      await (db as any).execute(`
        CREATE TABLE IF NOT EXISTS admins (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(320) NOT NULL UNIQUE,
          passwordHash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          isActive BOOLEAN DEFAULT 1,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          lastSignedIn TIMESTAMP
        )
      `);
    }

    // Adicionar novos campos aos users se não existirem
    try {
      const userColumns = await (db as any).execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = DATABASE()
      `);
      const columnNames = (userColumns as any[]).map((c: any) => c.COLUMN_NAME);
      
      if (!columnNames.includes("discordId")) {
        console.log("[Database] Adding discordId column to users...");
        await (db as any).execute(`ALTER TABLE users ADD COLUMN discordId VARCHAR(64)`);
      }
      
      if (!columnNames.includes("gameId")) {
        console.log("[Database] Adding gameId column to users...");
        await (db as any).execute(`ALTER TABLE users ADD COLUMN gameId VARCHAR(50)`);
      }
    } catch (e) {
      console.log("[Database] Columns already exist or error checking columns");
    }

    console.log("[Database] Initialization complete");
  } catch (error) {
    console.error("[Database] Initialization error:", error);
  }
}

// Função para atualizar Discord ID do usuário
export async function updateUserDiscordId(userId: number, discordId: string, discordUsername: string) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await (db as any).execute(
      `UPDATE users SET discordId = ? WHERE id = ?`,
      [discordId, userId]
    );
    
    // Salvar na tabela discordUsers também
    await (db as any).execute(
      `INSERT INTO discordUsers (userId, discordId, discordUsername) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE userId = ?`,
      [userId, discordId, discordUsername, userId]
    );
  } catch (error) {
    console.error("[Database] Error updating Discord ID:", error);
  }
}

// Função para atualizar Game ID do usuário
export async function updateUserGameId(userId: number, gameId: string) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await (db as any).execute(
      `UPDATE users SET gameId = ? WHERE id = ?`,
      [gameId, userId]
    );
  } catch (error) {
    console.error("[Database] Error updating Game ID:", error);
  }
}
