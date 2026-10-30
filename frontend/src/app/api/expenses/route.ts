import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { INITIAL_DEMO_EXPENSES } from '@/lib/mockData';
import { generateId } from '@/lib/utils';
import { ExpenseRecord } from '@/types';

let fallbackExpenses: ExpenseRecord[] = [...INITIAL_DEMO_EXPENSES];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    if (isPostgresConfigured()) {
      try {
        const sql = `
          SELECT 
            expense_id as "expenseId",
            user_id as "userId",
            crop_cycle_id as "cropCycleId",
            crop_name as "cropName",
            type,
            payee,
            paid_from_account as "paidFromAccount",
            notes,
            description,
            amount,
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
        const mapped = dbRes.rows.map((r: any) => ({ ...r, amount: Number(r.amount) }));
        return NextResponse.json({ success: true, data: mapped });
      } catch (dbErr: any) {
        console.warn('PostgreSQL get expenses error, falling back:', dbErr.message);
      }
    }

    const filtered = fallbackExpenses.filter((e) => e.userId === userId || userId.startsWith('demo'));
    return NextResponse.json({ success: true, data: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      cropCycleId,
      cropName,
      type,
      payee,
      paidFromAccount,
      description,
      notes,
      amount,
      duration,
      labourCount,
      expenseDate,
      receiptUrl,
    } = body;

    if (!userId || !type || amount === undefined || !expenseDate) {
      return NextResponse.json({ error: 'Missing required expense fields' }, { status: 400 });
    }

    const expenseId = body.expenseId || generateId('exp');
    const now = new Date().toISOString();

    if (isPostgresConfigured()) {
      try {
        let safeCropCycleId: string | null = null;
        if (cropCycleId) {
          try {
            const ccCheck = await query('SELECT crop_cycle_id FROM crop_cycles WHERE crop_cycle_id = $1', [cropCycleId]);
            if (ccCheck.rows.length > 0) {
              safeCropCycleId = cropCycleId;
            }
          } catch {
            safeCropCycleId = null;
          }
        }

        let safeUserId = userId;
        const uCheck = await query('SELECT uid FROM users WHERE uid = $1', [userId]);
        if (uCheck.rows.length === 0) {
          const uEmailCheck = await query('SELECT uid FROM users WHERE LOWER(email) = LOWER($1)', [userId]);
          if (uEmailCheck.rows.length > 0) {
            safeUserId = uEmailCheck.rows[0].uid;
          } else {
            // Auto-sync user into PostgreSQL users table so foreign key constraint never fails
            try {
              await query(`
                INSERT INTO users (uid, full_name, email, password_hash, role, farm_name, account_status, phone_verified, email_verified, created_at, updated_at)
                VALUES ($1, $2, NULL, 'auth_managed', 'farmer', 'My Farm', 'active', true, false, NOW(), NOW())
                ON CONFLICT (uid) DO NOTHING;
              `, [userId, `Farmer ${String(userId).slice(-4)}`]);
              safeUserId = userId;
            } catch (syncErr: any) {
              console.warn('Could not auto-create user for expense:', syncErr.message);
            }
          }
        }

        const sql = `
          INSERT INTO expenses (
            expense_id, user_id, crop_cycle_id, crop_name, type, payee,
            paid_from_account, notes, description, amount, duration,
            labour_count, expense_date, receipt_url, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
          ON CONFLICT (expense_id) DO UPDATE SET
            crop_cycle_id = EXCLUDED.crop_cycle_id,
            crop_name = EXCLUDED.crop_name,
            type = EXCLUDED.type,
            payee = EXCLUDED.payee,
            paid_from_account = EXCLUDED.paid_from_account,
            notes = EXCLUDED.notes,
            description = EXCLUDED.description,
            amount = EXCLUDED.amount,
            duration = EXCLUDED.duration,
            labour_count = EXCLUDED.labour_count,
            expense_date = EXCLUDED.expense_date,
            receipt_url = EXCLUDED.receipt_url,
            updated_at = NOW()
          RETURNING 
            expense_id as "expenseId",
            user_id as "userId",
            crop_cycle_id as "cropCycleId",
            crop_name as "cropName",
            type,
            payee,
            paid_from_account as "paidFromAccount",
            notes,
            description,
            amount,
            duration,
            labour_count as "labourCount",
            TO_CHAR(expense_date, 'YYYY-MM-DD') as "expenseDate",
            receipt_url as "receiptUrl",
            created_at as "createdAt",
            updated_at as "updatedAt";
        `;
        const dbRes = await query(sql, [
          expenseId,
          safeUserId,
          safeCropCycleId,
          cropName || null,
          type,
          payee || null,
          paidFromAccount || null,
          notes || null,
          description?.trim() || `${type} farm operation`,
          Number(amount),
          duration || null,
          labourCount ? parseInt(labourCount, 10) : null,
          expenseDate,
          receiptUrl || null,
        ]);

        const created = { ...dbRes.rows[0], amount: Number(dbRes.rows[0].amount) };
        return NextResponse.json({ success: true, data: created }, { status: 201 });
      } catch (dbErr: any) {
        console.error('PostgreSQL create expense error:', dbErr.message);
      }
    }

    const newExpense: ExpenseRecord = {
      expenseId,
      userId,
      cropCycleId,
      type,
      description: description || '',
      amount: Number(amount),
      duration,
      labourCount: labourCount ? parseInt(labourCount, 10) : undefined,
      expenseDate,
      receiptUrl,
      createdAt: now,
      updatedAt: now,
    };

    fallbackExpenses.unshift(newExpense);
    return NextResponse.json({ success: true, data: newExpense }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
