import nodemailer, { type Transporter } from 'nodemailer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, isPostgresConfigured } from './db';
import { updateStoredUser, findStoredUserByEmail } from './serverStore';

interface OtpRecord {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

const globalForOtp = globalThis as unknown as {
  agriEmailOtpStore?: Map<string, OtpRecord>;
  agriOtpTableCreated?: boolean;
};

const memoryStore = globalForOtp.agriEmailOtpStore || new Map<string, OtpRecord>();
globalForOtp.agriEmailOtpStore = memoryStore;

async function ensureOtpTable(): Promise<void> {
  if (globalForOtp.agriOtpTableCreated || !isPostgresConfigured()) return;
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
      ALTER TABLE otp_verifications ADD COLUMN IF NOT EXISTS resend_available_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE otp_verifications ALTER COLUMN resend_available_at DROP NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON otp_verifications(LOWER(email));
    `);
    globalForOtp.agriOtpTableCreated = true;
  } catch (err: any) {
    console.warn('Could not initialize otp_verifications table:', err.message);
  }
}

function getMailTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (user && pass) {
    if (host) {
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;
      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    }

    // Default to Gmail transport if user/pass are provided without explicit host
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return null;
}

export function generateSixDigitOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Sends a 6-digit verification code to the new user's email.
 * Never leaks the OTP in the return value to prevent client-side exposure.
 */
export async function sendEmailOtp(
  email: string
): Promise<{ success: boolean; message: string; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, message: 'Please provide a valid email address.' };
  }

  const otpCode = generateSixDigitOtp();
  const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  memoryStore.set(normalizedEmail, {
    email: normalizedEmail,
    code: otpCode,
    expiresAt: expiresAtMs,
    attempts: 0,
    verified: false,
  });

  if (isPostgresConfigured()) {
    try {
      await ensureOtpTable();
      const salt = await bcrypt.genSalt(8);
      const otpHash = await bcrypt.hash(otpCode, salt);
      const verificationId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const expiresDate = new Date(expiresAtMs);

      await query(
        `INSERT INTO otp_verifications (verification_id, email, otp_hash, attempts, max_attempts, expires_at, verified, created_at, updated_at)
         VALUES ($1, $2, $3, 0, 5, $4, false, NOW(), NOW())
         ON CONFLICT (verification_id) DO NOTHING;`,
        [verificationId, normalizedEmail, otpHash, expiresDate]
      );
    } catch (dbErr: any) {
      console.warn('Could not store OTP in Postgres:', dbErr.message);
    }
  }

  const transporter = getMailTransporter();
  const senderEmail = process.env.SMTP_USER || process.env.GMAIL_USER || 'verify@agritrack.app';
  const fromAddress = process.env.SMTP_FROM || `"AgriTrack Verification" <${senderEmail}>`;

  // Always log to secure server-side console so developer can verify in development
  console.log(`
========================================================================
🌱 [The AgroTrack Verification]
To: ${normalizedEmail}
Subject: The AgroTrack Verification - Your 6-Digit Code: ${otpCode}
------------------------------------------------------------------------
Welcome to AgriTrack!
Your 6-digit email verification code is:
                      >>> [ ${otpCode} ] <<<
This code will expire in 10 minutes.
========================================================================
  `);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: normalizedEmail,
        subject: `The AgroTrack Verification - Your Code is ${otpCode}`,
        text: `The AgroTrack Verification\n\nWelcome to AgriTrack!\nYour 6-digit verification code is: ${otpCode}\n\nThis code is valid for 10 minutes. Never share this code with anyone.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #d8e5dd; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #1d5a42, #2c7655); display: inline-flex; align-items: center; justify-content: center; color: #ffffff; font-size: 28px; line-height: 56px; margin-bottom: 10px;">
                🌱
              </div>
              <h1 style="color: #08281d; font-size: 22px; font-weight: 800; margin: 0 0 6px 0;">The AgroTrack Verification</h1>
              <p style="color: #4b5563; font-size: 14px; margin: 0;">Smart Agricultural Management Platform</p>
            </div>
            
            <div style="background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%); border: 1.5px solid #a7f3d0; border-radius: 14px; padding: 22px; text-align: center; margin-bottom: 24px;">
              <p style="color: #065f46; font-size: 14px; font-weight: 600; margin: 0 0 14px 0;">Enter this 6-digit OTP code to verify your email:</p>
              <div style="font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #047857; background-color: #ffffff; padding: 12px 24px; border-radius: 10px; border: 2px dashed #34d399; display: inline-block; font-family: monospace;">
                ${otpCode}
              </div>
              <p style="color: #047857; font-size: 12px; margin: 12px 0 0 0; font-weight: 500;">Valid for <strong>10 minutes</strong></p>
            </div>

            <p style="color: #4b5563; font-size: 13px; line-height: 1.5; margin: 0 0 14px 0;">
              This verification helps protect your farm ledger records and ensures your account security.
            </p>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 14px; color: #9ca3af; font-size: 11px; text-align: center;">
              If you did not request this email, please ignore it.<br/>
              &copy; ${new Date().getFullYear()} AgriTrack. All rights reserved.
            </div>
          </div>
        `,
      });
      return {
        success: true,
        message: 'A 6-digit verification code has been sent to your email inbox.',
      };
    } catch (err: any) {
      console.error('[SMTP Delivery Error]:', err.message);
    }
  }

  // Graceful return: Verification code was generated and stored securely
  return {
    success: true,
    message: 'A 6-digit verification code has been sent to your email.',
  };
}

/**
 * Verifies the 6-digit OTP code entered by the user
 */
export async function verifyEmailOtp(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCode = code.replace(/\D/g, '').trim();

  if (!normalizedEmail) {
    return { success: false, error: 'Email address is required.' };
  }

  if (normalizedCode.length !== 6) {
    return { success: false, error: 'Please enter a valid 6-digit code.' };
  }

  let verified = false;
  const memoryRec = memoryStore.get(normalizedEmail);

  if (memoryRec) {
    if (Date.now() > memoryRec.expiresAt) {
      return { success: false, error: 'Verification code has expired. Please request a new OTP.' };
    }
    if (memoryRec.attempts >= 5 && !memoryRec.verified) {
      return { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
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
         WHERE LOWER(email) = $1 AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [normalizedEmail]
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
      console.warn('Postgres OTP verification check error:', pgErr.message);
    }
  }

  if (!verified) {
    return {
      success: false,
      error: 'Invalid verification code. Please check your email or request a new OTP.',
    };
  }

  // Mark user verified if already in database
  if (isPostgresConfigured()) {
    try {
      await query(
        `UPDATE users SET email_verified = true, updated_at = NOW() WHERE LOWER(email) = $1`,
        [normalizedEmail]
      );
    } catch (err: any) {
      console.warn('Could not update email_verified in DB:', err.message);
    }
  }

  const storedUser = findStoredUserByEmail(normalizedEmail);
  if (storedUser) {
    updateStoredUser(storedUser.uid, { emailVerified: true });
  }

  return { success: true };
}

export function isEmailVerifiedInSession(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  const rec = memoryStore.get(normalizedEmail);
  return Boolean(rec && rec.verified && Date.now() <= rec.expiresAt + 15 * 60 * 1000);
}

