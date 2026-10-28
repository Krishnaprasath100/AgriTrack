import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { findStoredUserByEmail } from '@/lib/server/serverStore';
import { UserProfile } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    let normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === 'admin') normalizedEmail = 'admin@agritrack.com';
    if (normalizedEmail === 'farmer') normalizedEmail = 'farmer@agritrack.com';
    if (normalizedEmail === 'farmer@agritrack.in') normalizedEmail = 'farmer@agritrack.com';
    if (normalizedEmail === 'admin@agritrack.in') normalizedEmail = 'admin@agritrack.com';

    if (isPostgresConfigured()) {
      try {
        const result = await query(
          'SELECT uid, full_name, email, password_hash, role, farm_name, location, phone, account_status, COALESCE(phone_verified, false) as phone_verified, COALESCE(email_verified, false) as email_verified, created_at, updated_at FROM users WHERE LOWER(email) = $1',
          [normalizedEmail]
        );

        if (result.rows.length > 0) {
          const row = result.rows[0];

          if (row.account_status === 'deactivated') {
            return NextResponse.json(
              { error: 'Account is deactivated. Contact an administrator.' },
              { status: 403 }
            );
          }

          const passwordValid = await bcrypt.compare(password, row.password_hash);
          if (!passwordValid) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
          }

          const userProfile: UserProfile = {
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
          };

          return NextResponse.json({ success: true, user: userProfile });
        }
      } catch (dbErr: any) {
        console.warn('PostgreSQL login error, falling back to server store:', dbErr.message);
      }
    }

    const stored = findStoredUserByEmail(normalizedEmail);
    if (!stored) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (stored.accountStatus === 'deactivated') {
      return NextResponse.json(
        { error: 'Account is deactivated. Contact an administrator.' },
        { status: 403 }
      );
    }

    if (stored.passwordHash) {
      const match = await bcrypt.compare(password, stored.passwordHash);
      if (!match) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
    }

    const { passwordHash: _, ...safeUser } = stored;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
