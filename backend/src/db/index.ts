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
    const hasSslParam = Boolean(
      connectionString &&
      (connectionString.includes('sslmode=require') || connectionString.includes('ssl=true'))
    );
    const isLocalhost =
      !connectionString ||
      connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1');
    const isRemote = (!isLocalhost && Boolean(process.env.VERCEL || process.env.DATABASE_URL)) || hasSslParam;

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

    // Eagerly ensure schema is up-to-date
    ensureSchema().catch((err) => {
      console.warn('Initial ensureSchema notice:', err?.message);
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

      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS crop_name VARCHAR(255);
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payee VARCHAR(255);
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS paid_from_account VARCHAR(255);
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;

      ALTER TABLE income ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(255);
      ALTER TABLE income ADD COLUMN IF NOT EXISTS notes TEXT;

      INSERT INTO users (uid, full_name, email, password_hash, role, farm_name, location, phone, account_status, phone_verified, email_verified)
      VALUES 
      ('admin_krishna', 'Krishna Prasath', 'krishnaprasath720@gmail.com', '$2b$10$LqPnrPd7dON2hM72FIfTJu4MUP71Fgaht3Ue4WXi/vcLnxPtp9saW', 'admin', 'AgriTrack Central Command', 'Tamil Nadu, India', '+917418665001', 'active', true, true)
      ON CONFLICT (uid) DO UPDATE
      SET 
        role = 'admin',
        email = 'krishnaprasath720@gmail.com',
        account_status = 'active';
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
