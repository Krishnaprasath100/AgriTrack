import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { findStoredUserByIdentifier } from '@/lib/server/serverStore';
import {
  sendMobileOtp,
  normalizePhone,
  isValidMobileNumber,
} from '@/lib/server/smsVerificationService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone = (body.phone || '').toString().trim();

    if (!rawPhone) {
      return NextResponse.json(
        { error: 'Mobile number is required to send OTP.' },
        { status: 400 }
      );
    }

    if (!isValidMobileNumber(rawPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(rawPhone);
    const digits = rawPhone.replace(/\D/g, '').slice(-10);

    // Check if phone number is already registered in PostgreSQL
    if (isPostgresConfigured()) {
      try {
        const existingPhone = await query(
          "SELECT uid FROM users WHERE phone IS NOT NULL AND REPLACE(REPLACE(phone, ' ', ''), '-', '') LIKE $1",
          [`%${digits}%`]
        );
        if (existingPhone.rows.length > 0 && digits.length === 10) {
          return NextResponse.json(
            { error: 'An account with this mobile number already exists.' },
            { status: 409 }
          );
        }
      } catch (dbErr: any) {
        console.warn('Database phone check error:', dbErr.message);
      }
    }

    // Check in-memory store
    const existingStored = findStoredUserByIdentifier(normalizedPhone);
    if (existingStored) {
      return NextResponse.json(
        { error: 'An account with this mobile number already exists.' },
        { status: 409 }
      );
    }

    const result = await sendMobileOtp(normalizedPhone);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || result.message || 'Failed to send SMS OTP.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      phone: result.phone,
    });
  } catch (err: any) {
    console.error('Error in send-otp API:', err);
    return NextResponse.json(
      { error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}

