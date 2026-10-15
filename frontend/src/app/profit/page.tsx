'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { IncomeVsExpenseChart } from '@/components/ui/Charts';
import { CropProfitSummary, FinancialSummary, ExpenseRecord, IncomeRecord } from '@/types';
import { getFinancialMetrics, getExpenses, getIncome } from '@/lib/services/dataService';
import { formatINR, formatDate } from '@/lib/utils';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Award,
  AlertTriangle,
  ArrowRight,
  Filter,
  BarChart2,
  CheckCircle,
} from 'lucide-react';

export default function ProfitAnalysisPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Date Range state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    activeCropCount: 0,
    completedCropCount: 0,
    upcomingHarvestCount: 0,
  });

  const [cropProfits, setCropProfits] = useState<CropProfitSummary[]>([]);
  const [allExpenses, setAllExpenses] = useState<ExpenseRecord[]>([]);
  const [allIncome, setAllIncome] = useState<IncomeRecord[]>([]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getFinancialMetrics(user.uid, startDate || undefined, endDate || undefined);
      setSummary(data.summary);
      setCropProfits(data.cropProfits);

      const [exp, inc] = await Promise.all([getExpenses(user.uid), getIncome(user.uid)]);
      setAllExpenses(exp);
      setAllIncome(inc);
    } catch (err) {
      console.error('Failed to load profit metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, startDate, endDate]);

  // General unassigned expenses & income
  const unassignedExpenses = allExpenses.filter((e) => !e.cropCycleId);
  const unassignedIncome = allIncome.filter((i) => !i.cropCycleId);

  const totalUnassignedExpense = unassignedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalUnassignedIncome = unassignedIncome.reduce((s, i) => s + i.totalAmount, 0);

  // Most profitable crop
  const mostProfitableCrop = cropProfits.length > 0 && cropProfits[0].netProfit > 0 ? cropProfits[0] : null;

  return (
    <AppShell>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Net Profit & Agricultural Financial Analysis</h1>
          <p className="page-subtitle">
            Transparent revenue vs. cost calculations per crop cycle and overall farm enterprise
          </p>
        </div>

        {/* Date Filter Quick Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <Calendar size={14} color="var(--text-dim)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>From:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: '135px', padding: '4px 8px', fontSize: '0.82rem' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>To:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: '135px', padding: '4px 8px', fontSize: '0.82rem' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="btn btn-secondary btn-sm"
            >
              Reset Period
            </button>
          )}
        </div>
      </div>

      {/* Primary Financial Indicator Cards */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        {/* Total Income */}
        <div className="card" style={{ borderLeft: '4px solid var(--profit-green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Total Agricultural Revenue
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--primary-900)', margin: '8px 0 4px' }}>
            {formatINR(summary.totalIncome)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Gross proceeds from crop harvests and sales
          </div>
        </div>

        {/* Total Expenses */}
        <div className="card" style={{ borderLeft: '4px solid var(--loss-red)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Total Farming Expenditure
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={20} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--primary-900)', margin: '8px 0 4px' }}>
            {formatINR(summary.totalExpenses)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Total input seeds, fertilizers, labour, rent, power
          </div>
        </div>

        {/* Net Profit / Loss */}
        <div
          className="card"
          style={{
            borderLeft: `4px solid ${summary.netProfit >= 0 ? 'var(--profit-green)' : 'var(--loss-red)'}`,
            background: summary.netProfit >= 0 ? '#f0fdf4' : '#fff5f5',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Net Operational Profit
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: summary.netProfit >= 0 ? '#dcfce7' : '#fee2e2',
                color: summary.netProfit >= 0 ? '#15803d' : '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DollarSign size={20} />
            </div>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2rem',
              fontWeight: 800,
              color: summary.netProfit >= 0 ? 'var(--profit-green)' : 'var(--loss-red)',
              margin: '8px 0 4px',
            }}
          >
            {summary.netProfit >= 0 ? `+${formatINR(summary.netProfit)}` : `-${formatINR(Math.abs(summary.netProfit))}`}
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: summary.netProfit >= 0 ? '#166534' : '#991b1b' }}>
            {summary.netProfit > 0
              ? 'Positive Net Profit Margin'
              : summary.netProfit === 0
              ? 'Break-even Point (₹0)'
              : 'Deficit / Crop Investment Phase'}
          </div>
        </div>
      </div>

      {/* Most Profitable Crop Highlight Banner */}
      {mostProfitableCrop && (
        <div
          className="card"
          style={{
            marginBottom: '28px',
            background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#ffd166',
                color: '#1b4332',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Award size={30} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ffd166', fontWeight: 700 }}>
                HIGHEST PERFORMING CROP CYCLE
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 700 }}>
                {mostProfitableCrop.cropName} ({mostProfitableCrop.farmName || 'Field'})
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
                Total Revenue: {formatINR(mostProfitableCrop.totalIncome)} • Expenses: {formatINR(mostProfitableCrop.totalExpenses)}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Cycle Net Margin</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: '#74c69d' }}>
              +{formatINR(mostProfitableCrop.netProfit)} ({mostProfitableCrop.profitMargin}%)
            </div>
          </div>
        </div>
      )}

      {/* Visual Chart Comparison */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <h2 className="card-title">
            <BarChart2 size={20} color="#2d6a4f" /> Visual Income vs. Expense Comparison
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            Formula: Net Profit = Total Income − Total Expenses
          </span>
        </div>
        <IncomeVsExpenseChart income={summary.totalIncome} expenses={summary.totalExpenses} />
      </div>

      {/* Crop-Wise Profit Analysis Table */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <PieChart size={20} color="#2d6a4f" /> Crop-Wise Profit Analysis
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Individual performance breakdown for each linked crop cycle
            </p>
          </div>
        </div>

        {cropProfits.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">No crop cycles recorded to perform profit analysis.</p>
            <Link href="/crops" className="btn btn-primary">
              Add Crop Cycle
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Crop Variety</th>
                  <th>Plot / Field</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Total Income</th>
                  <th style={{ textAlign: 'right' }}>Total Expenses</th>
                  <th style={{ textAlign: 'right' }}>Cycle Profit (₹)</th>
                  <th style={{ textAlign: 'center' }}>Margin (%)</th>
                </tr>
              </thead>
              <tbody>
                {cropProfits.map((item) => {
                  const isProfit = item.netProfit > 0;
                  const isLoss = item.netProfit < 0;

                  return (
                    <tr key={item.cropCycleId}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-900)' }}>
                        {item.cropName}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {item.farmName || 'N/A'}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: '#f1f5f9',
                            color: 'var(--text-main)',
                            fontSize: '0.72rem',
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--profit-green)' }}>
                        {formatINR(item.totalIncome)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--loss-red)' }}>
                        {formatINR(item.totalExpenses)}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 800,
                          fontSize: '1rem',
                          color: isProfit ? 'var(--profit-green)' : isLoss ? 'var(--loss-red)' : 'var(--text-dim)',
                        }}
                      >
                        {isProfit ? `+${formatINR(item.netProfit)}` : isLoss ? `-${formatINR(Math.abs(item.netProfit))}` : '₹0'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`badge ${isProfit ? 'badge-profit' : isLoss ? 'badge-loss' : 'badge-planned'}`}
                        >
                          {item.profitMargin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unassigned Farm Overheads Section */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-900)', marginBottom: '8px' }}>
          General Farm Overheads & Unlinked Revenue
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Per business requirements, general overheads (tubewell power, general machinery) are
          factored into total farm net profit without corrupting individual crop margins.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#f7f9f6', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>General Farm Expenses</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--loss-red)' }}>
              {formatINR(totalUnassignedExpense)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              {unassignedExpenses.length} unassigned entries
            </div>
          </div>

          <div style={{ padding: '16px', background: '#f7f9f6', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>General Farm Revenue</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--profit-green)' }}>
              {formatINR(totalUnassignedIncome)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              {unassignedIncome.length} unassigned entries
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
