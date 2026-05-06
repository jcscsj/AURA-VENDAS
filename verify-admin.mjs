import crypto from 'crypto';
import mysql from 'mysql2/promise';

const adminEmail = 'admin@auracity.com';
const adminPassword = 'Admin@123456';
const adminName = 'Administrador Aurora City';

const passwordHash = crypto.createHash('sha256').update(adminPassword).digest('hex');

console.log('Email:', adminEmail);
console.log('Senha:', adminPassword);
console.log('Hash:', passwordHash);

// Parse DATABASE_URL manualmente
const dbUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL:', dbUrl);

const urlParts = dbUrl.split('://')[1].split('@');
const credentials = urlParts[0].split(':');
const hostDb = urlParts[1].split('/');
const host = hostDb[0];
const dbParts = hostDb[1].split('?');
const database = dbParts[0];
const user = credentials[0];
const password = credentials[1];

console.log('Host:', host);
console.log('User:', user);
console.log('Database:', database);

const pool = mysql.createPool({
  host: host,
  user: user,
  password: password,
  database: database,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const conn = await pool.getConnection();
    
    // Deletar admin existente
    await conn.query('DELETE FROM admins WHERE email = ?', [adminEmail]);
    console.log('Admin antigo deletado');
    
    // Inserir novo admin
    const result = await conn.query(
      'INSERT INTO admins (email, passwordHash, name, isActive) VALUES (?, ?, ?, 1)',
      [adminEmail, passwordHash, adminName]
    );
    console.log('Admin criado com sucesso!');
    console.log('Insert ID:', result[0].insertId);
    
    // Verificar se foi criado
    const [rows] = await conn.query('SELECT * FROM admins WHERE email = ?', [adminEmail]);
    console.log('Admin encontrado:', rows[0]);
    
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
})();
