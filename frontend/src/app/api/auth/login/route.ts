import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { findStoredUserByEmail, updateStoredUser } from '@/lib/server/serverStore';
import { UserProfile } from '@/types';

async function verifyAndUpgradePassword(
  providedPassword: string,
  storedPasswordHash: string,
  userId?: string
): Promise<boolean> {
  if (!storedPasswordHash) return false;

  const trimmedProvided = providedPassword.trim();
  const trimmedStored = storedPasswordHash.trim();

  // 1. Direct plaintext match (exact or trimmed)
  if (
    providedPassword === storedPasswordHash ||
    trimmedProvided === trimmedStored ||
    providedPassword === trimmedStored ||
    trimmedProvided === storedPasswordHash
  ) {
    if (userId) {
      try {
        const salt = await bcrypt.genSalt(10);
        const upgradedHash = await bcrypt.hash(providedPassword, salt);
        if (isPostgresConfigured()) {
          await query('UPDATE users SET password_hash = $1 WHERE uid = $2', [upgradedHash, userId]);
        }
        updateStoredUser(userId, { passwordHash: upgradedHash });
      } catch (upgradeErr) {
        console.warn('Could not auto-upgrade password to bcrypt:', upgradeErr);
      }
    }
    return true;
  }

  // 2. If stored as bcrypt hash ($2a$, $2b$, or $2y$)
  if (/^\$2[aby]\$/.test(storedPasswordHash) || /^\$2[aby]\$/.test(trimmedStored)) {
    try {
      if (await bcrypt.compare(providedPassword, storedPasswordHash)) return true;
      if (await bcrypt.compare(trimmedProvided, storedPasswordHash)) return true;
      if (await bcrypt.compare(providedPassword, trimmedStored)) return true;
      if (await bcrypt.compare(trimmedProvided, trimmedStored)) return true;
    } catch {
      // fallback
    }
  }

  return false;
}

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
          'SELECT uid, full_name, email, password_hash, role, farm_name, location, phone, account_status, COALESCE(phone_verified, false) as phone_verified, COALESCE(email_verified, false) as email_verified, created_at, updated_at FROM users WHERE LOWER(TRIM(email)) = $1',
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

          const passwordValid = await verifyAndUpgradePassword(password, row.password_hash, row.uid);
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
      const match = await verifyAndUpgradePassword(password, stored.passwordHash, stored.uid);
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
