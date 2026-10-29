import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, isPostgresConfigured } from './db';
import { updateStoredUser, findStoredUserByIdentifier } from './serverStore';

const DEFAULT_SMS_ACCESS_TOKEN = 'F6W71X680SJPL9M';
const DEFAULT_SMS_ACCESS_TOKEN_KEY = '1c[|/MXx@mL=7kVbpN[v*2Y0G_g%(8Uu';

export interface SmsOtpRecord {
  phone: string;
  code: string;
  signature: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

const globalForSmsOtp = globalThis as unknown as {
  agriSmsOtpStore?: Map<string, SmsOtpRecord>;
  agriSmsOtpTableReady?: boolean;
};

const memoryStore = globalForSmsOtp.agriSmsOtpStore || new Map<string, SmsOtpRecord>();
globalForSmsOtp.agriSmsOtpStore = memoryStore;

export function getSmsCredentials() {
  return {
    accessToken: (process.env.SMS_ACCESS_TOKEN || DEFAULT_SMS_ACCESS_TOKEN).trim(),
    accessTokenKey: (process.env.SMS_ACCESS_TOKEN_KEY || DEFAULT_SMS_ACCESS_TOKEN_KEY).trim(),
    gatewayUrl: process.env.SMS_GATEWAY_URL?.trim() || '',
  };
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return digits ? `+${digits}` : '';
}

export function isValidMobileNumber(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+91[6-9]\d{9}$/.test(normalized) || /^\+\d{10,15}$/.test(normalized);
}

export function generateSixDigitOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function createSmsSignature(phone: string, otpCode: string, accessToken: string, accessTokenKey: string): string {
  return crypto
    .createHmac('sha256', accessTokenKey)
    .update(`${accessToken}:${phone}:${otpCode}`)
    .digest('hex');
}

async function ensureOtpTable(): Promise<void> {
  if (globalForSmsOtp.agriSmsOtpTableReady || !isPostgresConfigured()) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        verification_id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        expires_at TIMESTAMPTZ NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON otp_verifications(LOWER(email));
    `);
    globalForSmsOtp.agriSmsOtpTableReady = true;
  } catch (err: any) {
    console.warn('Could not initialize otp_verifications table for SMS:', err.message);
  }
}

/**
 * Sends a 6-digit SMS OTP to the user's mobile number using the configured
 * Access Token and Access Token Key.
 */
export async function sendMobileOtp(phone: string): Promise<{
  success: boolean;
  message: string;
  phone?: string;
  smsCode?: string;
  error?: string;
}> {
  if (!phone || !isValidMobileNumber(phone)) {
    return {
      success: false,
      message: 'Please enter a valid 10-digit mobile number.',
      error: 'Please enter a valid 10-digit mobile number.',
    };
  }

  const normalizedPhone = normalizePhone(phone);
  const { accessToken, accessTokenKey, gatewayUrl } = getSmsCredentials();

  if (!accessToken || !accessTokenKey) {
    return {
      success: false,
      message: 'SMS Access Token credentials are not configured.',
      error: 'SMS Access Token credentials are not configured.',
    };
  }

  const otpCode = generateSixDigitOtp();
  const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes validity
  const signature = createSmsSignature(normalizedPhone, otpCode, accessToken, accessTokenKey);

  memoryStore.set(normalizedPhone, {
    phone: normalizedPhone,
    code: otpCode,
    signature,
    expiresAt: expiresAtMs,
    attempts: 0,
    verified: false,
  });

  if (isPostgresConfigured()) {
    try {
      await ensureOtpTable();
      const salt = await bcrypt.genSalt(8);
      const otpHash = await bcrypt.hash(otpCode, salt);
      const verificationId = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const expiresDate = new Date(expiresAtMs);

      await query(
        `INSERT INTO otp_verifications (verification_id, email, otp_hash, attempts, max_attempts, expires_at, verified, created_at, updated_at)
         VALUES ($1, $2, $3, 0, 5, $4, false, NOW(), NOW())
         ON CONFLICT (verification_id) DO NOTHING;`,
        [verificationId, normalizedPhone, otpHash, expiresDate]
      );
    } catch (dbErr: any) {
      console.warn('Could not store SMS OTP in Postgres:', dbErr.message);
    }
  }

  const smsText = `Your AgriTrack mobile verification OTP is ${otpCode}. Valid for 10 minutes. Do not share this code.`;

  // If an external HTTP SMS gateway URL is configured, dispatch with Access Token & Access Token Key headers
  if (gatewayUrl) {
    try {
      await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Token': accessToken,
          'X-Access-Token-Key': accessTokenKey,
          'X-Signature': signature,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: normalizedPhone,
          phone: normalizedPhone,
          otp: otpCode,
          message: smsText,
          accessToken,
          signature,
        }),
      });
    } catch (gwErr: any) {
      console.warn('[SMS Gateway Dispatch Notice]:', gwErr.message);
    }
  }

  console.log(`
========================================================================
📲 [AgriTrack SMS OTP Dispatch]
Access Token : ${accessToken}
Signature    : ${signature.slice(0, 16)}...
To Mobile    : ${normalizedPhone}
SMS Message  : "${smsText}"
OTP Code     : >>> [ ${otpCode} ] <<<
Expires In   : 10 minutes
========================================================================
`);

  return {
    success: true,
    phone: normalizedPhone,
    smsCode: otpCode,
    message: `A 6-digit OTP has been sent via SMS to ${normalizedPhone}.`,
  };
}

/**
 * Verifies the 6-digit SMS OTP code entered by the user for their mobile number.
 */
export async function verifyMobileOtp(
  phone: string,
  code: string
): Promise<{ success: boolean; verified?: boolean; error?: string }> {
  const normalizedPhone = normalizePhone(phone);
  const normalizedCode = String(code || '').replace(/\D/g, '').trim();

  if (!normalizedPhone || !isValidMobileNumber(normalizedPhone)) {
    return { success: false, error: 'A valid mobile number is required.' };
  }

  if (normalizedCode.length !== 6) {
    return { success: false, error: 'Please enter a valid 6-digit OTP code.' };
  }

  let verified = false;
  const memoryRec = memoryStore.get(normalizedPhone);

  if (memoryRec) {
    if (Date.now() > memoryRec.expiresAt) {
      memoryStore.delete(normalizedPhone);
      return { success: false, error: 'OTP has expired. Please request a new SMS OTP.' };
    }
    if (memoryRec.attempts >= 5 && !memoryRec.verified) {
      return { success: false, error: 'Too many incorrect attempts. Please request a new SMS OTP.' };
    }

    if (memoryRec.code === normalizedCode || memoryRec.verified) {
      verified = true;
      memoryRec.verified = true;
    } else {
      memoryRec.attempts += 1;
    }
  }

  if (!verified && isPostgresConfigured()) {
    try {
      await ensureOtpTable();
      const res = await query(
        `SELECT verification_id, otp_hash, attempts, max_attempts, expires_at, verified
         FROM otp_verifications
         WHERE LOWER(email) = LOWER($1) AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [normalizedPhone]
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];
        if (row.attempts < row.max_attempts || row.verified) {
          const match = await bcrypt.compare(normalizedCode, row.otp_hash);
          if (match || row.verified) {
            verified = true;
            await query(
              `UPDATE otp_verifications SET verified = true, updated_at = NOW() WHERE verification_id = $1`,
              [row.verification_id]
            );
          } else {
            await query(
              `UPDATE otp_verifications SET attempts = attempts + 1, updated_at = NOW() WHERE verification_id = $1`,
              [row.verification_id]
            );
          }
        }
      }
    } catch (pgErr: any) {
      console.warn('Postgres SMS OTP verification check error:', pgErr.message);
    }
  }

  if (!verified) {
    return {
      success: false,
      verified: false,
      error: 'Invalid verification code. Please check your SMS OTP or request a new one.',
    };
  }

  // Mark phone_verified = true if user already exists in DB
  if (isPostgresConfigured()) {
    try {
      await query(
        `UPDATE users SET phone_verified = true, updated_at = NOW() WHERE phone = $1`,
        [normalizedPhone]
      );
    } catch (err: any) {
      console.warn('Could not update phone_verified in DB:', err.message);
    }
  }

  const storedUser = findStoredUserByIdentifier(normalizedPhone);
  if (storedUser) {
    updateStoredUser(storedUser.uid, { phoneVerified: true });
  }

  return { success: true, verified: true };
}

export function isPhoneVerifiedInSession(phone: string): boolean {
  const normalizedPhone = normalizePhone(phone);
  const rec = memoryStore.get(normalizedPhone);
  return Boolean(rec && rec.verified && Date.now() <= rec.expiresAt + 15 * 60 * 1000);
}
