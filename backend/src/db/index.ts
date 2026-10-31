import { Pool, QueryResult, QueryResultRow } from 'pg';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('verbatim');
} catch {
  // Ignore in environments where not supported
}

export function getEffectiveConnectionString(): string | undefined {
  return (
    process.env.DATABASE_URL_DATABASE_URL ||
    process.env.DATABASE_URL_POSTGRES_URL ||
    process.env.DATABASE_URL_POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    undefined
  );
}

export const isPostgresConfigured = (): boolean => {
  if (getEffectiveConnectionString()) {
    return true;
  }
  const host = process.env.DATABASE_URL_PGHOST || process.env.DATABASE_URL_POSTGRES_HOST || process.env.PGHOST;
  const database = process.env.DATABASE_URL_PGDATABASE || process.env.DATABASE_URL_POSTGRES_DATABASE || process.env.PGDATABASE;
  const user = process.env.DATABASE_URL_PGUSER || process.env.DATABASE_URL_POSTGRES_USER || process.env.PGUSER;
  return Boolean(host && database && user);
};

let pool: Pool | null = null;
let schemaInitialized = false;

export function getPool(): Pool | null {
  if (!isPostgresConfigured()) {
    return null;
  }

  if (!pool) {
    const connectionString = getEffectiveConnectionString();
    const host = process.env.DATABASE_URL_PGHOST || process.env.DATABASE_URL_POSTGRES_HOST || process.env.PGHOST;
    const database = process.env.DATABASE_URL_PGDATABASE || process.env.DATABASE_URL_POSTGRES_DATABASE || process.env.PGDATABASE;
    const user = process.env.DATABASE_URL_PGUSER || process.env.DATABASE_URL_POSTGRES_USER || process.env.PGUSER;
    const password = process.env.DATABASE_URL_PGPASSWORD || process.env.DATABASE_URL_POSTGRES_PASSWORD || process.env.PGPASSWORD;
    const portStr = process.env.DATABASE_URL_PGPORT || process.env.PGPORT;
    const port = portStr ? parseInt(portStr, 10) : 5432;

    const hasSslParam = Boolean(
      connectionString &&
      (connectionString.includes('sslmode=require') || connectionString.includes('ssl=true') || connectionString.includes('neon.tech') || connectionString.includes('supabase.co'))
    );
    const isLocalhost =
      !connectionString ||
      connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1');
    const isRemote = (!isLocalhost && Boolean(process.env.VERCEL || connectionString)) || hasSslParam;

    pool = new Pool({
      connectionString: connectionString || undefined,
      host: connectionString ? undefined : host,
      port: connectionString ? undefined : port,
      database: connectionString ? undefined : database,
      user: connectionString ? undefined : user,
      password: connectionString ? undefined : password,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      max: process.env.VERCEL ? 3 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client pool:', err);
    });

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

      CREATE TABLE IF NOT EXISTS crop_cycles (
        crop_cycle_id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        crop_type VARCHAR(255) NOT NULL,
        farm_name VARCHAR(255),
        land_area NUMERIC(10, 2),
        land_area_unit VARCHAR(32) DEFAULT 'Acres',
        seeding_date DATE NOT NULL,
        expected_harvest_date DATE NOT NULL,
        actual_harvest_date DATE,
        status VARCHAR(32) NOT NULL DEFAULT 'Growing',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses (
        expense_id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        crop_cycle_id VARCHAR(64) REFERENCES crop_cycles(crop_cycle_id) ON DELETE SET NULL,
        type VARCHAR(64) NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        duration VARCHAR(128),
        labour_count INTEGER,
        expense_date DATE NOT NULL,
        crop_name VARCHAR(255),
        payee VARCHAR(255),
        paid_from_account VARCHAR(255),
        notes TEXT,
        receipt_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS crop_name VARCHAR(255);
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payee VARCHAR(255);
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS paid_from_account VARCHAR(255);
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;

      CREATE TABLE IF NOT EXISTS income (
        income_id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        crop_cycle_id VARCHAR(64) REFERENCES crop_cycles(crop_cycle_id) ON DELETE SET NULL,
        crop_type VARCHAR(255) NOT NULL,
        quantity NUMERIC(12, 2) NOT NULL,
        quantity_unit VARCHAR(32) NOT NULL DEFAULT 'quintal',
        unit_price NUMERIC(12, 2) NOT NULL,
        total_amount NUMERIC(14, 2) NOT NULL,
        sale_date DATE NOT NULL,
        buyer_name VARCHAR(255),
        notes TEXT,
        receipt_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE income ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(255);
      ALTER TABLE income ADD COLUMN IF NOT EXISTS notes TEXT;

      CREATE TABLE IF NOT EXISTS activity_logs (
        log_id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
        action VARCHAR(64) NOT NULL,
        entity_type VARCHAR(64) NOT NULL,
        entity_id VARCHAR(64),
        details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

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
    console.warn('PostgreSQL ensureSchema notice:', err?.message);
  }
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const p = getPool();
  if (!p) {
    throw new Error('PostgreSQL is not configured. Please set DATABASE_URL');
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
