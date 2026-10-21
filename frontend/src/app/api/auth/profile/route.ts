import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { updateStoredUser } from '@/lib/server/serverStore';

export async function PUT(req: NextRequest) {
  try {
    const { uid, fullName, email, farmName, location, phone } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    if (isPostgresConfigured()) {
      try {
        const sql = `
          UPDATE users
          SET full_name = COALESCE($1, full_name),
              email = COALESCE($2, email),
              farm_name = COALESCE($3, farm_name),
              location = COALESCE($4, location),
              phone = COALESCE($5, phone),
              updated_at = NOW()
          WHERE uid = $6
          RETURNING uid, full_name, email, role, farm_name, location, phone, account_status, created_at, updated_at;
        `;
        const result = await query(sql, [
          fullName || null,
          email ? email.toLowerCase().trim() : null,
          farmName || null,
          location || null,
          phone || null,
          uid,
        ]);

        if (result.rows.length > 0) {
          const row = result.rows[0];
          return NextResponse.json({
            success: true,
            user: {
              uid: row.uid,
              fullName: row.full_name,
              email: row.email,
              role: row.role,
              farmName: row.farm_name,
              location: row.location,
              phone: row.phone,
              accountStatus: row.account_status,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            },
          });
        }
      } catch (dbErr: any) {
        console.warn('PostgreSQL update profile error:', dbErr.message);
      }
    }

    const updated = updateStoredUser(uid, {
      fullName,
      email: email ? email.toLowerCase().trim() : undefined,
      farmName,
      location,
      phone,
    });

    if (updated) {
      const { passwordHash: _, ...safeUser } = updated;
      return NextResponse.json({ success: true, user: safeUser });
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
