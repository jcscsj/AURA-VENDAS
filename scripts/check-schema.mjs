import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await connection.execute('DESCRIBE admins');
console.log('Estrutura da tabela admins:');
rows.forEach(row => console.log(`  ${row.Field}: ${row.Type}`));

await connection.end();
