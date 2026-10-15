import { Router, Request, Response } from 'express';
import { query, isPostgresConfigured } from '../db';
import { validateIncomeInput } from '../lib/validation';
import { INITIAL_DEMO_INCOME } from '../lib/mockData';
import { generateId } from '../lib/utils';
import { IncomeRecord } from '../types';

const router = Router();
let fallbackIncome: IncomeRecord[] = [...INITIAL_DEMO_INCOME];

// GET /api/income
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
            income_id as "incomeId",
            user_id as "userId",
            crop_cycle_id as "cropCycleId",
            crop_type as "cropType",
            quantity::float as quantity,
            quantity_unit as "quantityUnit",
            unit_price::float as "unitPrice",
            total_amount::float as "totalAmount",
            TO_CHAR(sale_date, 'YYYY-MM-DD') as "saleDate",
            buyer_name as "buyerName",
            notes,
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM income
          WHERE user_id = $1
          ORDER BY sale_date DESC;
        `;
        const dbRes = await query(sql, [userId]);
        return res.json({ success: true, data: dbRes.rows });
      } catch (dbErr: any) {
        console.warn('PostgreSQL get income error, using demo fallback:', dbErr.message);
      }
    }

    const income = fallbackIncome.filter((i) => i.userId === userId || userId.startsWith('demo'));
    return res.json({ success: true, data: income });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// POST /api/income
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const body = req.body;
    const validation = validateIncomeInput(body);

    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const incomeId = body.incomeId || generateId('inc');
    const now = new Date().toISOString();

    const incomeRecord: IncomeRecord = {
      incomeId,
      userId: body.userId,
      cropCycleId: body.cropCycleId,
      cropType: body.cropType,
      quantity: Number(body.quantity),
      quantityUnit: body.quantityUnit,
      unitPrice: Number(body.unitPrice),
      totalAmount: Number(body.totalAmount),
      saleDate: body.saleDate,
      buyerName: body.buyerName || '',
      notes: body.notes || '',
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    if (isPostgresConfigured()) {
      try {
        const sql = `
          INSERT INTO income (
            income_id, user_id, crop_cycle_id, crop_type, quantity,
            quantity_unit, unit_price, total_amount, sale_date, buyer_name,
            notes, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          ON CONFLICT (income_id) DO UPDATE SET
            crop_cycle_id = EXCLUDED.crop_cycle_id,
            crop_type = EXCLUDED.crop_type,
            quantity = EXCLUDED.quantity,
            quantity_unit = EXCLUDED.quantity_unit,
            unit_price = EXCLUDED.unit_price,
            total_amount = EXCLUDED.total_amount,
            sale_date = EXCLUDED.sale_date,
            buyer_name = EXCLUDED.buyer_name,
            notes = EXCLUDED.notes,
            updated_at = NOW();
        `;

        await query(sql, [
          incomeId,
          incomeRecord.userId,
          incomeRecord.cropCycleId,
          incomeRecord.cropType,
          incomeRecord.quantity,
          incomeRecord.quantityUnit,
          incomeRecord.unitPrice,
          incomeRecord.totalAmount,
          incomeRecord.saleDate,
          incomeRecord.buyerName || null,
          incomeRecord.notes || '',
        ]);

        await query(
          'INSERT INTO activity_logs (log_id, user_id, action_type, entity_type, entity_id, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [generateId('log'), incomeRecord.userId, 'created', 'income', incomeId, `Sold ${incomeRecord.quantity} ${incomeRecord.quantityUnit} of ${incomeRecord.cropType} for ₹${incomeRecord.totalAmount}`]
        );
      } catch (dbErr: any) {
        console.warn('PostgreSQL insert income error, using fallback:', dbErr.message);
      }
    }

    const existingIdx = fallbackIncome.findIndex((i) => i.incomeId === incomeId);
    if (existingIdx >= 0) {
      fallbackIncome[existingIdx] = incomeRecord;
    } else {
      fallbackIncome.unshift(incomeRecord);
    }

    return res.status(201).json({ success: true, data: incomeRecord });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save income' });
  }
});

// PATCH & PUT /api/income/:id
const updateIncomeHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const updates = req.body;

    if (isPostgresConfigured()) {
      try {
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (updates.cropType !== undefined) {
          fields.push(`crop_type = $${idx++}`);
          values.push(updates.cropType);
        }
        if (updates.cropCycleId !== undefined) {
          fields.push(`crop_cycle_id = $${idx++}`);
          values.push(updates.cropCycleId);
        }
        if (updates.quantity !== undefined) {
          fields.push(`quantity = $${idx++}`);
          values.push(Number(updates.quantity));
        }
        if (updates.quantityUnit !== undefined) {
          fields.push(`quantity_unit = $${idx++}`);
          values.push(updates.quantityUnit);
        }
        if (updates.unitPrice !== undefined) {
          fields.push(`unit_price = $${idx++}`);
          values.push(Number(updates.unitPrice));
        }
        if (updates.totalAmount !== undefined) {
          fields.push(`total_amount = $${idx++}`);
          values.push(Number(updates.totalAmount));
        }
        if (updates.saleDate !== undefined) {
          fields.push(`sale_date = $${idx++}`);
          values.push(updates.saleDate);
        }
        if (updates.buyerName !== undefined) {
          fields.push(`buyer_name = $${idx++}`);
          values.push(updates.buyerName || null);
        }
        if (updates.notes !== undefined) {
          fields.push(`notes = $${idx++}`);
          values.push(updates.notes || null);
        }

        fields.push(`updated_at = NOW()`);
        values.push(id);

        const sql = `UPDATE income SET ${fields.join(', ')} WHERE income_id = $${idx}`;
        await query(sql, values);

        if (updates.userId) {
          await query(
            'INSERT INTO activity_logs (log_id, user_id, action_type, entity_type, entity_id, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
            [generateId('log'), updates.userId, 'updated', 'income', id, `Updated income #${id}`]
          );
        }
      } catch (dbErr: any) {
        console.warn('PostgreSQL update income error:', dbErr.message);
      }
    }

    const idx = fallbackIncome.findIndex((i) => i.incomeId === id);
    if (idx >= 0) {
      fallbackIncome[idx] = { ...fallbackIncome[idx], ...updates, updatedAt: new Date().toISOString() };
    }

    return res.json({ success: true, message: `Updated income #${id}` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update income' });
  }
};

router.patch('/:id', updateIncomeHandler);
router.put('/:id', updateIncomeHandler);

// DELETE /api/income/:id
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = (req.query.userId as string) || 'demo_farmer_1';

    if (isPostgresConfigured()) {
      try {
        await query('DELETE FROM income WHERE income_id = $1', [id]);
        await query(
          'INSERT INTO activity_logs (log_id, user_id, action_type, entity_type, entity_id, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [generateId('log'), userId, 'deleted', 'income', id, `Deleted income #${id}`]
        );
      } catch (dbErr: any) {
        console.warn('PostgreSQL delete income error:', dbErr.message);
      }
    }

    fallbackIncome = fallbackIncome.filter((i) => i.incomeId !== id);
    return res.json({ success: true, message: `Deleted income #${id}` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete income' });
  }
});

export default router;
