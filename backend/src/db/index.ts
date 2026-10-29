import { Pool, QueryResult, QueryResultRow } from 'pg';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('verbatim');
} catch {
  // Ignore in environments where not supported
}

export const isPostgresConfigured = (): boolean => {
  return Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    (process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER)
  );
};

let pool: Pool | null = null;
let schemaInitialized = false;

export function getPool(): Pool | null {
  if (!isPostgresConfigured()) {
    return null;
  }

  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL;
    const isLocalhost =
      !connectionString ||
      connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1');
    const isRemote =
      !isLocalhost ||
      process.env.NODE_ENV === 'production' ||
      Boolean(process.env.VERCEL);

    pool = new Pool({
      connectionString: connectionString || undefined,
      host: process.env.PGHOST,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      max: process.env.VERCEL ? 3 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client pool:', err);
    });
  }

  return pool;
}

export async function ensureSchema(): Promise<void> {
  if (schemaInitialized) return;
  const p = getPool();
  if (!p) return;

  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        uid VARCHAR(64) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin')),
        farm_name VARCHAR(255),
        location VARCHAR(255),
        phone VARCHAR(64),
        account_status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'deactivated')),
        phone_verified BOOLEAN NOT NULL DEFAULT false,
        email_verified BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
      ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

      CREATE TABLE IF NOT EXISTS otp_verifications (
        verification_id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        expires_at TIMESTAMPTZ NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON otp_verifications(LOWER(email));

      INSERT INTO users (uid, full_name, email, password_hash, role, farm_name, location, phone, account_status)
      VALUES 
      ('admin_krishna', 'Krishna Prasath', 'krishnaprasath720@gmail.com', '$2b$10$LqPnrPd7dON2hM72FIfTJu4MUP71Fgaht3Ue4WXi/vcLnxPtp9saW', 'admin', 'AgriTrack Central Command', 'Tamil Nadu, India', '+91 98765 00001', 'active'),
      ('demo_farmer_1', 'Rajesh Kumar', 'farmer@agritrack.com', '$2a$10$w09Zl/GgP7bK5hDq4yTveO8B8Ufq8r0JbXbYvJ5Y6a7h.ZfS3i96K', 'farmer', 'Green Valley Agro Farm', 'Ludhiana, Punjab', '+91 98765 43210', 'active'),
      ('demo_admin_1', 'Dr. Anita Sharma', 'admin@agritrack.com', '$2a$10$w09Zl/GgP7bK5hDq4yTveO8B8Ufq8r0JbXbYvJ5Y6a7h.ZfS3i96K', 'admin', 'Agri Advisory Center', 'New Delhi, India', '+91 98111 22334', 'active'),
      ('demo_farmer_2', 'Suresh Patel', 'suresh@patelfarms.in', '$2a$10$w09Zl/GgP7bK5hDq4yTveO8B8Ufq8r0JbXbYvJ5Y6a7h.ZfS3i96K', 'farmer', 'Patel Organic Acres', 'Anand, Gujarat', '+91 97234 56789', 'active'),
      ('demo_farmer_3', 'Rameshwar Reddy', 'reddy@deccanfarms.com', '$2a$10$w09Zl/GgP7bK5hDq4yTveO8B8Ufq8r0JbXbYvJ5Y6a7h.ZfS3i96K', 'farmer', 'Deccan Agri Estate', 'Warangal, Telangana', '+91 94401 23456', 'deactivated'),
      ('usr_1792576184706_5x42rwh', 'NITHESH', 'nitheshmurugesan28@gmail.com', '$2b$10$LF7UzRI6OlMsu0HUQpGXvOBTM4Um74m6oGPzx7ttxTgzM9LsEI3QO', 'farmer', 'demo', '', '8056396199', 'active')
      ON CONFLICT (uid) DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `);

    schemaInitialized = true;
  } catch (err: any) {
    console.warn('PostgreSQL ensureSchema notice:', err.message);
  }
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const p = getPool();
  if (!p) {
    throw new Error('PostgreSQL is not configured. Please set DATABASE_URL in .env.local');
  }
  try {
    return await p.query<T>(text, params);
  } catch (err: any) {
    if (err.code === '42P01') {
      await ensureSchema();
      return await p.query<T>(text, params);
    }
    throw err;
  }
}

export async function testConnection(): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  try {
    const res = await p.query('SELECT 1 as test');
    return res.rows.length > 0;
  } catch (err) {
    console.warn('PostgreSQL testConnection error:', err);
    return false;
  }
}
