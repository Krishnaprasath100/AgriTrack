'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import {
  getCropCycles,
  getExpenses,
  getIncome,
  getFinancialMetrics,
} from '@/lib/services/dataService';
import { CropCycle, ExpenseRecord, IncomeRecord, CropProfitSummary } from '@/types';
import { formatINR, formatDate, exportToCSV } from '@/lib/utils';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  PieChart,
  FileSpreadsheet,
} from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [income, setIncome] = useState<IncomeRecord[]>([]);
  const [cropProfits, setCropProfits] = useState<CropProfitSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [c, e, i, m] = await Promise.all([
        getCropCycles(user.uid),
        getExpenses(user.uid),
        getIncome(user.uid),
        getFinancialMetrics(user.uid, startDate || undefined, endDate || undefined),
      ]);
      setCrops(c);
      setExpenses(e);
      setIncome(i);
      setCropProfits(m.cropProfits);
    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, startDate, endDate]);

  // CSV Export Triggers
  const handleExportExpenses = () => {
    exportToCSV(
      `AgriTrack_Expenses_${new Date().toISOString().split('T')[0]}`,
      expenses,
      [
        { key: 'expenseId', label: 'Expense ID' },
        { key: 'type', label: 'Category' },
        { key: 'description', label: 'Description' },
        { key: 'amount', label: 'Amount (INR)' },
        { key: 'expenseDate', label: 'Date' },
        { key: 'labourCount', label: 'Labour Count' },
        { key: 'duration', label: 'Duration' },
      ]
    );
  };

  const handleExportIncome = () => {
    exportToCSV(
      `AgriTrack_Sales_${new Date().toISOString().split('T')[0]}`,
      income,
      [
        { key: 'incomeId', label: 'Sale ID' },
        { key: 'cropType', label: 'Crop Name' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'quantityUnit', label: 'Unit' },
        { key: 'unitPrice', label: 'Unit Rate (INR)' },
        { key: 'totalAmount', label: 'Total Revenue (INR)' },
        { key: 'saleDate', label: 'Sale Date' },
        { key: 'buyerName', label: 'Buyer' },
      ]
    );
  };

  const handleExportCropCycles = () => {
    exportToCSV(
      `AgriTrack_CropCycles_${new Date().toISOString().split('T')[0]}`,
      crops,
      [
        { key: 'cropCycleId', label: 'Cycle ID' },
        { key: 'cropType', label: 'Crop Type' },
        { key: 'farmName', label: 'Field' },
        { key: 'landArea', label: 'Land Area' },
        { key: 'landAreaUnit', label: 'Area Unit' },
        { key: 'seedingDate', label: 'Seeding Date' },
        { key: 'expectedHarvestDate', label: 'Expected Harvest' },
        { key: 'status', label: 'Status' },
      ]
    );
  };

  const handleExportProfitReport = () => {
    exportToCSV(
      `AgriTrack_CropProfitability_${new Date().toISOString().split('T')[0]}`,
      cropProfits,
      [
        { key: 'cropCycleId', label: 'Cycle ID' },
        { key: 'cropName', label: 'Crop Name' },
        { key: 'farmName', label: 'Plot' },
        { key: 'status', label: 'Status' },
        { key: 'totalIncome', label: 'Revenue (INR)' },
        { key: 'totalExpenses', label: 'Expenses (INR)' },
        { key: 'netProfit', label: 'Net Profit (INR)' },
        { key: 'profitMargin', label: 'Margin (%)' },
      ]
    );
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Agricultural Reports & CSV Export</h1>
          <p className="page-subtitle">
            Download certified spreadsheet reports for farm tax filing, bank loans, and accounting
          </p>
        </div>
      </div>

      {/* Export Action Cards */}
      <div className="grid-stats" style={{ marginBottom: '32px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--loss-red)', marginBottom: '8px' }}>
              <TrendingDown size={20} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-900)' }}>
                Expenses Ledger
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Complete itemized breakdown of seed, fertilizer, wage, and machinery costs.
            </p>
          </div>
          <button onClick={handleExportExpenses} className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }}>
            <Download size={14} /> Download CSV
          </button>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--profit-green)', marginBottom: '8px' }}>
              <TrendingUp size={20} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-900)' }}>
                Crop Sales Ledger
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Mandi sale invoices, unit prices, buyer records, and received revenues.
            </p>
          </div>
          <button onClick={handleExportIncome} className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }}>
            <Download size={14} /> Download CSV
          </button>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-700)', marginBottom: '8px' }}>
              <FileSpreadsheet size={20} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-900)' }}>
                Crop Lifecycle Ledger
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Full historical sowing dates, acreages, and harvest milestone logs.
            </p>
          </div>
          <button onClick={handleExportCropCycles} className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }}>
            <Download size={14} /> Download CSV
          </button>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', marginBottom: '8px' }}>
              <PieChart size={20} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-900)' }}>
                P&L Profit Analysis
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Crop-by-crop profit margins and net farm surplus calculations.
            </p>
          </div>
          <button onClick={handleExportProfitReport} className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
            <Download size={14} /> Download CSV
          </button>
        </div>
      </div>

      {/* Report Table Preview */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <FileText size={20} color="#2d6a4f" /> Consolidated Profit & Loss Summary
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            Total Cycles Analyzed: {cropProfits.length}
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Crop Variety</th>
                <th>Field / Acreage</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Total Revenue</th>
                <th style={{ textAlign: 'right' }}>Total Costs</th>
                <th style={{ textAlign: 'right' }}>Net Profit</th>
                <th style={{ textAlign: 'center' }}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {cropProfits.map((item) => (
                <tr key={item.cropCycleId}>
                  <td style={{ fontWeight: 700 }}>{item.cropName}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {item.farmName || 'Field'}
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: '#f1f5f9', fontSize: '0.72rem' }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--profit-green)', fontWeight: 600 }}>
                    {formatINR(item.totalIncome)}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--loss-red)', fontWeight: 600 }}>
                    {formatINR(item.totalExpenses)}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 800,
                      color: item.netProfit >= 0 ? 'var(--profit-green)' : 'var(--loss-red)',
                    }}
                  >
                    {item.netProfit >= 0 ? `+${formatINR(item.netProfit)}` : `-${formatINR(Math.abs(item.netProfit))}`}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`badge ${item.netProfit >= 0 ? 'badge-profit' : 'badge-loss'}`}
                    >
                      {item.profitMargin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
