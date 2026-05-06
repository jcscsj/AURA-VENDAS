import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('Aplicando migração...');
  
  await connection.execute('ALTER TABLE `banners` ADD `order` int DEFAULT 0 NOT NULL');
  console.log('✓ Coluna order adicionada à tabela banners');
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') {
    console.log('✓ Coluna order já existe em banners');
  } else {
    console.error('Erro em banners:', e.message);
  }
}

try {
  await connection.execute('ALTER TABLE `categories` ADD `order` int DEFAULT 0 NOT NULL');
  console.log('✓ Coluna order adicionada à tabela categories');
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') {
    console.log('✓ Coluna order já existe em categories');
  } else {
    console.error('Erro em categories:', e.message);
  }
}

try {
  await connection.execute('ALTER TABLE `products` ADD `order` int DEFAULT 0 NOT NULL');
  console.log('✓ Coluna order adicionada à tabela products');
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') {
    console.log('✓ Coluna order já existe em products');
  } else {
    console.error('Erro em products:', e.message);
  }
}

await connection.end();
console.log('Migração concluída!');
