import crypto from 'crypto';
import mysql from 'mysql2/promise';

const adminEmail = 'admin@auracity.com';
const adminPassword = 'Admin@123456';
const adminName = 'Administrador Aurora City';

const passwordHash = crypto.createHash('sha256').update(adminPassword).digest('hex');

// Parse DATABASE_URL manualmente
const dbUrl = process.env.DATABASE_URL;
const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
if (!match) {
  console.error('DATABASE_URL inválida');
  process.exit(1);
}

const [, user, password, host, database] = match;

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
    
    // Verificar se já existe
    const [rows] = await conn.query('SELECT * FROM admins WHERE email = ?', [adminEmail]);
    
    if (rows.length > 0) {
      console.log('Conta de ADM já existe!');
      console.log('Email: ' + adminEmail);
      console.log('Senha: ' + adminPassword);
    } else {
      // Inserir novo admin
      await conn.query(
        'INSERT INTO admins (email, passwordHash, name, isActive) VALUES (?, ?, ?, 1)',
        [adminEmail, passwordHash, adminName]
      );
      console.log('Conta de ADM criada com sucesso!');
      console.log('Email: ' + adminEmail);
      console.log('Senha: ' + adminPassword);
    }
    
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
