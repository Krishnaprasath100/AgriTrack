import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { findStoredUserByIdentifier, updateStoredUser } from '@/lib/server/serverStore';

export async function POST(req: NextRequest) {
  try {
    const { identifier, newPassword } = await req.json();

    const rawId = (identifier || '').toString().trim();
    if (!rawId) {
      return NextResponse.json(
        { error: 'Please enter your registered email or mobile number.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    const normalized = rawId.toLowerCase();
    const digits = rawId.replace(/\D/g, '');
    const phoneWithPrefix = digits.length === 10 ? `+91${digits}` : `+${digits}`;

    let updated = false;

    if (isPostgresConfigured()) {
      try {
        const checkRes = await query(
          `SELECT uid FROM users
           WHERE (email IS NOT NULL AND LOWER(TRIM(email)) = $1)
              OR (phone IS NOT NULL AND (
                   REPLACE(REPLACE(phone, ' ', ''), '-', '') = $2 OR
                   phone = $3 OR
                   phone = $4
                 ))
              OR (LOWER(TRIM(full_name)) = $1)
           LIMIT 1`,
          [normalized, digits, rawId, phoneWithPrefix]
        );

        if (checkRes.rows.length > 0) {
          const userUid = checkRes.rows[0].uid;
          await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE uid = $2', [
            newHash,
            userUid,
          ]);
          updateStoredUser(userUid, { passwordHash: newHash });
          updated = true;
        }
      } catch (dbErr: any) {
        console.warn('PostgreSQL forgot-password error, checking fallback:', dbErr.message);
      }
    }

    if (!updated) {
      const stored = findStoredUserByIdentifier(rawId);
      if (stored) {
        updateStoredUser(stored.uid, { passwordHash: newHash });
        updated = true;
      }
    }

    if (!updated) {
      return NextResponse.json(
        { error: 'No account found matching this email or mobile number.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! Please sign in with your new password.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
