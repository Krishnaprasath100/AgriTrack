import { NextResponse } from 'next/server';
import { testConnection, isPostgresConfigured, getSanitizedDbInfo, query } from '@/lib/server/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const dbConnected = await testConnection();
  const dbInfo = getSanitizedDbInfo();
  let userCount = 0;

  if (dbConnected) {
    try {
      const res = await query('SELECT COUNT(*) as count FROM users');
      userCount = parseInt(res.rows[0]?.count || '0', 10);
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    status: 'healthy',
    postgresConfigured: isPostgresConfigured(),
    postgresConnected: dbConnected,
    database: {
      host: dbInfo.host,
      source: dbInfo.source,
      userCount,
    },
    timestamp: new Date().toISOString(),
  });
}
