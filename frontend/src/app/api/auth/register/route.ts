import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { generateId } from '@/lib/utils';
import { UserProfile, UserRole } from '@/types';
import { addStoredUser, findStoredUserByEmail } from '@/lib/server/serverStore';

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, farmName, location, phone } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email, and password are required' },
        { status: 400 }
      );
    }

    const normalizedPhone = phone?.trim() || undefined;

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const uid = generateId('usr');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();

    const assignedRole: UserRole =
      normalizedEmail === 'krishnaprasath720@gmail.com' ? 'admin' : 'farmer';

    const existingStored = findStoredUserByEmail(normalizedEmail);
    if (existingStored) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    if (isPostgresConfigured()) {
      try {
        const existing = await query('SELECT uid FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
        if (existing.rows.length > 0) {
          return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 409 }
          );
        }

        const insertQuery = `
          INSERT INTO users (uid, full_name, email, password_hash, role, farm_name, location, phone, account_status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW(), NOW())
          RETURNING uid, full_name, email, role, farm_name, location, phone, account_status, created_at, updated_at;
        `;

        const result = await query(insertQuery, [
          uid,
          fullName,
          normalizedEmail,
          passwordHash,
          assignedRole,
          farmName || 'My Farm',
          location || '',
          normalizedPhone,
        ]);

        const row = result.rows[0];
        const userProfile: UserProfile = {
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
        };

        addStoredUser({ ...userProfile, passwordHash });
        return NextResponse.json({ success: true, user: userProfile }, { status: 201 });
      } catch (dbErr: any) {
        console.warn('PostgreSQL register error, using fallback:', dbErr.message);
      }
    }

    const fallbackProfile: UserProfile = {
      uid,
      fullName,
      email: normalizedEmail,
      role: assignedRole,
      farmName: farmName || 'My Farm',
      location: location || '',
      phone: normalizedPhone,
      accountStatus: 'active',
      createdAt: now,
      updatedAt: now,
    };

    addStoredUser({ ...fallbackProfile, passwordHash });
    return NextResponse.json({ success: true, user: fallbackProfile }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
