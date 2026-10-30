import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, isPostgresConfigured } from '../db';
import { generateId } from '../lib/utils';
import { UserProfile, UserRole } from '../types';
import {
  addStoredUser,
  findStoredUserByEmail,
  findStoredUserByIdentifier,
  getAllStoredUsers,
  updateStoredUser,
} from '../lib/serverStore';
import {
  sendMobileOtp,
  verifyMobileOtp,
  isValidMobileNumber,
} from '../lib/smsVerificationService';

const router = Router();

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

function isValidIndianMobile(phone: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(normalizePhone(phone));
}

async function verifyAndUpgradePassword(
  providedPassword: string,
  storedPasswordHash: string,
  userId?: string
): Promise<boolean> {
  if (!storedPasswordHash) return false;

  const trimmedProvided = providedPassword.trim();
  const trimmedStored = storedPasswordHash.trim();

  // 1. Direct plaintext match (exact or trimmed)
  if (
    providedPassword === storedPasswordHash ||
    trimmedProvided === trimmedStored ||
    providedPassword === trimmedStored ||
    trimmedProvided === storedPasswordHash
  ) {
    if (userId) {
      try {
        const salt = await bcrypt.genSalt(10);
        const upgradedHash = await bcrypt.hash(providedPassword, salt);
        if (isPostgresConfigured()) {
          await query('UPDATE users SET password_hash = $1 WHERE uid = $2', [upgradedHash, userId]);
        }
        updateStoredUser(userId, { passwordHash: upgradedHash });
      } catch (upgradeErr) {
        console.warn('Could not auto-upgrade password to bcrypt:', upgradeErr);
      }
    }
    return true;
  }

  // 2. If stored as bcrypt hash ($2a$, $2b$, or $2y$)
  if (/^\$2[aby]\$/.test(storedPasswordHash) || /^\$2[aby]\$/.test(trimmedStored)) {
    try {
      if (await bcrypt.compare(providedPassword, storedPasswordHash)) return true;
      if (await bcrypt.compare(trimmedProvided, storedPasswordHash)) return true;
      if (await bcrypt.compare(providedPassword, trimmedStored)) return true;
      if (await bcrypt.compare(trimmedProvided, trimmedStored)) return true;
    } catch {
      // fallback
    }
  }

  return false;
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req: Request, res: Response): Promise<any> => {
  try {
    const rawPhone = (req.body.phone || '').toString().trim();
    if (!rawPhone || !isValidMobileNumber(rawPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    const normalized = normalizePhone(rawPhone);
    const digits = rawPhone.replace(/\D/g, '').slice(-10);

    if (isPostgresConfigured()) {
      try {
        const existingPhone = await query(
          "SELECT uid FROM users WHERE phone IS NOT NULL AND REPLACE(REPLACE(phone, ' ', ''), '-', '') LIKE $1",
          [`%${digits}%`]
        );
        if (existingPhone.rows.length > 0 && digits.length === 10) {
          return res.status(409).json({ error: 'An account with this mobile number already exists.' });
        }
      } catch {
        // fallback
      }
    }

    const existingStored = findStoredUserByIdentifier(normalized);
    if (existingStored) {
      return res.status(409).json({ error: 'An account with this mobile number already exists.' });
    }

    const result = await sendMobileOtp(normalized);
    if (!result.success) {
      return res.status(400).json({ error: result.error || result.message });
    }

    return res.json({
      success: true,
      message: result.message,
      phone: result.phone,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to send SMS OTP.' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response): Promise<any> => {
  try {
    const phone = (req.body.phone || '').toString().trim();
    const otp = (req.body.otp || req.body.code || '').toString().trim();

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Mobile number and 6-digit OTP code are required.' });
    }

    const result = await verifyMobileOtp(phone, otp);
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Invalid or expired verification code.' });
    }

    return res.json({
      success: true,
      verified: true,
      message: 'Mobile number verified successfully.',
    });
  } catch {
    return res.status(500).json({ error: 'Verification failed.' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { fullName, email, password, farmName, location, phone } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const trimmedEmail = typeof email === 'string' && email.trim() ? email.toLowerCase().trim() : null;
    let normalizedPhone: string | null = null;
    if (phone && typeof phone === 'string' && phone.trim()) {
      normalizedPhone = phone.trim();
    }

    if (!trimmedEmail && !normalizedPhone) {
      return res.status(400).json({ error: 'Please provide either an email address or mobile number.' });
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email format or leave it blank' });
    }

    const uid = generateId('usr');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();

    const assignedRole: UserRole =
      trimmedEmail === 'krishnaprasath720@gmail.com' ? 'admin' : 'farmer';

    if (trimmedEmail) {
      const existingStored = findStoredUserByEmail(trimmedEmail);
      if (existingStored) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
    }

    if (isPostgresConfigured()) {
      try {
        if (trimmedEmail) {
          const existing = await query('SELECT uid FROM users WHERE LOWER(TRIM(email)) = $1', [trimmedEmail]);
          if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'An account with this email already exists' });
          }
        }

        if (normalizedPhone) {
          const cleanPhone = normalizedPhone.replace(/\D/g, '');
          if (cleanPhone.length >= 10) {
            const existingPhone = await query(
              "SELECT uid FROM users WHERE REPLACE(REPLACE(phone, ' ', ''), '-', '') LIKE $1",
              [`%${cleanPhone}%`]
            );
            if (existingPhone.rows.length > 0) {
              return res.status(409).json({ error: 'An account with this mobile number already exists' });
            }
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
            normalizedPhone,
          ]);
          row = result.rows[0];
        } catch (firstErr: any) {
          console.warn('Initial register insert failed, ensuring schema:', firstErr.message);
          const { ensureSchema } = await import('../db');
          await ensureSchema();
          const result = await query(insertQuery, [
            uid,
            fullName.trim(),
            trimmedEmail,
            passwordHash,
            assignedRole,
            farmName?.trim() || 'My Farm',
            location?.trim() || '',
            normalizedPhone,
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

        return res.status(201).json({ success: true, user: userProfile });
      } catch (dbErr: any) {
        console.error('PostgreSQL register error:', dbErr);
        return res.status(500).json({ error: `Database error creating user account: ${dbErr.message || 'Please try again'}` });
      }
    }

    const fallbackProfile: UserProfile = {
      uid,
      fullName: fullName.trim(),
      email: trimmedEmail || undefined,
      role: assignedRole,
      farmName: farmName?.trim() || 'My Farm',
      location: location?.trim() || '',
      phone: normalizedPhone || undefined,
      accountStatus: 'active',
      phoneVerified: false,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    addStoredUser({ ...fallbackProfile, passwordHash });
    return res.status(201).json({ success: true, user: fallbackProfile });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const rawIdentifier = (req.body.identifier || req.body.email || req.body.phone || req.body.username || '').toString().trim();
    const password = req.body.password;

    if (!rawIdentifier || !password) {
      return res.status(400).json({ error: 'Username/Email/Phone and password are required' });
    }

    let normalizedIdentifier = rawIdentifier.toLowerCase();
    if (normalizedIdentifier === 'admin') normalizedIdentifier = 'admin@agritrack.com';
    if (normalizedIdentifier === 'farmer') normalizedIdentifier = 'farmer@agritrack.com';
    if (normalizedIdentifier === 'farmer@agritrack.in') normalizedIdentifier = 'farmer@agritrack.com';
    if (normalizedIdentifier === 'admin@agritrack.in') normalizedIdentifier = 'admin@agritrack.com';

    const digits = rawIdentifier.replace(/\D/g, '');
    const phoneWithPrefix = digits.length === 10 ? `+91${digits}` : `+${digits}`;

    if (isPostgresConfigured()) {
      try {
        const result = await query(
          `SELECT uid, full_name, email, password_hash, role, farm_name, location, phone, account_status,
                  COALESCE(phone_verified, false) as phone_verified,
                  COALESCE(email_verified, false) as email_verified,
                  created_at, updated_at
           FROM users
           WHERE (email IS NOT NULL AND LOWER(TRIM(email)) = $1)
              OR (phone IS NOT NULL AND (
                   REPLACE(REPLACE(phone, ' ', ''), '-', '') = $2 OR
                   phone = $3 OR
                   phone = $4
                 ))
              OR (LOWER(TRIM(full_name)) = $1)`,
          [normalizedIdentifier, digits, rawIdentifier, phoneWithPrefix]
        );

        if (result.rows.length > 0) {
          const row = result.rows[0];

          if (row.account_status === 'deactivated') {
            return res.status(403).json({ error: 'Your account has been deactivated by the administrator.' });
          }

          const isValid = await verifyAndUpgradePassword(password, row.password_hash, row.uid);
          if (isValid) {
            const userProfile: UserProfile = {
              uid: row.uid,
              fullName: row.full_name,
              email: row.email || undefined,
              role: row.role,
              farmName: row.farm_name,
              location: row.location,
              phone: row.phone,
              accountStatus: row.account_status,
              phoneVerified: Boolean(row.phone_verified),
              emailVerified: Boolean(row.email_verified),
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            };

            return res.json({ success: true, user: userProfile });
          } else {
            return res.status(401).json({ error: 'Invalid password' });
          }
        }
      } catch (dbErr: any) {
        console.warn('PostgreSQL login error, falling back to server store:', dbErr.message);
      }
    }

    const storedUser = findStoredUserByIdentifier(rawIdentifier);
    if (storedUser) {
      if (storedUser.accountStatus === 'deactivated') {
        return res.status(403).json({ error: 'This account has been deactivated by the administrator.' });
      }

      let isValid = false;
      if (storedUser.passwordHash) {
        isValid = await verifyAndUpgradePassword(password, storedUser.passwordHash, storedUser.uid);
      }

      if (isValid) {
        const { passwordHash, ...safeProfile } = storedUser;
        return res.json({ success: true, user: safeProfile });
      } else {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    return res.status(401).json({ error: 'Invalid email/phone or password' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', async (req: Request, res: Response): Promise<any> => {
  try {
    const { uid, fullName, email, phone } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'User UID is required' });
    }

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const normalizedEmail = email && typeof email === 'string' && email.trim() ? email.toLowerCase().trim() : null;
    let normalizedPhone: string | null = null;

    if (phone && phone.trim()) {
      if (!isValidIndianMobile(phone)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number' });
      }
      normalizedPhone = normalizePhone(phone);
    }

    if (isPostgresConfigured()) {
      try {
        if (normalizedEmail) {
          const emailCheck = await query('SELECT uid FROM users WHERE LOWER(TRIM(email)) = $1 AND uid != $2', [
            normalizedEmail,
            uid,
          ]);
          if (emailCheck.rows.length > 0) {
            return res.status(409).json({ error: 'Another account with this email already exists' });
          }
        }

        if (normalizedPhone) {
          const phoneCheck = await query('SELECT uid FROM users WHERE phone = $1 AND uid != $2', [
            normalizedPhone,
            uid,
          ]);
          if (phoneCheck.rows.length > 0) {
            return res.status(409).json({ error: 'Another account with this mobile number already exists' });
          }
        }

        const updateResult = await query(
          `UPDATE users
           SET full_name = $1, email = $2, phone = $3, updated_at = NOW()
           WHERE uid = $4
           RETURNING uid, full_name, email, role, farm_name, location, phone, account_status, created_at, updated_at`,
          [fullName.trim(), normalizedEmail, normalizedPhone, uid]
        );

        if (updateResult.rows.length > 0) {
          const row = updateResult.rows[0];
          const userProfile: UserProfile = {
            uid: row.uid,
            fullName: row.full_name,
            email: row.email || undefined,
            role: row.role,
            farmName: row.farm_name,
            location: row.location,
            phone: row.phone,
            accountStatus: row.account_status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };

          updateStoredUser(uid, {
            fullName: userProfile.fullName,
            email: userProfile.email,
            phone: userProfile.phone,
          });

          return res.json({ success: true, user: userProfile });
        }
      } catch (dbErr: any) {
        console.warn('[Profile] DB update error, using fallback:', dbErr.message);
      }
    }

    const updated = updateStoredUser(uid, {
      fullName: fullName.trim(),
      email: normalizedEmail || undefined,
      phone: normalizedPhone || undefined,
    });

    if (updated) {
      const { passwordHash, ...safeProfile } = updated;
      return res.json({ success: true, user: safeProfile });
    }

    return res.status(404).json({ error: 'User not found' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response): Promise<any> => {
  try {
    const { uid, currentPassword, newPassword } = req.body;

    if (!uid || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    if (isPostgresConfigured()) {
      try {
        const userRes = await query('SELECT uid, password_hash FROM users WHERE uid = $1', [uid]);
        if (userRes.rows.length > 0) {
          const row = userRes.rows[0];
          const isValid = await bcrypt.compare(currentPassword, row.password_hash);
          if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
          }

          const salt = await bcrypt.genSalt(10);
          const newPasswordHash = await bcrypt.hash(newPassword, salt);

          await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE uid = $2', [
            newPasswordHash,
            uid,
          ]);

          updateStoredUser(uid, { passwordHash: newPasswordHash });

          return res.json({ success: true, message: 'Password updated successfully' });
        }
      } catch (dbErr: any) {
        console.warn('[ResetPassword] DB error, using fallback:', dbErr.message);
      }
    }

    const users = getAllStoredUsers();
    const stored = users.find((u) => u.uid === uid);
    if (!stored) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (stored.passwordHash) {
      const isValid = await bcrypt.compare(currentPassword, stored.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);
    updateStoredUser(uid, { passwordHash: newPasswordHash });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response): Promise<any> => {
  try {
    const { identifier, newPassword } = req.body;

    const rawId = (identifier || '').toString().trim();
    if (!rawId) {
      return res.status(400).json({ error: 'Please enter your registered email or mobile number.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
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
      return res.status(404).json({ error: 'No account found matching this email or mobile number.' });
    }

    return res.json({
      success: true,
      message: 'Password reset successfully! Please sign in with your new password.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
