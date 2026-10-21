import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { INITIAL_DEMO_CROPS, INITIAL_DEMO_EXPENSES, INITIAL_DEMO_INCOME } from '@/lib/mockData';
import { CropCycle, ExpenseRecord, IncomeRecord } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'demo_farmer_1';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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
            status,
            TO_CHAR(seeding_date, 'YYYY-MM-DD') as "seedingDate",
            TO_CHAR(expected_harvest_date, 'YYYY-MM-DD') as "expectedHarvestDate"
          FROM crop_cycles
          WHERE user_id = $1;
        `;
        const expSql = `
          SELECT 
            expense_id as "expenseId",
            crop_cycle_id as "cropCycleId",
            amount::float as amount,
            TO_CHAR(expense_date, 'YYYY-MM-DD') as "expenseDate"
          FROM expenses
          WHERE user_id = $1;
        `;
        const incSql = `
          SELECT 
            income_id as "incomeId",
            crop_cycle_id as "cropCycleId",
            total_amount::float as "totalAmount",
            TO_CHAR(sale_date, 'YYYY-MM-DD') as "saleDate"
          FROM income
          WHERE user_id = $1;
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
        console.warn('PostgreSQL profit query error, using fallback:', dbErr.message);
      }
    }

    if (crops.length === 0 && expenses.length === 0 && income.length === 0) {
      crops = INITIAL_DEMO_CROPS.filter((c) => c.userId === userId || userId.startsWith('demo'));
      expenses = INITIAL_DEMO_EXPENSES.filter((e) => e.userId === userId || userId.startsWith('demo'));
      income = INITIAL_DEMO_INCOME.filter((i) => i.userId === userId || userId.startsWith('demo'));
    }

    const filteredExpenses = expenses.filter((e) => {
      if (startDate && e.expenseDate < startDate) return false;
      if (endDate && e.expenseDate > endDate) return false;
      return true;
    });

    const filteredIncome = income.filter((i) => {
      if (startDate && i.saleDate < startDate) return false;
      if (endDate && i.saleDate > endDate) return false;
      return true;
    });

    const totalIncome = filteredIncome.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    const cropProfits = crops.map((crop) => {
      const cExp = filteredExpenses
        .filter((e) => e.cropCycleId === crop.cropCycleId)
        .reduce((s, e) => s + (e.amount || 0), 0);
      const cInc = filteredIncome
        .filter((i) => i.cropCycleId === crop.cropCycleId)
        .reduce((s, i) => s + (i.totalAmount || 0), 0);
      const profit = cInc - cExp;
      const margin = cInc > 0 ? Math.round((profit / cInc) * 100) : cExp > 0 ? -100 : 0;

      return {
        cropCycleId: crop.cropCycleId,
        cropName: crop.cropType,
        farmName: crop.farmName,
        status: crop.status,
        totalIncome: cInc,
        totalExpenses: cExp,
        netProfit: profit,
        profitMargin: margin,
      };
    });

    return NextResponse.json({
      success: true,
      totalIncome,
      totalExpenses,
      netProfit,
      cropProfits,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to calculate profit metrics' }, { status: 500 });
  }
}
