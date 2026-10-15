'use client';

import React from 'react';
import { formatINR } from '@/lib/utils';
import { ExpenseRecord, IncomeRecord } from '@/types';

interface IncomeVsExpenseChartProps {
  income: number;
  expenses: number;
}

export const IncomeVsExpenseChart: React.FC<IncomeVsExpenseChartProps> = ({ income, expenses }) => {
  const max = Math.max(income, expenses, 1);
  const incomePct = Math.min(100, Math.round((income / max) * 100));
  const expensePct = Math.min(100, Math.round((expenses / max) * 100));
  const net = income - expenses;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Income Volume</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--profit-green)' }}>
            {formatINR(income)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Expense Volume</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--loss-red)' }}>
            {formatINR(expenses)}
          </div>
        </div>
      </div>

      {/* Visual comparison bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '20px 0' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary-900)' }}>Agricultural Revenue</span>
            <span style={{ color: 'var(--text-dim)' }}>{incomePct}%</span>
          </div>
          <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${incomePct}%`,
                background: 'linear-gradient(90deg, #52b788, #2d6a4f)',
                borderRadius: '8px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary-900)' }}>Farming Expenditure</span>
            <span style={{ color: 'var(--text-dim)' }}>{expensePct}%</span>
          </div>
          <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${expensePct}%`,
                background: 'linear-gradient(90deg, #f87171, #dc2626)',
                borderRadius: '8px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px 16px',
          borderRadius: '10px',
          backgroundColor: net >= 0 ? '#dcfce7' : '#fee2e2',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: net >= 0 ? '#15803d' : '#b91c1c' }}>
          {net >= 0 ? 'Net Farming Profit' : 'Net Farming Deficit'}
        </span>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: net >= 0 ? '#15803d' : '#b91c1c' }}>
          {formatINR(Math.abs(net))}
        </span>
      </div>
    </div>
  );
};

interface ExpenseCategoryChartProps {
  expenses: ExpenseRecord[];
}

export const ExpenseCategoryChart: React.FC<ExpenseCategoryChartProps> = ({ expenses }) => {
  const categoryTotals: Record<string, number> = {};
  let total = 0;

  for (const exp of expenses) {
    categoryTotals[exp.type] = (categoryTotals[exp.type] || 0) + exp.amount;
    total += exp.amount;
  }

  const sortedCategories = Object.entries(categoryTotals)
    .map(([cat, amt]) => ({
      name: cat,
      amount: amt,
      pct: total > 0 ? Math.round((amt / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const colors = [
    '#2d6a4f',
    '#52b788',
    '#74c69d',
    '#d97706',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#64748b',
  ];

  if (sortedCategories.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
        No expense records to analyze yet.
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Visual multi-segmented bar */}
      <div
        style={{
          height: '20px',
          display: 'flex',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '20px',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {sortedCategories.map((item, idx) => (
          <div
            key={item.name}
            style={{
              width: `${item.pct}%`,
              backgroundColor: colors[idx % colors.length],
              transition: 'width 0.4s ease',
            }}
            title={`${item.name}: ${formatINR(item.amount)} (${item.pct}%)`}
          />
        ))}
      </div>

      {/* Category breakdown listing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sortedCategories.slice(0, 6).map((item, idx) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: colors[idx % colors.length],
                }}
              />
              <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{item.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>{item.pct}%</span>
              <span style={{ fontWeight: 600, color: 'var(--primary-900)' }}>
                {formatINR(item.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
