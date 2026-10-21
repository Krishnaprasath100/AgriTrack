import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      cropCycleId,
      type,
      description,
      amount,
      duration,
      labourCount,
      expenseDate,
      receiptUrl,
    } = body;

    if (isPostgresConfigured()) {
      try {
        const sql = `
          UPDATE expenses
          SET 
            crop_cycle_id = COALESCE($1, crop_cycle_id),
            type = COALESCE($2, type),
            description = COALESCE($3, description),
            amount = COALESCE($4, amount),
            duration = COALESCE($5, duration),
            labour_count = COALESCE($6, labour_count),
            expense_date = COALESCE($7, expense_date),
            receipt_url = COALESCE($8, receipt_url),
            updated_at = NOW()
          WHERE expense_id = $9
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
          cropCycleId || null,
          type || null,
          description || null,
          amount !== undefined ? Number(amount) : null,
          duration || null,
          labourCount ? parseInt(labourCount, 10) : null,
          expenseDate || null,
          receiptUrl || null,
          id,
        ]);

        if (dbRes.rows.length > 0) {
          const updated = { ...dbRes.rows[0], amount: Number(dbRes.rows[0].amount) };
          return NextResponse.json({ success: true, data: updated });
        }
      } catch (dbErr: any) {
        console.warn('PostgreSQL update expense error:', dbErr.message);
      }
    }

    return NextResponse.json({ success: true, data: { expenseId: id, ...body } });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (isPostgresConfigured()) {
      try {
        await query(
          'DELETE FROM expenses WHERE expense_id = $1 AND ($2::text IS NULL OR user_id = $2)',
          [id, userId || null]
        );
      } catch (dbErr: any) {
        console.warn('PostgreSQL delete expense error:', dbErr.message);
      }
    }

    return NextResponse.json({ success: true, message: 'Expense deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
