import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileOtp } from '@/lib/server/smsVerificationService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = (body.phone || '').toString().trim();
    const otp = (body.otp || body.code || '').toString().trim();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Mobile number and 6-digit OTP code are required.' },
        { status: 400 }
      );
    }

    const result = await verifyMobileOtp(phone, otp);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid or expired verification code.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Mobile number verified successfully.',
    });
  } catch (err: any) {
    console.error('Error in verify-otp API:', err);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
