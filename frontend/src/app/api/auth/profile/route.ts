import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { updateStoredUser } from '@/lib/server/serverStore';

export async function PUT(req: NextRequest) {
  try {
    const { uid, fullName, email, farmName, location, phone, phoneVerified, emailVerified } = await req.json();

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
              phone_verified = CASE WHEN $6::boolean IS NOT NULL THEN $6::boolean ELSE phone_verified END,
              email_verified = CASE WHEN $7::boolean IS NOT NULL THEN $7::boolean ELSE email_verified END,
              updated_at = NOW()
          WHERE uid = $8
          RETURNING uid, full_name, email, role, farm_name, location, phone, account_status, COALESCE(phone_verified, false) as phone_verified, COALESCE(email_verified, false) as email_verified, created_at, updated_at;
        `;
        const result = await query(sql, [
          fullName || null,
          email ? email.toLowerCase().trim() : null,
          farmName || null,
          location || null,
          phone || null,
          phoneVerified !== undefined ? phoneVerified : null,
          emailVerified !== undefined ? emailVerified : null,
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
              phoneVerified: Boolean(row.phone_verified),
              emailVerified: Boolean(row.email_verified),
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
