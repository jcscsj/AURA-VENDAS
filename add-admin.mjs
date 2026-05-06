import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop() || 'loja_fivem',
});

const email = 'admin@auracity.com';
const password = 'Admin@123456';
const hashedPassword = await bcrypt.hash(password, 10);

try {
  await connection.execute(
    'INSERT INTO admins (email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
    [email, hashedPassword, 'Administrador']
  );
  console.log('✅ Admin criado com sucesso!');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Senha: ${password}`);
} catch (error) {
  console.error('❌ Erro ao criar admin:', error.message);
}

await connection.end();
