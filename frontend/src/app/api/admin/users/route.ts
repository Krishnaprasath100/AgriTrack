import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { getAllStoredUsers } from '@/lib/server/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    if (isPostgresConfigured()) {
      try {
        const sql = `
          SELECT 
            uid,
            full_name as "fullName",
            email,
            role,
            farm_name as "farmName",
            location,
            phone,
            account_status as "accountStatus",
            COALESCE(phone_verified, false) as "phoneVerified",
            COALESCE(email_verified, false) as "emailVerified",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM users
          ORDER BY created_at DESC;
        `;
        const dbRes = await query(sql);
        return NextResponse.json(
          { success: true, data: dbRes.rows },
          { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
        );
      } catch (dbErr: any) {
        console.error('PostgreSQL admin users query error:', dbErr);
        return NextResponse.json({ error: 'Failed to query database' }, { status: 500 });
      }
    }

    const storedUsers = getAllStoredUsers().map(({ passwordHash: _, ...safeUser }) => safeUser);
    return NextResponse.json(
      { success: true, data: storedUsers },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
