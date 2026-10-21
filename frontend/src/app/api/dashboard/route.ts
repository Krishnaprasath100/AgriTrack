import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { INITIAL_DEMO_CROPS, INITIAL_DEMO_EXPENSES, INITIAL_DEMO_INCOME } from '@/lib/mockData';
import { CropCycle, ExpenseRecord, IncomeRecord } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'demo_farmer_1';

    let crops: CropCycle[] = [];
    let expenses: ExpenseRecord[] = [];
    let income: IncomeRecord[] = [];

    if (isPostgresConfigured()) {
      try {
        const cropsSql = `
          SELECT 
            crop_cycle_id as "cropCycleId",
            user_id as "userId",
            crop_type as "cropType",
            farm_name as "farmName",
            land_area as "landArea",
            land_area_unit as "landAreaUnit",
            TO_CHAR(seeding_date, 'YYYY-MM-DD') as "seedingDate",
            TO_CHAR(expected_harvest_date, 'YYYY-MM-DD') as "expectedHarvestDate",
            TO_CHAR(actual_harvest_date, 'YYYY-MM-DD') as "actualHarvestDate",
            status,
            notes,
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM crop_cycles
          WHERE user_id = $1
          ORDER BY seeding_date DESC;
        `;
        const expSql = `
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
        const incSql = `
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

        const [cRes, eRes, iRes] = await Promise.all([
          query(cropsSql, [userId]),
          query(expSql, [userId]),
          query(incSql, [userId]),
        ]);

        crops = cRes.rows;
        expenses = eRes.rows;
        income = iRes.rows;
      } catch (dbErr: any) {
        console.warn('PostgreSQL dashboard summary query error, using demo data:', dbErr.message);
      }
    }

    if (crops.length === 0 && expenses.length === 0 && income.length === 0) {
      crops = INITIAL_DEMO_CROPS.filter((c) => c.userId === userId || userId.startsWith('demo'));
      expenses = INITIAL_DEMO_EXPENSES.filter((e) => e.userId === userId || userId.startsWith('demo'));
      income = INITIAL_DEMO_INCOME.filter((i) => i.userId === userId || userId.startsWith('demo'));
    }

    const totalIncome = income.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    const activeCrops = crops.filter((c) => c.status === 'Growing' || c.status === 'Ready to Harvest');
    const upcomingHarvests = crops
      .filter((c) => c.status !== 'Harvested')
      .sort((a, b) => a.expectedHarvestDate.localeCompare(b.expectedHarvestDate));

    return NextResponse.json({
      success: true,
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
        activeCropCount: activeCrops.length,
        completedCropCount: crops.filter((c) => c.status === 'Harvested').length,
        upcomingHarvestCount: upcomingHarvests.length,
      },
      activeCrops: activeCrops.slice(0, 4),
      recentExpenses: expenses.slice(0, 5),
      recentIncome: income.slice(0, 5),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate dashboard summary' }, { status: 500 });
  }
}
