import bcrypt from 'bcrypt';
import pg from 'pg';

const { Pool } = pg;

async function seedAdmin() {
  const pool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    database: 'operisagent', 
    user: 'postgres',
    password: '',
  });

  const email = 'admin@operis.vn';
  const password = 'admin123';
  const name = 'Admin User';
  
  const hash = await bcrypt.hash(password, 12);
  
  const query = `
    INSERT INTO users (id, email, password_hash, name, role, token_balance, is_active)
    VALUES (gen_random_uuid(), $1, $2, $3, 'admin', 10000000, true)
    ON CONFLICT (email) DO UPDATE SET 
      password_hash = $2,
      role = 'admin',
      token_balance = 10000000
    RETURNING id, email, role, token_balance;
  `;
  
  const result = await pool.query(query, [email, hash, name]);
  console.log('✅ Admin user created:');
  console.log(JSON.stringify(result.rows[0], null, 2));
  
  await pool.end();
}

seedAdmin().catch(console.error);
