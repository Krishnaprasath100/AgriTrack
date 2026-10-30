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
              console.warn('Could not auto-create user for income:', syncErr.message);
            }
          }
        }

        const sql = `
          INSERT INTO income (
            income_id, user_id, crop_cycle_id, crop_type, quantity,
            quantity_unit, unit_price, total_amount, sale_date, buyer_name,
            notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
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
            updated_at = NOW()
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
          safeUserId,
          safeCropCycleId,
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
        console.error('PostgreSQL create income error:', dbErr.message);
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
