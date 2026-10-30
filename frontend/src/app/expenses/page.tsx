'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ExpenseCategoryChart } from '@/components/ui/Charts';
import { ExpenseModal } from '@/components/expense/ExpenseModal';
import { ExpenseRecord, CropCycle, ExpenseCategory } from '@/types';
import {
  getExpenses,
  getCropCycles,
  saveExpense,
  deleteExpense,
} from '@/lib/services/dataService';
import { formatINR, formatDate } from '@/lib/utils';
import { validateExpenseInput } from '@/lib/validation';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  Calendar,
  Edit2,
  Trash2,
  Receipt,
  Users,
  Clock,
  ArrowUpDown,
  ExternalLink,
  User as UserIcon,
  Building2,
  Sprout,
  FileText,
} from 'lucide-react';

const CATEGORIES: ExpenseCategory[] = [
  'Seeds',
  'Fertilizers',
  'Pesticides',
  'Labour',
  'Irrigation',
  'Equipment',
  'Machinery rental',
  'Transportation',
  'Electricity',
  'Land preparation',
  'Other',
];

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCrop, setSelectedCrop] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [expList, cropsList] = await Promise.all([
        getExpenses(user.uid),
        getCropCycles(user.uid),
      ]);
      setExpenses(expList);
      setCrops(cropsList);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const openEditModal = (exp: ExpenseRecord) => {
    setEditingExpense(exp);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (data: {
    cropCycleId?: string;
    cropName?: string;
    type: string;
    payee?: string;
    amount: number;
    paidFromAccount?: string;
    notes?: string;
    description?: string;
    expenseDate: string;
  }) => {
    if (!user) return;

    await saveExpense({
      expenseId: editingExpense ? editingExpense.expenseId : undefined,
      userId: user.uid,
      cropCycleId: data.cropCycleId,
      cropName: data.cropName,
      type: data.type,
      payee: data.payee,
      amount: data.amount,
      paidFromAccount: data.paidFromAccount,
      notes: data.notes,
      description: data.notes || `${data.type} - ${data.cropName || 'Crop'}`,
      expenseDate: data.expenseDate,
    });

    setIsModalOpen(false);
    loadData();
  };

  const confirmDelete = async () => {
    if (!deleteId || !user) return;
    await deleteExpense(deleteId, user.uid);
    setDeleteId(null);
    loadData();
  };

  // Filtered List
  const filteredExpenses = expenses.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      e.description.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q) ||
      Boolean(e.notes && e.notes.toLowerCase().includes(q)) ||
      Boolean(e.payee && e.payee.toLowerCase().includes(q)) ||
      Boolean(e.cropName && e.cropName.toLowerCase().includes(q)) ||
      Boolean(e.paidFromAccount && e.paidFromAccount.toLowerCase().includes(q));

    const matchesCat = selectedCategory === 'ALL' || e.type === selectedCategory;
    const matchesCrop = selectedCrop === 'ALL' || e.cropCycleId === selectedCrop;

    let matchesDate = true;
    if (startDate && e.expenseDate < startDate) matchesDate = false;
    if (endDate && e.expenseDate > endDate) matchesDate = false;

    return matchesSearch && matchesCat && matchesCrop && matchesDate;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <AppShell>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Farming Expense Management</h1>
          <p className="page-subtitle">
            Record, categorize, and control agricultural operational and input expenditures in INR (₹)
          </p>
        </div>

        <div className="header-actions">
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} /> Record Expense
          </button>
        </div>
      </div>

      {/* Top Cards: Total Filtered Cost & Category Distribution */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Total Selected Period Expenses
          </span>
          <div style={{ fontFamily: 'var(--font-heading-stack)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--loss-red)', margin: '8px 0' }}>
            {formatINR(totalFilteredAmount)}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Across {filteredExpenses.length} recorded farming cost entries
          </p>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-900)', marginBottom: '14px' }}>
            Category Distribution
          </h3>
          <ExpenseCategoryChart expenses={filteredExpenses} />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '18px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search description or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <select
          className="form-select"
          style={{ width: '160px' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="ALL">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Crop Cycle filter */}
        <select
          className="form-select"
          style={{ width: '180px' }}
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
        >
          <option value="ALL">All Crop Cycles</option>
          {crops.map((c) => (
            <option key={c.cropCycleId} value={c.cropCycleId}>
              {c.cropType}
            </option>
          ))}
        </select>

        {/* Date range filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>From:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: '140px', padding: '6px 10px' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>To:</span>
          <input
            type="date"
            className="form-input"
            style={{ width: '140px', padding: '6px 10px' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {(startDate || endDate || selectedCategory !== 'ALL' || selectedCrop !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedCrop('ALL');
              setStartDate('');
              setEndDate('');
            }}
            className="btn btn-secondary btn-sm"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Expenses Table */}
      <div className="card">
        {filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <TrendingDown size={32} />
            </div>
            <div className="empty-state-title">No Expenses Found</div>
            <p className="empty-state-text">
              No matching farming expense records for current filter selection.
            </p>
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus size={16} /> Record First Expense
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Expence Type</th>
                  <th>Crop Type</th>
                  <th>Fertilizer Store</th>
                  <th>Paid from Account</th>
                  <th>Notes</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => {
                  const linkedCrop = crops.find((c) => c.cropCycleId === exp.cropCycleId);
                  const displayCrop = exp.cropName || (linkedCrop ? linkedCrop.cropType : 'General Farm');

                  return (
                    <tr key={exp.expenseId}>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: '#f0fdf4',
                            color: '#166534',
                            border: '1px solid #bbf7d0',
                            fontWeight: 700,
                          }}
                        >
                          {exp.type}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.86rem',
                            color: '#1b4332',
                            fontWeight: 600,
                          }}
                        >
                          <Sprout size={14} color="#2d6a4f" />
                          {displayCrop}
                        </span>
                      </td>
                      <td>
                        {exp.payee ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.85rem',
                              color: '#334155',
                              fontWeight: 500,
                            }}
                          >
                            <UserIcon size={13} color="#64748b" />
                            {exp.payee}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>—</span>
                        )}
                      </td>
                      <td>
                        {exp.paidFromAccount ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.82rem',
                              color: '#0f172a',
                              fontWeight: 600,
                              backgroundColor: '#f8fafc',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <Building2 size={13} color="#0284c7" />
                            {exp.paidFromAccount}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '200px' }}>
                        {exp.notes || exp.description || '—'}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formatDate(exp.expenseDate)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--loss-red)', fontSize: '0.98rem' }}>
                        {formatINR(exp.amount)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button onClick={() => openEditModal(exp)} className="btn-icon" title="Edit Expense">
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(exp.expenseId)}
                            className="btn-icon"
                            title="Delete Expense"
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW EXPENSE MODAL */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        crops={crops}
        initialData={editingExpense}
      />

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Expense Record"
        message="Are you sure you want to delete this expense record? This will adjust your overall farm financial balance."
        confirmLabel="Confirm Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AppShell>
  );
}
