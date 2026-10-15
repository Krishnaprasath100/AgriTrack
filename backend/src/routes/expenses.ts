import { Router, Request, Response } from 'express';
import { query, isPostgresConfigured } from '../db';
import { validateExpenseInput } from '../lib/validation';
import { INITIAL_DEMO_EXPENSES } from '../lib/mockData';
import { generateId } from '../lib/utils';
import { ExpenseRecord } from '../types';

const router = Router();
let fallbackExpenses: ExpenseRecord[] = [...INITIAL_DEMO_EXPENSES];

// GET /api/expenses
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    if (isPostgresConfigured()) {
      try {
        const sql = `
          SELECT 
            expense_id as "expenseId",
            user_id as "userId",
            crop_cycle_id as "cropCycleId",
            type,
            description,
            amount::float as amount,
            duration,
            labour_count as "labourCount",
            TO_CHAR(expense_date, 'YYYY-MM-DD') as "expenseDate",
            receipt_url as "receiptUrl",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM expenses
          WHERE user_id = $1
          ORDER BY expense_date DESC;
        `;
        const dbRes = await query(sql, [userId]);
        return res.json({ success: true, data: dbRes.rows });
      } catch (dbErr: any) {
        console.warn('PostgreSQL get expenses error, using demo fallback:', dbErr.message);
      }
    }

    const expenses = fallbackExpenses.filter((e) => e.userId === userId || userId.startsWith('demo'));
    return res.json({ success: true, data: expenses });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const body = req.body;
    const validation = validateExpenseInput(body);

    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const expenseId = body.expenseId || generateId('exp');
    const now = new Date().toISOString();

    const expenseRecord: ExpenseRecord = {
      expenseId,
      userId: body.userId,
      cropCycleId: body.cropCycleId,
      cropName: body.cropName,
      type: body.type,
      payee: body.payee,
      description: body.description || body.notes || body.type || 'Farm Expense',
      notes: body.notes || body.description || '',
      amount: Number(body.amount),
      paidFromAccount: body.paidFromAccount,
      duration: body.duration,
      labourCount: body.labourCount ? Number(body.labourCount) : undefined,
      expenseDate: body.expenseDate,
      receiptUrl: body.receiptUrl || '',
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    if (isPostgresConfigured()) {
      try {
        const sql = `
          INSERT INTO expenses (
            expense_id, user_id, crop_cycle_id, type, description, amount,
            duration, labour_count, expense_date, receipt_url, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT (expense_id) DO UPDATE SET
            crop_cycle_id = EXCLUDED.crop_cycle_id,
            type = EXCLUDED.type,
            description = EXCLUDED.description,
            amount = EXCLUDED.amount,
            duration = EXCLUDED.duration,
            labour_count = EXCLUDED.labour_count,
            expense_date = EXCLUDED.expense_date,
            receipt_url = EXCLUDED.receipt_url,
            updated_at = NOW();
        `;

        await query(sql, [
          expenseId,
          expenseRecord.userId,
          expenseRecord.cropCycleId,
          expenseRecord.type,
          expenseRecord.description,
          expenseRecord.amount,
          expenseRecord.duration || null,
          expenseRecord.labourCount || null,
          expenseRecord.expenseDate,
          expenseRecord.receiptUrl || null,
        ]);

        await query(
          'INSERT INTO activity_logs (log_id, user_id, action_type, entity_type, entity_id, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [generateId('log'), expenseRecord.userId, 'created', 'expense', expenseId, `Logged ₹${expenseRecord.amount} for ${expenseRecord.type}`]
        );
      } catch (dbErr: any) {
        console.warn('PostgreSQL insert expense error, using fallback:', dbErr.message);
      }
    }

    const existingIdx = fallbackExpenses.findIndex((e) => e.expenseId === expenseId);
    if (existingIdx >= 0) {
      fallbackExpenses[existingIdx] = expenseRecord;
    } else {
      fallbackExpenses.unshift(expenseRecord);
    }

    return res.status(201).json({ success: true, data: expenseRecord });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save expense' });
  }
});

// PATCH & PUT /api/expenses/:id
const updateExpenseHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const updates = req.body;

    if (isPostgresConfigured()) {
      try {
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (updates.type !== undefined) {
          fields.push(`type = $${idx++}`);
          values.push(updates.type);
        }
        if (updates.cropCycleId !== undefined) {
          fields.push(`crop_cycle_id = $${idx++}`);
          values.push(updates.cropCycleId);
        }
        if (updates.amount !== undefined) {
          fields.push(`amount = $${idx++}`);
          values.push(Number(updates.amount));
        }
        if (updates.description !== undefined) {
          fields.push(`description = $${idx++}`);
          values.push(updates.description);
        }
        if (updates.duration !== undefined) {
          fields.push(`duration = $${idx++}`);
          values.push(updates.duration || null);
        }
        if (updates.labourCount !== undefined) {
          fields.push(`labour_count = $${idx++}`);
          values.push(updates.labourCount ? Number(updates.labourCount) : null);
        }
        if (updates.expenseDate !== undefined) {
          fields.push(`expense_date = $${idx++}`);
          values.push(updates.expenseDate);
        }
        if (updates.receiptUrl !== undefined) {
          fields.push(`receipt_url = $${idx++}`);
          values.push(updates.receiptUrl || null);
        }

        fields.push(`updated_at = NOW()`);
        values.push(id);

        const sql = `UPDATE expenses SET ${fields.join(', ')} WHERE expense_id = $${idx}`;
        await query(sql, values);

        if (updates.userId) {
          await query(
            'INSERT INTO activity_logs (log_id, user_id, action_type, entity_type, entity_id, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
            [generateId('log'), updates.userId, 'updated', 'expense', id, `Updated expense #${id}`]
          );
        }
      } catch (dbErr: any) {
        console.warn('PostgreSQL update expense error:', dbErr.message);
      }
    }

    const idx = fallbackExpenses.findIndex((e) => e.expenseId === id);
    if (idx >= 0) {
      fallbackExpenses[idx] = { ...fallbackExpenses[idx], ...updates, updatedAt: new Date().toISOString() };
    }

    return res.json({ success: true, message: `Updated expense #${id}` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update expense' });
  }
};

router.patch('/:id', updateExpenseHandler);
router.put('/:id', updateExpenseHandler);

// DELETE /api/expenses/:id
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = (req.query.userId as string) || 'demo_farmer_1';

    if (isPostgresConfigured()) {
      try {
        await query('DELETE FROM expenses WHERE expense_id = $1', [id]);
        await query(
          'INSERT INTO activity_logs (log_id, user_id, action_type, entity_type, entity_id, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [generateId('log'), userId, 'deleted', 'expense', id, `Deleted expense #${id}`]
        );
      } catch (dbErr: any) {
        console.warn('PostgreSQL delete expense error:', dbErr.message);
      }
    }

    fallbackExpenses = fallbackExpenses.filter((e) => e.expenseId !== id);
    return res.json({ success: true, message: `Deleted expense #${id}` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
