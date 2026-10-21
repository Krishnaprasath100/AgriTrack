import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { INITIAL_DEMO_INCOME } from '@/lib/mockData';
import { generateId } from '@/lib/utils';
import { IncomeRecord } from '@/types';

let fallbackIncome: IncomeRecord[] = [...INITIAL_DEMO_INCOME];

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
            income_id as "incomeId",
            user_id as "userId",
            crop_cycle_id as "cropCycleId",
            crop_type as "cropType",
            quantity,
            quantity_unit as "quantityUnit",
            unit_price as "unitPrice",
            total_amount as "totalAmount",
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
        const mapped = dbRes.rows.map((r: any) => ({
          ...r,
          quantity: Number(r.quantity),
          unitPrice: Number(r.unitPrice),
          totalAmount: Number(r.totalAmount),
        }));
        return NextResponse.json({ success: true, data: mapped });
      } catch (dbErr: any) {
        console.warn('PostgreSQL get income error, falling back:', dbErr.message);
      }
    }

    const filtered = fallbackIncome.filter((i) => i.userId === userId || userId.startsWith('demo'));
    return NextResponse.json({ success: true, data: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch income records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      cropCycleId,
      cropType,
      quantity,
      quantityUnit = 'quintal',
      unitPrice,
      saleDate,
      buyerName,
      notes,
    } = body;

    if (!userId || !cropType || quantity === undefined || unitPrice === undefined || !saleDate) {
      return NextResponse.json({ error: 'Missing required income fields' }, { status: 400 });
    }

    const incomeId = generateId('inc');
    const totalAmount = Math.round(Number(quantity) * Number(unitPrice) * 100) / 100;
    const now = new Date().toISOString();

    if (isPostgresConfigured()) {
      try {
        const sql = `
          INSERT INTO income (
            income_id, user_id, crop_cycle_id, crop_type, quantity,
            quantity_unit, unit_price, total_amount, sale_date, buyer_name,
            notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING 
            income_id as "incomeId",
            user_id as "userId",
            crop_cycle_id as "cropCycleId",
            crop_type as "cropType",
            quantity,
            quantity_unit as "quantityUnit",
            unit_price as "unitPrice",
            total_amount as "totalAmount",
            TO_CHAR(sale_date, 'YYYY-MM-DD') as "saleDate",
            buyer_name as "buyerName",
            notes,
            created_at as "createdAt",
            updated_at as "updatedAt";
        `;
        const dbRes = await query(sql, [
          incomeId,
          userId,
          cropCycleId || null,
          cropType,
          Number(quantity),
          quantityUnit,
          Number(unitPrice),
          totalAmount,
          saleDate,
          buyerName || '',
          notes || '',
        ]);

        const created = {
          ...dbRes.rows[0],
          quantity: Number(dbRes.rows[0].quantity),
          unitPrice: Number(dbRes.rows[0].unitPrice),
          totalAmount: Number(dbRes.rows[0].totalAmount),
        };
        return NextResponse.json({ success: true, data: created }, { status: 201 });
      } catch (dbErr: any) {
        console.warn('PostgreSQL create income error, falling back:', dbErr.message);
      }
    }

    const newIncome: IncomeRecord = {
      incomeId,
      userId,
      cropCycleId,
      cropType,
      quantity: Number(quantity),
      quantityUnit,
      unitPrice: Number(unitPrice),
      totalAmount,
      saleDate,
      buyerName,
      notes,
      createdAt: now,
      updatedAt: now,
    };

    fallbackIncome.unshift(newIncome);
    return NextResponse.json({ success: true, data: newIncome }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to record income' }, { status: 500 });
  }
}
