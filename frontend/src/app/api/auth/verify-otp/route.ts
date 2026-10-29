import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailOtp } from '@/lib/server/emailVerificationService';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email address and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).replace(/\D/g, '').trim();

    if (cleanOtp.length !== 6) {
      return NextResponse.json(
        { error: 'Verification code must be exactly 6 digits.' },
        { status: 400 }
      );
    }

    const result = await verifyEmailOtp(normalizedEmail, cleanOtp);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid verification code. Please check your email.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (err: any) {
    console.error('verify-otp endpoint error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error while verifying code' },
      { status: 500 }
    );
  }
}

