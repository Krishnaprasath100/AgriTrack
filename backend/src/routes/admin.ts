import { Router, Request, Response } from 'express';
import { query, isPostgresConfigured } from '../db';
import { getAllStoredUsers, updateStoredUserStatus } from '../lib/serverStore';
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
            role,
            farm_name as "farmName",
            location,
            phone,
            account_status as "accountStatus",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM users
          ORDER BY created_at DESC;
        `;
        const dbRes = await query(sql);
        if (dbRes.rows.length > 0) {
          return res.json({ success: true, data: dbRes.rows });
        }
      } catch (dbErr: any) {
        console.warn('PostgreSQL admin users query error, using fallback:', dbErr.message);
      }
    }

    const storedUsers = getAllStoredUsers().map(({ passwordHash, ...safeUser }) => safeUser);
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

export default router;
