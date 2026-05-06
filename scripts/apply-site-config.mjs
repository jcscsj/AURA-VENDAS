import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loja_fivem',
});

try {
  console.log('[Database] Creating siteConfig table...');
  
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS siteConfig (
      id INT AUTO_INCREMENT PRIMARY KEY,
      heroTitle LONGTEXT,
      heroSubtitle LONGTEXT,
      heroDescription LONGTEXT,
      welcomeText LONGTEXT,
      catalogTitle VARCHAR(255),
      benefitsTitle VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )
  `);
  
  console.log('[Database] siteConfig table created successfully');
  
  // Inserir valores padrão
  await connection.execute(`
    INSERT IGNORE INTO siteConfig (heroTitle, heroSubtitle, heroDescription, welcomeText, catalogTitle, benefitsTitle)
    VALUES (
      'Eleve sua experiência no FiveM',
      'Bem-vindo à Aura City',
      'Descubra pacotes VIP, veículos premium, organizações e muito mais para sua jornada no servidor.',
      'Bem-vindo à Aura City',
      'Catálogo',
      'Benefícios'
    )
  `);
  
  console.log('[Database] Default values inserted');
  
} catch (error) {
  console.error('[Database] Error:', error.message);
} finally {
  await connection.end();
}
