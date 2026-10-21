import { NextResponse } from 'next/server';
import { testConnection, isPostgresConfigured } from '@/lib/server/db';

export async function GET() {
  const dbConnected = await testConnection();
  return NextResponse.json({
    status: 'healthy',
    postgresConfigured: isPostgresConfigured(),
    postgresConnected: dbConnected,
    timestamp: new Date().toISOString(),
  });
}
