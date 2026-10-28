'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { ChoicePicker } from '@/components/forms/ChoicePicker';
import { getCropCycles, getExpenses, getIncome } from '@/lib/services/dataService';
import { CropCycle, ExpenseRecord, IncomeRecord } from '@/types';
import { formatINR, formatDate } from '@/lib/utils';
import { Plus, RefreshCw, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

type LedgerRow = {
  id: string;
  date: string;
  crop: string;
  details: string;
  person: string;
  account: string;
  income: number;
  expense: number;
};

export default function LedgerPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLedgerData = async (isManualRefresh: boolean = false) => {
    if (!user) return;
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [expenses, income, cropList] = await Promise.all([
        getExpenses(user.uid),
        getIncome(user.uid),
        getCropCycles(user.uid),
      ]);

      setCrops(cropList);

      const expenseRows: LedgerRow[] = expenses.map((item: ExpenseRecord) => ({
        id: item.expenseId,
        date: item.expenseDate,
        crop:
          item.cropName ||
          cropList.find((crop) => crop.cropCycleId === item.cropCycleId)?.cropType ||
          '—',
        details: item.type,
        person: item.payee || '—',
        account: item.paidFromAccount || 'Cash in Hand',
        income: 0,
        expense: item.amount,
      }));

      const incomeRows: LedgerRow[] = income.map((item: IncomeRecord) => ({
        id: item.incomeId,
        date: item.saleDate,
        crop: item.cropType,
        details: item.notes || 'Crop sale',
        person: item.buyerName || '—',
        account: 'Cash in Hand',
        income: item.totalAmount,
        expense: 0,
      }));

      setRows([...expenseRows, ...incomeRows].sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err) {
      console.error('Failed to load ledger data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLedgerData();
  }, [user]);

  const handleRefresh = () => {
    loadLedgerData(true);
  };

  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          !filter ||
          row.crop.toLowerCase().includes(filter.toLowerCase()) ||
          row.person.toLowerCase().includes(filter.toLowerCase())
      ),
    [rows, filter]
  );

  const totalIncome = visible.reduce((sum, row) => sum + row.income, 0);
  const totalExpense = visible.reduce((sum, row) => sum + row.expense, 0);

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Income · Expense Ledger</h1>
          <p className="page-subtitle">A single view of your agricultural income and expenses.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.75 : 1,
            }}
            title="Refresh ledger records"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin' : ''}
              style={{
                transition: 'transform 0.2s ease',
              }}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <Link href="/entry" className="btn btn-primary">
            <Plus size={16} /> New Entry
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
        <input
          className="form-input"
          style={{ maxWidth: 340 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by crop or person"
        />
        <div style={{ width: '100%', maxWidth: 260 }}>
          <ChoicePicker
            ariaLabel="Filter by crop"
            value={crops.some((crop) => crop.cropType === filter) ? filter : ''}
            placeholder="All crops"
            onChange={setFilter}
            options={[{ value: '', label: 'All crops' }, ...crops.map((crop) => ({ value: crop.cropType, label: crop.cropType, group: 'Your crops' }))]}
          />
        </div>
        <select
          className="form-select"
          style={{ display: 'none' }}
          onChange={(e) => setFilter(e.target.value)}
          value={filter}
        >
          <option value="">All crops</option>
          {crops.map((crop) => (
            <option key={crop.cropCycleId} value={crop.cropType}>
              {crop.cropType}
            </option>
          ))}
        </select>
      </div>

      <div className="grid-3">
        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Total income</span>
            <span className="stat-icon">
              <TrendingUp size={20} />
            </span>
          </div>
          <div className="stat-value" style={{ color: 'var(--profit-green)' }}>
            {formatINR(totalIncome)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Total expenses</span>
            <span
              className="stat-icon"
              style={{ color: 'var(--loss-red)', background: 'var(--loss-bg)' }}
            >
              <TrendingDown size={20} />
            </span>
          </div>
          <div className="stat-value" style={{ color: 'var(--loss-red)' }}>
            {formatINR(totalExpense)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Balance</span>
            <span className="stat-icon">
              <Wallet size={20} />
            </span>
          </div>
          <div className="stat-value">{formatINR(totalIncome - totalExpense)}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Crop</th>
                <th>Details</th>
                <th>Person / Business</th>
                <th>Account</th>
                <th>Income</th>
                <th>Expense</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.date)}</td>
                  <td>{row.crop}</td>
                  <td>{row.details}</td>
                  <td>{row.person}</td>
                  <td>{row.account}</td>
                  <td style={{ color: 'var(--profit-green)', fontWeight: 700 }}>
                    {row.income ? formatINR(row.income) : '—'}
                  </td>
                  <td style={{ color: 'var(--loss-red)', fontWeight: 700 }}>
                    {row.expense ? formatINR(row.expense) : '—'}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      padding: 36,
                    }}
                  >
                    {loading ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--primary-600)' }} />
                        <span>Loading ledger records...</span>
                      </div>
                    ) : (
                      'No ledger entries match this filter.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
