import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, isPostgresConfigured } from '../db';
import { generateId } from '../lib/utils';
import { UserProfile, UserRole } from '../types';
import { addStoredUser, findStoredUserByEmail, getAllStoredUsers, updateStoredUser } from '../lib/serverStore';

const router = Router();

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

function isValidIndianMobile(phone: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(normalizePhone(phone));
}


// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { fullName, email, password, farmName, location, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    const normalizedPhone = phone?.trim() || undefined;

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const uid = generateId('usr');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();

    const assignedRole: UserRole =
      normalizedEmail === 'krishnaprasath720@gmail.com' ? 'admin' : 'farmer';

    // Check if email already registered in server store
    const existingStored = findStoredUserByEmail(normalizedEmail);
    if (existingStored) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    if (isPostgresConfigured()) {
      try {
        const existing = await query('SELECT uid FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
        if (existing.rows.length > 0) {
          return res.status(409).json({ error: 'An account with this email already exists' });
        }

        const insertQuery = `
          INSERT INTO users (uid, full_name, email, password_hash, role, farm_name, location, phone, account_status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW(), NOW())
          RETURNING uid, full_name, email, role, farm_name, location, phone, account_status, created_at, updated_at;
        `;

        const result = await query(insertQuery, [
          uid,
          fullName,
          normalizedEmail,
          passwordHash,
          assignedRole,
          farmName || 'My Farm',
          location || '',
          normalizedPhone,
        ]);

        const row = result.rows[0];
        const userProfile: UserProfile = {
          uid: row.uid,
          fullName: row.full_name,
          email: row.email,
          role: row.role,
          farmName: row.farm_name,
          location: row.location,
          phone: row.phone,
          accountStatus: row.account_status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        addStoredUser({ ...userProfile, passwordHash });

        return res.status(201).json({ success: true, user: userProfile });
      } catch (dbErr: any) {
        console.warn('PostgreSQL register error, using fallback:', dbErr.message);
      }
    }

    // Fallback profile
    const fallbackProfile: UserProfile = {
      uid,
      fullName,
      email: normalizedEmail,
      role: assignedRole,
      farmName: farmName || 'My Farm',
      location: location || '',
      phone: normalizedPhone,
      accountStatus: 'active',
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === 'admin') normalizedEmail = 'admin@agritrack.com';
    if (normalizedEmail === 'farmer') normalizedEmail = 'farmer@agritrack.com';
    if (normalizedEmail === 'farmer@agritrack.in') normalizedEmail = 'farmer@agritrack.com';
    if (normalizedEmail === 'admin@agritrack.in') normalizedEmail = 'admin@agritrack.com';

    if (isPostgresConfigured()) {
      try {
        const result = await query(
          'SELECT uid, full_name, email, password_hash, role, farm_name, location, phone, account_status, created_at, updated_at FROM users WHERE LOWER(email) = $1',
          [normalizedEmail]
        );

        if (result.rows.length > 0) {
          const row = result.rows[0];

          if (row.account_status === 'deactivated') {
            return res.status(403).json({ error: 'Your account has been deactivated by the administrator.' });
          }

          const isValid = await bcrypt.compare(password, row.password_hash);
          if (isValid) {
            const userProfile: UserProfile = {
              uid: row.uid,
              fullName: row.full_name,
              email: row.email,
              role: row.role,
              farmName: row.farm_name,
              location: row.location,
              phone: row.phone,
              accountStatus: row.account_status,
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

    // Server store check
    const storedUser = findStoredUserByEmail(normalizedEmail);
    if (storedUser) {
      if (storedUser.accountStatus === 'deactivated') {
        return res.status(403).json({ error: 'This account has been deactivated by the administrator.' });
      }

      let isValid = false;
      if (storedUser.passwordHash) {
        try {
          isValid = await bcrypt.compare(password, storedUser.passwordHash);
        } catch {
          isValid = false;
        }
      }

      if (isValid) {
        const { passwordHash, ...safeProfile } = storedUser;
        return res.json({ success: true, user: safeProfile });
      } else {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    return res.status(401).json({ error: 'Invalid email or password' });
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

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let normalizedPhone: string | null = null;

    if (phone && phone.trim()) {
      if (!isValidIndianMobile(phone)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number' });
      }
      normalizedPhone = normalizePhone(phone);
    }

    // Check duplicate email and phone in PostgreSQL
    if (isPostgresConfigured()) {
      try {
        const emailCheck = await query('SELECT uid FROM users WHERE LOWER(email) = $1 AND uid != $2', [
          normalizedEmail,
          uid,
        ]);
        if (emailCheck.rows.length > 0) {
          return res.status(409).json({ error: 'Another account with this email already exists' });
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
            email: row.email,
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

    // Fallback store update
    const updated = updateStoredUser(uid, {
      fullName: fullName.trim(),
      email: normalizedEmail,
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

    // Fallback store check
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

export default router;
