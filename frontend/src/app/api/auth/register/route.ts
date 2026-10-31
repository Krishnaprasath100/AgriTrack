import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { generateId } from '@/lib/utils';
import { UserProfile, UserRole } from '@/types';
import { addStoredUser, findStoredUserByEmail } from '@/lib/server/serverStore';
import { normalizePhone, verifyMobileOtp } from '@/lib/server/smsVerificationService';

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, farmName, location, phone, otp } = await req.json();

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password is required and must be at least 6 characters' },
        { status: 400 }
      );
    }

    const trimmedEmail = typeof email === 'string' && email.trim() ? email.toLowerCase().trim() : null;
    const rawPhone = typeof phone === 'string' && phone.trim() ? phone.trim() : null;
    const trimmedPhone = rawPhone ? normalizePhone(rawPhone) : null;

    if (!trimmedPhone) {
      return NextResponse.json(
        { error: 'Mobile number is required.' },
        { status: 400 }
      );
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email format or leave it blank.' },
        { status: 400 }
      );
    }

    if (otp && typeof otp === 'string' && otp.trim()) {
      const otpCheck = await verifyMobileOtp(trimmedPhone, String(otp));
      if (!otpCheck.success) {
        return NextResponse.json(
          { error: otpCheck.error || 'Mobile number OTP verification failed.' },
          { status: 400 }
        );
      }
    }

    const uid = generateId('usr');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();

    const assignedRole: UserRole =
      trimmedEmail === 'krishnaprasath720@gmail.com' ? 'admin' : 'farmer';

    // Duplicate check in in-memory fallback
    if (trimmedEmail) {
      const existingStored = findStoredUserByEmail(trimmedEmail);
      if (existingStored) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
    }

    if (isPostgresConfigured()) {
      try {
        if (trimmedEmail) {
          const existingEmail = await query('SELECT uid FROM users WHERE LOWER(TRIM(email)) = $1', [trimmedEmail]);
          if (existingEmail.rows.length > 0) {
            return NextResponse.json(
              { error: 'An account with this email already exists' },
              { status: 409 }
            );
          }
        }

        if (trimmedPhone) {
          const cleanPhone = trimmedPhone.replace(/\D/g, '').slice(-10);
          const existingPhone = await query(
            "SELECT uid FROM users WHERE REPLACE(REPLACE(phone, ' ', ''), '-', '') LIKE $1",
            [`%${cleanPhone}%`]
          );
          if (existingPhone.rows.length > 0 && cleanPhone.length >= 10) {
            return NextResponse.json(
              { error: 'An account with this mobile number already exists' },
              { status: 409 }
            );
          }
        }

        const insertQuery = `
          INSERT INTO users (uid, full_name, email, password_hash, role, farm_name, location, phone, account_status, phone_verified, email_verified, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', true, false, NOW(), NOW())
          RETURNING uid, full_name, email, role, farm_name, location, phone, account_status, phone_verified, email_verified, created_at, updated_at;
        `;

        let row;
        try {
          const result = await query(insertQuery, [
            uid,
            fullName.trim(),
            trimmedEmail,
            passwordHash,
            assignedRole,
            farmName?.trim() || 'My Farm',
            location?.trim() || '',
            trimmedPhone,
          ]);
          row = result.rows[0];
        } catch (firstErr: any) {
          console.warn('Initial register insert failed, ensuring schema:', firstErr.message);
          const { ensureSchema } = await import('@/lib/server/db');
          await ensureSchema();
          const result = await query(insertQuery, [
            uid,
            fullName.trim(),
            trimmedEmail,
            passwordHash,
            assignedRole,
            farmName?.trim() || 'My Farm',
            location?.trim() || '',
            trimmedPhone,
          ]);
          row = result.rows[0];
        }

        const userProfile: UserProfile = {
          uid: row.uid,
          fullName: row.full_name,
          email: row.email || undefined,
          role: row.role,
          farmName: row.farm_name,
          location: row.location,
          phone: row.phone,
          accountStatus: row.account_status,
          phoneVerified: true,
          emailVerified: false,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        addStoredUser({ ...userProfile, passwordHash });
        return NextResponse.json({ success: true, user: userProfile }, { status: 201 });
      } catch (dbErr: any) {
        console.error('PostgreSQL register error:', dbErr);
        return NextResponse.json(
          { error: `Database error creating user account: ${dbErr.message || 'Please try again'}` },
          { status: 500 }
        );
      }
    }

    const fallbackProfile: UserProfile = {
      uid,
      fullName: fullName.trim(),
      email: trimmedEmail || undefined,
      role: assignedRole,
      farmName: farmName?.trim() || 'My Farm',
      location: location?.trim() || '',
      phone: trimmedPhone || undefined,
      accountStatus: 'active',
      phoneVerified: true,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    addStoredUser({ ...fallbackProfile, passwordHash });
    return NextResponse.json({ success: true, user: fallbackProfile }, { status: 201 });
  } catch (err: any) {
    console.error('Registration unexpected failure:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
