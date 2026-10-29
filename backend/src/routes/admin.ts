import { Router, Request, Response } from 'express';
import { query, isPostgresConfigured } from '../db';
import { getAllStoredUsers, updateStoredUserStatus, deleteStoredUser } from '../lib/serverStore';
import { generateId } from '../lib/utils';

const router = Router();

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response): Promise<any> => {
  try {
    if (isPostgresConfigured()) {
      try {
        const sql = `
          SELECT 
            uid,
            full_name as "fullName",
            email,
            password_hash as "password",
            role,
            farm_name as "farmName",
            location,
            phone,
            account_status as "accountStatus",
            COALESCE(phone_verified, false) as "phoneVerified",
            COALESCE(email_verified, false) as "emailVerified",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM users
          ORDER BY created_at DESC;
        `;
        const dbRes = await query(sql);
        return res.json({ success: true, data: dbRes.rows });
      } catch (dbErr: any) {
        console.error('PostgreSQL admin users query error:', dbErr);
        return res.status(500).json({ error: 'Failed to query database' });
      }
    }

    const storedUsers = getAllStoredUsers().map((u) => ({
      ...u,
      password: u.passwordHash,
    }));
    return res.json({ success: true, data: storedUsers });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { accountStatus, adminUid } = req.body;

    if (!accountStatus || !['active', 'deactivated'].includes(accountStatus)) {
      return res.status(400).json({ error: 'Invalid accountStatus parameter' });
    }

    if (isPostgresConfigured()) {
      try {
        await query(
          'UPDATE users SET account_status = $1, updated_at = NOW() WHERE uid = $2',
          [accountStatus, id]
        );
      } catch (dbErr: any) {
        console.warn('PostgreSQL update user status error:', dbErr.message);
      }
    }

    updateStoredUserStatus(id, accountStatus);

    return res.json({
      success: true,
      message: `User ${id} status updated to ${accountStatus}`,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user status' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    // Guard against deleting the primary admin account
    const stored = getAllStoredUsers().find(
      (u) => u.uid === id || (u.email && u.email.toLowerCase() === id.toLowerCase())
    );
    if (stored?.email?.toLowerCase() === 'krishnaprasath720@gmail.com') {
      return res.status(403).json({ error: 'Cannot delete primary admin account' });
    }

    if (isPostgresConfigured()) {
      try {
        await query('DELETE FROM users WHERE uid = $1', [id]);
      } catch (dbErr: any) {
        console.warn('PostgreSQL delete user error:', dbErr.message);
      }
    }

    deleteStoredUser(id);

    return res.json({
      success: true,
      message: `User ${id} deleted successfully`,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
