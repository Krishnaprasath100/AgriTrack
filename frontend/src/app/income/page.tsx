'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IncomeRecord, CropCycle, QuantityUnit } from '@/types';
import {
  getIncome,
  getCropCycles,
  saveIncome,
  deleteIncome,
} from '@/lib/services/dataService';
import { formatINR, formatDate } from '@/lib/utils';
import { validateIncomeInput } from '@/lib/validation';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Calendar,
  Edit2,
  Trash2,
  Scale,
  DollarSign,
  Building2,
  Sparkles,
} from 'lucide-react';

const UNITS: QuantityUnit[] = ['quintal', 'tonne', 'kg', 'bags', 'crates'];

export default function IncomePage() {
  const { user } = useAuth();
  const [incomeList, setIncomeList] = useState<IncomeRecord[]>([]);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cropCycleId: '',
    cropType: '',
    quantity: '',
    quantityUnit: 'quintal' as QuantityUnit,
    unitPrice: '',
    saleDate: new Date().toISOString().split('T')[0],
    buyerName: '',
    notes: '',
  });

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [inc, crps] = await Promise.all([getIncome(user.uid), getCropCycles(user.uid)]);
      setIncomeList(inc);
      setCrops(crps);
    } catch (err) {
      console.error('Failed to load income records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const openCreateModal = () => {
    setEditingIncome(null);
    setFormData({
      cropCycleId: '',
      cropType: '',
      quantity: '',
      quantityUnit: 'quintal',
      unitPrice: '',
      saleDate: new Date().toISOString().split('T')[0],
      buyerName: '',
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (inc: IncomeRecord) => {
    setEditingIncome(inc);
    setFormData({
      cropCycleId: inc.cropCycleId || '',
      cropType: inc.cropType,
      quantity: String(inc.quantity),
      quantityUnit: inc.quantityUnit,
      unitPrice: String(inc.unitPrice),
      saleDate: inc.saleDate,
      buyerName: inc.buyerName || '',
      notes: inc.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validation = validateIncomeInput(formData);
    if (!validation.isValid) {
      setFormError(validation.errors[0].message);
      return;
    }

    if (!user) return;

    await saveIncome({
      incomeId: editingIncome ? editingIncome.incomeId : undefined,
      userId: user.uid,
      cropCycleId: formData.cropCycleId || undefined,
      cropType: formData.cropType,
      quantity: Number(formData.quantity),
      quantityUnit: formData.quantityUnit,
      unitPrice: Number(formData.unitPrice),
      saleDate: formData.saleDate,
      buyerName: formData.buyerName || undefined,
      notes: formData.notes || undefined,
    });

    setIsModalOpen(false);
    loadData();
  };

  const confirmDelete = async () => {
    if (!deleteId || !user) return;
    await deleteIncome(deleteId, user.uid);
    setDeleteId(null);
    loadData();
  };

  // Filtered List
  const filteredIncome = incomeList.filter((item) => {
    const matchesSearch =
      item.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.buyerName && item.buyerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCrop = selectedCrop === 'ALL' || item.cropCycleId === selectedCrop;

    let matchesDate = true;
    if (startDate && item.saleDate < startDate) matchesDate = false;
    if (endDate && item.saleDate > endDate) matchesDate = false;

    return matchesSearch && matchesCrop && matchesDate;
  });

  const totalFilteredRevenue = filteredIncome.reduce((sum, item) => sum + item.totalAmount, 0);

  // Auto total calculation for the modal form
  const computedModalTotal = Number(formData.quantity || 0) * Number(formData.unitPrice || 0);

  return (
    <AppShell>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Agricultural Income & Mandi Sales</h1>
          <p className="page-subtitle">
            Log crop sales, mandi receipts, buyer transactions, and revenue in Indian Rupees (₹)
          </p>
        </div>

        <div className="header-actions">
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} /> Record Crop Sale
          </button>
        </div>
      </div>

      {/* Top Metric Highlight Card */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
          border: '1px solid #b7e4c7',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-700)', textTransform: 'uppercase' }}>
              Selected Period Total Revenue
            </span>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'var(--profit-green)',
                margin: '6px 0',
              }}
            >
              {formatINR(totalFilteredRevenue)}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Computed across {filteredIncome.length} crop sale transactions
            </p>
          </div>

          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>FORMULA VERIFICATION</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary-900)', marginTop: '2px' }}>
              Total Income = Quantity Sold × Unit Selling Price
            </div>
          </div>
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
            placeholder="Search crop, buyer, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Crop Cycle filter */}
        <select
          className="form-select"
          style={{ width: '190px' }}
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

        {(startDate || endDate || selectedCrop !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setSearchQuery('');
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

      {/* Income Records Table */}
      <div className="card">
        {filteredIncome.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <TrendingUp size={32} />
            </div>
            <div className="empty-state-title">No Sales Records Found</div>
            <p className="empty-state-text">
              No matching agricultural income records found for this selection.
            </p>
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus size={16} /> Record First Crop Sale
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Crop Sold</th>
                  <th>Associated Cycle</th>
                  <th>Quantity</th>
                  <th>Unit Rate (₹)</th>
                  <th>Sale Date</th>
                  <th>Buyer / Mandi</th>
                  <th style={{ textAlign: 'right' }}>Total Revenue (₹)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncome.map((item) => {
                  const linkedCrop = crops.find((c) => c.cropCycleId === item.cropCycleId);

                  return (
                    <tr key={item.incomeId}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-900)' }}>
                        {item.cropType}
                        {item.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        {linkedCrop ? (
                          <span style={{ fontSize: '0.82rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                            {linkedCrop.cropType}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>General Sale</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {item.quantity} {item.quantityUnit}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {formatINR(item.unitPrice)} / {item.quantityUnit}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formatDate(item.saleDate)}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {item.buyerName ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)' }}>
                            <Building2 size={13} color="var(--primary-600)" />
                            {item.buyerName}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--profit-green)', fontSize: '1.05rem' }}>
                        {formatINR(item.totalAmount)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button onClick={() => openEditModal(item)} className="btn-icon" title="Edit Record">
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(item.incomeId)}
                            className="btn-icon"
                            title="Delete Record"
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

      {/* CREATE / EDIT INCOME MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIncome ? 'Edit Crop Sale' : 'Record Agricultural Income'}
        subtitle="Track harvest sales with auto-calculated total amount"
      >
        {formError && (
          <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Link to Crop Cycle (Optional)</label>
            <select
              className="form-select"
              value={formData.cropCycleId}
              onChange={(e) => {
                const cycleId = e.target.value;
                const match = crops.find((c) => c.cropCycleId === cycleId);
                setFormData({
                  ...formData,
                  cropCycleId: cycleId,
                  cropType: match ? match.cropType : formData.cropType,
                });
              }}
            >
              <option value="">-- General Agricultural Sale --</option>
              {crops.map((c) => (
                <option key={c.cropCycleId} value={c.cropCycleId}>
                  {c.cropType} ({c.farmName || 'Field'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Crop Name / Product Sold *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Basmati Rice 1121 Grade A"
              value={formData.cropType}
              onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Quantity Sold *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="40"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unit of Measure *</label>
              <select
                className="form-select"
                value={formData.quantityUnit}
                onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value as any })}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Unit Selling Price (₹ per unit) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="4200"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sale Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.saleDate}
                onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Auto-calculated Total Amount Notice */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #b7e4c7',
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-800)' }}>
                Auto Total Revenue (₹)
              </span>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Quantity × Unit Price</div>
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--profit-green)' }}>
              {formatINR(computedModalTotal)}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Buyer / Mandi Trader (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. APMC Mandi Commission Agent #8"
              value={formData.buyerName}
              onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Moisture content 12%, delivery receipt #942"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingIncome ? 'Update Sale' : 'Record Sale'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Sale Record"
        message="Are you sure you want to delete this sales transaction? Your farm net profit will be recalculated."
        confirmLabel="Confirm Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AppShell>
  );
}
