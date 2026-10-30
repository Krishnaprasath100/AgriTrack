import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, isPostgresConfigured } from './db';
import { updateStoredUser, findStoredUserByIdentifier } from './serverStore';

const DEFAULT_KOVAI_SMS_URL = 'https://kovaisms.com/api/sms/v1.0/send-sms';

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
    accessToken: (process.env.SMS_ACCESS_TOKEN || '').trim(),
    accessTokenKey: (process.env.SMS_ACCESS_TOKEN_KEY || '').trim(),
    gatewayUrl: (process.env.SMS_GATEWAY_URL || DEFAULT_KOVAI_SMS_URL).trim(),
    smsHeader: (process.env.SMS_HEADER || process.env.SMS_SENDER_ID || '').trim(),
    dltEntityId: (process.env.SMS_DLT_ENTITY_ID || '').trim(),
    dltTemplateId: (process.env.SMS_DLT_TEMPLATE_ID || '').trim(),
    smsRoute: (process.env.SMS_ROUTE || '7').trim(), // 7 = transactional on kovaisms.com
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

export function formatIndianTenDigitPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    return digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return digits.slice(1);
  }
  return digits.slice(-10);
}

export function isValidMobileNumber(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+91[6-9]\d{9}$/.test(normalized) || /^\+\d{10,15}$/.test(normalized);
}

export function generateSixDigitOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function createKovaiAuthSignature(
  accessToken: string,
  accessTokenKey: string,
  expireEpoch: number
): string {
  return crypto
    .createHash('md5')
    .update(`${accessToken}${accessTokenKey}${expireEpoch}`)
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
 * Sends a 6-digit SMS OTP to the user's mobile number via kovaisms.com
 * using the configured Access Token and Access Token Key.
 */
export async function sendMobileOtp(phone: string): Promise<{
  success: boolean;
  message: string;
  phone?: string;
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
  const recipientNumber = formatIndianTenDigitPhone(phone);
  const {
    accessToken,
    accessTokenKey,
    gatewayUrl,
    smsHeader,
    dltEntityId,
    dltTemplateId,
    smsRoute,
  } = getSmsCredentials();

  if (!accessToken || !accessTokenKey) {
    return {
      success: false,
      message: 'SMS Access Token credentials are not configured.',
      error: 'SMS Access Token credentials are not configured.',
    };
  }

  if (!gatewayUrl) {
    return { success: false, message: 'KovaiSMS gateway URL is not configured.', error: 'KovaiSMS gateway URL is not configured.' };
  }

  const otpCode = generateSixDigitOtp();
  const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes validity
  const expireEpoch = Math.floor(Date.now() / 1000) + 300;
  const authSignature = createKovaiAuthSignature(accessToken, accessTokenKey, expireEpoch);

  const smsText = process.env.SMS_MESSAGE_TEMPLATE
    ? process.env.SMS_MESSAGE_TEMPLATE.replace('{#var#}', otpCode).replace('{otp}', otpCode)
    : `Your AgriTrack verification OTP is ${otpCode}. Valid for 10 minutes. Do not share this code.`;

  let smsRes: Response;
  let smsResText = '';
  try {
    const requestUrl = new URL(gatewayUrl);
    requestUrl.searchParams.set('accessToken', accessToken);
    requestUrl.searchParams.set('expire', String(expireEpoch));
    requestUrl.searchParams.set('authSignature', authSignature);

    const payload = {
      route: smsRoute,
      ...(smsHeader ? { smsHeader } : {}),
      recipients: recipientNumber,
      messageContent: smsText,
      contentType: '1',
      ...(dltEntityId ? { entityId: dltEntityId } : {}),
      ...(dltTemplateId ? { templateId: dltTemplateId } : {}),
    };

    smsRes = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    smsResText = await smsRes.text();
  } catch (gwErr: any) {
    console.error('[KovaiSMS] SMS request failed:', gwErr?.name || 'NetworkError');
    return {
      success: false,
      message: 'Could not connect to KovaiSMS. Please try again.',
      error: 'Could not connect to KovaiSMS. Please try again.',
    };
  }

  let providerResponse: any;
  try { providerResponse = JSON.parse(smsResText); } catch { providerResponse = null; }
  const responseBody = Array.isArray(providerResponse) ? providerResponse[0] : providerResponse;
  const providerStatus = String(responseBody?.status ?? responseBody?.result ?? responseBody?.statusCode ?? '').toLowerCase();
  const providerRejected = String(responseBody?.success).toLowerCase() === 'false'
    || Boolean(responseBody?.error)
    || /error|failed|failure|rejected|invalid|unauthori[sz]ed|denied/.test(providerStatus)
    || (!providerResponse && /error|failed|failure|rejected|invalid|unauthori[sz]ed|denied/i.test(smsResText));

  if (!smsRes.ok || providerRejected) {
    const providerMessage = typeof responseBody?.message === 'string' ? responseBody.message : '';
    console.error(`[KovaiSMS] SMS rejected (HTTP ${smsRes.status}${providerStatus ? `, ${providerStatus}` : ''}).`);
    const rawError = providerMessage || `KovaiSMS rejected the SMS request (HTTP ${smsRes.status}).`;
    const error = rawError.replaceAll(accessToken, '[redacted]').replaceAll(accessTokenKey, '[redacted]');
    return { success: false, message: error, error };
  }

  // Only make the OTP verifiable after KovaiSMS has accepted the send request.
  memoryStore.set(normalizedPhone, {
    phone: normalizedPhone,
    code: otpCode,
    signature: authSignature,
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
      await query(
        `INSERT INTO otp_verifications (verification_id, email, otp_hash, attempts, max_attempts, expires_at, verified, created_at, updated_at)
         VALUES ($1, $2, $3, 0, 5, $4, false, NOW(), NOW())
         ON CONFLICT (verification_id) DO NOTHING;`,
        [verificationId, normalizedPhone, otpHash, new Date(expiresAtMs)]
      );
    } catch (dbErr: any) {
      console.warn('Could not store SMS OTP in Postgres:', dbErr.message);
    }
  }

  return {
    success: true,
    phone: normalizedPhone,
    message: `A 6-digit verification OTP has been sent via SMS to ${normalizedPhone}.`,
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
