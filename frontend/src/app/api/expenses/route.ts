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
            type,
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
      type,
      description,
      amount,
      duration,
      labourCount,
      expenseDate,
      receiptUrl,
    } = body;

    if (!userId || !type || amount === undefined || !expenseDate) {
      return NextResponse.json({ error: 'Missing required expense fields' }, { status: 400 });
    }

    const expenseId = generateId('exp');
    const now = new Date().toISOString();

    if (isPostgresConfigured()) {
      try {
        const sql = `
          INSERT INTO expenses (
            expense_id, user_id, crop_cycle_id, type, description,
            amount, duration, labour_count, expense_date, receipt_url,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          RETURNING 
            expense_id as "expenseId",
            user_id as "userId",
            crop_cycle_id as "cropCycleId",
            type,
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
          userId,
          cropCycleId || null,
          type,
          description || '',
          Number(amount),
          duration || null,
          labourCount ? parseInt(labourCount, 10) : null,
          expenseDate,
          receiptUrl || null,
        ]);

        const created = { ...dbRes.rows[0], amount: Number(dbRes.rows[0].amount) };
        return NextResponse.json({ success: true, data: created }, { status: 201 });
      } catch (dbErr: any) {
        console.warn('PostgreSQL create expense error, falling back:', dbErr.message);
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
