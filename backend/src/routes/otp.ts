import { Router, Request, Response } from 'express';
import { query, isPostgresConfigured } from '../db';
import { getAllStoredUsers } from '../lib/serverStore';

const router = Router();

// ─── Twilio Verify Configuration Helper ─────────────────────────────
function getTwilioConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID?.trim() || '',
    authToken: process.env.TWILIO_AUTH_TOKEN?.trim() || '',
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID?.trim() || '',
  };
}

let twilioClient: any = null;

function getTwilioClient() {
  const { accountSid, authToken } = getTwilioConfig();
  if (!accountSid || !authToken) return null;
  if (!twilioClient) {
    try {
      // Dynamic import to avoid crash if twilio not installed
      const twilio = require('twilio');
      twilioClient = twilio(accountSid, authToken);
    } catch (err) {
      console.warn('[OTP] Twilio SDK not available:', (err as Error).message);
    }
  }
  return twilioClient;
}

function isTwilioConfigured(): boolean {
  const { accountSid, authToken, verifyServiceSid } = getTwilioConfig();
  return Boolean(
    accountSid &&
    authToken &&
    verifyServiceSid &&
    !accountSid.includes('xxxx') &&
    !verifyServiceSid.includes('xxxx')
  );
}

// ─── In-Memory Rate Limiting ────────────────────────────────────────
interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  verifyAttempts: number; // how many times user tried to verify (wrong OTP)
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10-minute window
const MAX_SEND_ATTEMPTS = 5;     // max OTP sends per phone per window
const MAX_VERIFY_ATTEMPTS = 5;   // max verification attempts per phone per window
const COOLDOWN_SECONDS = 30;     // minimum seconds between OTP sends

// ─── Development / Local Simulation OTP Store ───────────────────────
interface DevOtpEntry {
  code: string;
  expiresAt: number;
}
const devOtpMap = new Map<string, DevOtpEntry>();
const DEV_OTP_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

// ─── Verified Phones Tracking ──────────────────────────────────────
// Tracks phones that have been verified during current session
// Key: phone, Value: { verifiedAt, expiresAt }
interface VerifiedPhone {
  verifiedAt: number;
  expiresAt: number;
}
const verifiedPhonesMap = new Map<string, VerifiedPhone>();
const VERIFICATION_VALIDITY_MS = 15 * 60 * 1000; // 15 minutes to complete registration after OTP verify

// ─── Utility Functions ─────────────────────────────────────────────

function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If it starts with 91 and is 12 digits, it's already +91XXXXXXXXXX format
  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }

  // If it's 10 digits, prepend +91
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // Return with + prefix if not already
  return `+${digits}`;
}

function isValidIndianMobile(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Indian mobile numbers: +91 followed by 10 digits starting with 6-9
  return /^\+91[6-9]\d{9}$/.test(normalized);
}

function getRateLimit(phone: string): RateLimitEntry {
  const now = Date.now();
  let entry = rateLimitMap.get(phone);

  // Reset if window expired
  if (entry && now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.delete(phone);
    entry = undefined;
  }

  if (!entry) {
    entry = {
      attempts: 0,
      firstAttemptAt: now,
      lastAttemptAt: 0,
      verifyAttempts: 0,
    };
    rateLimitMap.set(phone, entry);
  }

  return entry;
}

// ─── Check if phone already registered ─────────────────────────────
async function isPhoneRegistered(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone);

  // Check PostgreSQL
  if (isPostgresConfigured()) {
    try {
      const result = await query(
        "SELECT uid FROM users WHERE phone = $1 AND account_status = 'active'",
        [normalized]
      );
      if (result.rows.length > 0) return true;
    } catch (err) {
      console.warn('[OTP] DB phone check error:', (err as Error).message);
    }
  }

  // Check server store (fallback)
  try {
    const storedUsers = getAllStoredUsers();
    const match = storedUsers.find(
      (u) =>
        u.phone &&
        normalizePhone(u.phone) === normalized &&
        u.accountStatus === 'active'
    );
    if (match) return true;
  } catch {
    // ignore
  }

  return false;
}

