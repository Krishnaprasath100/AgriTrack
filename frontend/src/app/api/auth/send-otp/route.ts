import { NextRequest, NextResponse } from 'next/server';
import { sendEmailOtp } from '@/lib/server/emailVerificationService';
import { findStoredUserByEmail } from '@/lib/server/serverStore';
import { query, isPostgresConfigured } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email format.' }, { status: 400 });
    }

    // Check if account already exists
    if (isPostgresConfigured()) {
      try {
        const existing = await query('SELECT uid FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
        if (existing.rows.length > 0) {
          return NextResponse.json(
            { error: 'An account with this email already exists. Please sign in.' },
            { status: 409 }
          );
        }
      } catch (dbErr: any) {
        console.warn('DB check error during send-otp:', dbErr.message);
      }
    }

    const stored = findStoredUserByEmail(normalizedEmail);
    if (stored) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    const result = await sendEmailOtp(normalizedEmail);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send verification code. Please try again.' },
        { status: 500 }
      );
    }

    // Note: NEVER leak OTP in the JSON response
    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    console.error('send-otp endpoint error:', err);
    return NextResponse.json({ error: 'Internal Server Error while sending OTP' }, { status: 500 });
  }
}

