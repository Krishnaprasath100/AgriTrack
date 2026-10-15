import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, isPostgresConfigured } from '../db';
import { generateId } from '../lib/utils';
import { UserProfile, UserRole } from '../types';
import { addStoredUser, findStoredUserByEmail } from '../lib/serverStore';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { fullName, email, password, farmName, location, phone, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const uid = generateId('usr');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();

    const assignedRole: UserRole =
      normalizedEmail === 'krishnaprasath720@gmail.com'
        ? 'admin'
        : role === 'admin'
        ? 'admin'
        : 'farmer';

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
          phone || '',
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
      phone: phone || '',
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

export default router;