// ─── POST /api/auth/otp/send ────────────────────────────────────────
// Sends an OTP to the given Indian mobile number via Twilio Verify (or Dev Mode)
router.post('/send', async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }

    if (!isValidIndianMobile(phone)) {
      return res.status(400).json({
        error: 'Please enter a valid 10-digit Indian mobile number',
      });
    }

    const normalized = normalizePhone(phone);

    // Check for duplicate phone
    const alreadyRegistered = await isPhoneRegistered(normalized);
    if (alreadyRegistered) {
      return res.status(409).json({
        error: 'This mobile number is already registered with another account',
      });
    }

    // Rate limiting
    const rateEntry = getRateLimit(normalized);
    const now = Date.now();

    if (rateEntry.attempts >= MAX_SEND_ATTEMPTS) {
      const resetIn = Math.ceil(
        (RATE_LIMIT_WINDOW_MS - (now - rateEntry.firstAttemptAt)) / 1000
      );
      return res.status(429).json({
        error: `Too many OTP requests. Please try again in ${Math.ceil(resetIn / 60)} minute(s).`,
        retryAfter: resetIn,
      });
    }

    // Cooldown between sends
    if (rateEntry.lastAttemptAt > 0) {
      const secondsSinceLast = (now - rateEntry.lastAttemptAt) / 1000;
      if (secondsSinceLast < COOLDOWN_SECONDS) {
        const waitFor = Math.ceil(COOLDOWN_SECONDS - secondsSinceLast);
        return res.status(429).json({
          error: `Please wait ${waitFor} seconds before requesting another OTP.`,
          retryAfter: waitFor,
        });
      }
    }

    const twilioReady = isTwilioConfigured();

    if (twilioReady) {
      // Send OTP via real Twilio Verify
      const client = getTwilioClient();
      const { verifyServiceSid } = getTwilioConfig();

      if (!client || !verifyServiceSid) {
        return res.status(503).json({
          error: 'SMS service configuration error. Please check Twilio settings.',
        });
      }

      try {
        const verification = await client.verify.v2
          .services(verifyServiceSid)
          .verifications.create({
            to: normalized,
            channel: 'sms',
          });

        // Update rate limit
        rateEntry.attempts += 1;
        rateEntry.lastAttemptAt = now;

        console.log(`[OTP] Twilio verification sent to ${normalized}, status: ${verification.status}`);

        return res.json({
          success: true,
          message: 'OTP sent successfully to your mobile number',
          cooldown: COOLDOWN_SECONDS,
        });
      } catch (twilioErr: any) {
        console.error('[OTP] Twilio send error:', twilioErr.message);

        if (twilioErr.code === 60203) {
          return res.status(429).json({
            error: 'Maximum verification attempts reached on Twilio. Please try again later.',
          });
        }

        if (
          twilioErr.code === 21608 ||
          twilioErr.code === 60200 ||
          twilioErr.message?.includes('verified tester') ||
          twilioErr.message?.includes('unverified')
        ) {
          return res.status(403).json({
            error:
              'Twilio Trial requires this phone number to be added as a Verified Caller ID / Tester in your Twilio Console (Phone Numbers > Manage > Verified Caller IDs).',
            isTrialUnverified: true,
          });
        }

        return res.status(500).json({
          error: `Failed to send SMS OTP: ${twilioErr.message || 'Twilio verification failed'}`,
        });
      }
    } else {
      // ─── Development Simulation Mode ──────────────────────────────
      // Generate a 6-digit numeric code
      const devCode = Math.floor(100000 + Math.random() * 900000).toString();
      devOtpMap.set(normalized, {
        code: devCode,
        expiresAt: now + DEV_OTP_VALIDITY_MS,
      });

      // Update rate limit
      rateEntry.attempts += 1;
      rateEntry.lastAttemptAt = now;

      console.log(`\n============================================================`);
      console.log(`🌾 [AgriTrack OTP] DEV SIMULATION (Twilio credentials not configured)`);
      console.log(`📲 Mobile Number: ${normalized}`);
      console.log(`🔑 Verification OTP Code: ${devCode}`);
      console.log(`ℹ️ Code expires in 5 minutes.`);
      console.log(`💡 To send real SMS via Twilio, configure in backend/.env:`);
      console.log(`   TWILIO_ACCOUNT_SID=...`);
      console.log(`   TWILIO_AUTH_TOKEN=...`);
      console.log(`   TWILIO_VERIFY_SERVICE_SID=...`);
      console.log(`============================================================\n`);

      return res.json({
        success: true,
        message: `OTP sent! (Dev Mode: OTP is ${devCode})`,
        devCode,
        cooldown: COOLDOWN_SECONDS,
      });
    }
  } catch (err: any) {
    console.error('[OTP] Send error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/otp/verify ──────────────────────────────────────
// Verifies the OTP code for a given phone number
router.post('/verify', async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Mobile number and OTP code are required' });
    }

    if (!isValidIndianMobile(phone)) {
      return res.status(400).json({ error: 'Invalid mobile number' });
    }

    const normalized = normalizePhone(phone);

    // Rate limit verification attempts
    const rateEntry = getRateLimit(normalized);
    if (rateEntry.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
      const resetIn = Math.ceil(
        (RATE_LIMIT_WINDOW_MS - (Date.now() - rateEntry.firstAttemptAt)) / 1000
      );
      return res.status(429).json({
        error: `Too many verification attempts. Please try again in ${Math.ceil(resetIn / 60)} minute(s).`,
        retryAfter: resetIn,
      });
    }

    // Validate OTP format
    const trimmedCode = String(code).trim();
    if (!/^\d{4,6}$/.test(trimmedCode)) {
      rateEntry.verifyAttempts += 1;
      return res.status(400).json({ error: 'Please enter a valid OTP code' });
    }

    const twilioReady = isTwilioConfigured();

    if (twilioReady) {
      const client = getTwilioClient();
      const { verifyServiceSid } = getTwilioConfig();

      if (!client || !verifyServiceSid) {
        return res.status(503).json({
          error: 'SMS service configuration error',
        });
      }

      try {
        const verificationCheck = await client.verify.v2
          .services(verifyServiceSid)
          .verificationChecks.create({
            to: normalized,
            code: trimmedCode,
          });

        if (verificationCheck.status === 'approved') {
          // Mark phone as verified
          verifiedPhonesMap.set(normalized, {
            verifiedAt: Date.now(),
            expiresAt: Date.now() + VERIFICATION_VALIDITY_MS,
          });

          // Reset verify attempts on success
          rateEntry.verifyAttempts = 0;

          console.log(`[OTP] Phone ${normalized} verified successfully via Twilio Verify`);

          return res.json({
            success: true,
            verified: true,
            message: 'Mobile number verified successfully',
          });
        } else {
          rateEntry.verifyAttempts += 1;
          return res.status(400).json({
            error: 'Invalid or expired OTP. Please try again.',
            verified: false,
          });
        }
      } catch (twilioErr: any) {
        console.error('[OTP] Twilio verify error:', twilioErr.message);
        rateEntry.verifyAttempts += 1;

        if (twilioErr.code === 20404) {
          return res.status(400).json({
            error: 'OTP has expired. Please request a new one.',
            verified: false,
            expired: true,
          });
        }

        return res.status(400).json({
          error: 'Verification failed. Please request a new OTP.',
          verified: false,
        });
      }
    } else {
      // ─── Development Verification Mode ────────────────────────────
      const devEntry = devOtpMap.get(normalized);
      const now = Date.now();

      if (!devEntry || now > devEntry.expiresAt) {
        devOtpMap.delete(normalized);
        rateEntry.verifyAttempts += 1;
        return res.status(400).json({
          error: 'OTP has expired or was not requested. Please request a new one.',
          verified: false,
          expired: true,
        });
      }

      if (devEntry.code !== trimmedCode) {
        rateEntry.verifyAttempts += 1;
        return res.status(400).json({
          error: 'Invalid OTP code. Please enter the 4-digit code provided.',
          verified: false,
        });
      }

      // Valid Dev OTP
      devOtpMap.delete(normalized);
      verifiedPhonesMap.set(normalized, {
        verifiedAt: now,
        expiresAt: now + VERIFICATION_VALIDITY_MS,
      });

      // Reset verify attempts on success
      rateEntry.verifyAttempts = 0;

      console.log(`[OTP] Dev verification successful for ${normalized}`);

      return res.json({
        success: true,
        verified: true,
        message: 'Mobile number verified successfully',
      });
    }
  } catch (err: any) {
    console.error('[OTP] Verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/auth/otp/status ───────────────────────────────────────
// Check if a phone number has been verified and the verification is still valid
router.get('/status', async (req: Request, res: Response): Promise<any> => {
  try {
    const phone = req.query.phone as string;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const normalized = normalizePhone(phone);
    const verified = verifiedPhonesMap.get(normalized);

    if (verified && verified.expiresAt > Date.now()) {
      return res.json({ verified: true, expiresIn: Math.floor((verified.expiresAt - Date.now()) / 1000) });
    }

    // Clean up expired entry
    if (verified) {
      verifiedPhonesMap.delete(normalized);
    }

    return res.json({ verified: false });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Export verified phone check for use in auth.ts register ────────
export function isPhoneVerified(phone: string): boolean {
  const normalized = normalizePhone(phone);
  const entry = verifiedPhonesMap.get(normalized);
  if (entry && entry.expiresAt > Date.now()) {
    return true;
  }
  // Clean up expired
  if (entry) {
    verifiedPhonesMap.delete(normalized);
  }
  return false;
}

export function consumePhoneVerification(phone: string): void {
  const normalized = normalizePhone(phone);
  verifiedPhonesMap.delete(normalized);
}

export { normalizePhone, isValidIndianMobile };

export default router;
