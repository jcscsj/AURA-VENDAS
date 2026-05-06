import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const email = 'admin@auracity.com';
const password = 'Admin@123456';
const hashedPassword = await bcrypt.hash(password, 10);

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await connection.execute(
    'INSERT INTO admins (email, passwordHash, name, isActive, createdAt, updatedAt) VALUES (?, ?, ?, 1, NOW(), NOW())',
    [email, hashedPassword, 'Administrador']
  );
  console.log('✅ Admin criado com sucesso!');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Senha: ${password}`);
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY') {
    console.log('⚠️ Admin já existe no banco de dados');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);
  } else {
    console.error('❌ Erro:', error.message);
  }
}

await connection.end();
