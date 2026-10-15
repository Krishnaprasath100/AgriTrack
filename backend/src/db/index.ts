import { Pool, QueryResult, QueryResultRow } from 'pg';

export const isPostgresConfigured = (): boolean => {
  return Boolean(
    process.env.DATABASE_URL ||
    (process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER)
  );
};

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!isPostgresConfigured()) {
    return null;
  }

  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    const isRemote =
      connectionString &&
      (connectionString.includes('neon.tech') ||
        connectionString.includes('supabase.co') ||
        connectionString.includes('render.com') ||
        connectionString.includes('aws') ||
        connectionString.includes('sslmode=require'));

    pool = new Pool({
      connectionString: connectionString || undefined,
      host: process.env.PGHOST,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client pool:', err);
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const p = getPool();
  if (!p) {
    throw new Error('PostgreSQL is not configured. Please set DATABASE_URL in .env.local');
  }
  return p.query<T>(text, params);
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
