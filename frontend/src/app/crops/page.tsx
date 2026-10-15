'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { ChoicePicker } from '@/components/forms/ChoicePicker';
import { DateField } from '@/components/forms/DateField';
import { CropStatusBadge } from '@/components/ui/CropStatusBadge';
import { GrowthTimeline } from '@/components/ui/GrowthTimeline';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CropCycle, CropStatus, LandAreaUnit } from '@/types';
import { getCropCycles, saveCropCycle, deleteCropCycle } from '@/lib/services/dataService';
import { formatDate, getDaysRemaining } from '@/lib/utils';
import { validateCropCycleInput } from '@/lib/validation';
import {
  Sprout,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  MapPin,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const CROP_OPTIONS = [
  'Paddy (Rice)', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Banana', 'Tomato', 'Onion',
  'Potato', 'Chilli', 'Groundnut', 'Soybean', 'Millet', 'Turmeric', 'Coconut',
];

export default function CropsPage() {
  const { user } = useAuth();
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, filter, and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'seeding' | 'harvest'>('seeding');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states for Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<CropCycle | null>(null);
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form inputs
  const [formData, setFormData] = useState({
    cropType: '',
    farmName: '',
    landArea: '',
    landAreaUnit: 'Acres' as LandAreaUnit,
    seedingDate: '',
    expectedHarvestDate: '',
    actualHarvestDate: '',
    status: 'Growing' as CropStatus,
    notes: '',
  });

  const loadCrops = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getCropCycles(user.uid);
      setCrops(data);
    } catch (err) {
      console.error('Failed to load crop cycles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrops();
  }, [user]);

  const openCreateModal = () => {
    setEditingCrop(null);
    setFormData({
      cropType: '',
      farmName: '',
      landArea: '',
      landAreaUnit: 'Acres',
      seedingDate: '',
      expectedHarvestDate: '',
      actualHarvestDate: '',
      status: '' as CropStatus,
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (crop: CropCycle) => {
    setEditingCrop(crop);
    setFormData({
      cropType: crop.cropType,
      farmName: crop.farmName || '',
      landArea: crop.landArea ? String(crop.landArea) : '',
      landAreaUnit: crop.landAreaUnit || 'Acres',
      seedingDate: crop.seedingDate,
      expectedHarvestDate: crop.expectedHarvestDate,
      actualHarvestDate: crop.actualHarvestDate || '',
      status: crop.status,
      notes: crop.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validation = validateCropCycleInput(formData);
    if (!validation.isValid) {
      setFormError(validation.errors[0].message);
      return;
    }

    if (!user) return;

    await saveCropCycle({
      cropCycleId: editingCrop ? editingCrop.cropCycleId : undefined,
      userId: user.uid,
      cropType: formData.cropType,
      farmName: formData.farmName || undefined,
      landArea: formData.landArea ? Number(formData.landArea) : undefined,
      landAreaUnit: formData.landAreaUnit,
      seedingDate: formData.seedingDate,
      expectedHarvestDate: formData.expectedHarvestDate,
      actualHarvestDate: formData.actualHarvestDate || undefined,
      status: formData.status,
      notes: formData.notes || undefined,
    });

    setIsModalOpen(false);
    loadCrops();
  };

  const confirmDelete = async () => {
    if (!deleteId || !user) return;
    await deleteCropCycle(deleteId, user.uid);
    setDeleteId(null);
    loadCrops();
  };

  // Filter & Sort Logic
  const filteredCrops = crops
    .filter((c) => {
      const matchesSearch =
        c.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.farmName && c.farmName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = sortBy === 'seeding' ? a.seedingDate : a.expectedHarvestDate;
      const dateB = sortBy === 'seeding' ? b.seedingDate : b.expectedHarvestDate;
      return sortOrder === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
    });

  return (
    <AppShell>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Plantings</h1>
          <p className="page-subtitle">
            Keep each planting's income and expenses separate from sowing to harvest.
          </p>
        </div>

        <div className="header-actions">
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} /> Add Planting
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by crop, field, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--text-dim)" />
            <div style={{ width: '160px' }}>
              <ChoicePicker ariaLabel="Crop status filter" value={statusFilter} placeholder="All statuses" onChange={setStatusFilter} options={['ALL', 'Planned', 'Growing', 'Ready to Harvest', 'Harvested'].map((value) => ({ value, label: value === 'ALL' ? 'All Statuses' : value }))} />
            </div>
            <select
              className="form-select"
              style={{ display: 'none' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="Growing">Growing</option>
              <option value="Ready to Harvest">Ready to Harvest</option>
              <option value="Harvested">Harvested</option>
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sort by:</span>
          <div style={{ width: '170px' }}>
            <ChoicePicker ariaLabel="Sort crop list" value={sortBy} placeholder="Choose sorting" onChange={(value) => setSortBy(value as 'seeding' | 'harvest')} options={[{ value: 'seeding', label: 'Seeding Date' }, { value: 'harvest', label: 'Expected Harvest' }]} />
          </div>
          <select
            className="form-select"
            style={{ display: 'none' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="seeding">Seeding Date</option>
            <option value="harvest">Expected Harvest</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary btn-icon"
            title={`Toggle Sort Order (${sortOrder.toUpperCase()})`}
          >
            <ArrowUpDown size={16} />
          </button>
        </div>
      </div>

      {/* Crop Cycles Cards Grid */}
      {filteredCrops.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Sprout size={32} />
            </div>
            <div className="empty-state-title">No Crop Cycles Found</div>
            <p className="empty-state-text">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'Get started by creating your first planting.'}
            </p>
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus size={16} /> Add Planting
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
          {filteredCrops.map((crop) => {
            const remaining = getDaysRemaining(crop.expectedHarvestDate);

            return (
              <div key={crop.cropCycleId} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-900)' }}>
                      {crop.cropType}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <MapPin size={13} color="var(--primary-600)" />
                      <span>{crop.farmName || 'General Land Plot'}</span>
                      {crop.landArea && (
                        <span>• {crop.landArea} {crop.landAreaUnit}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CropStatusBadge status={crop.status} isOverdue={remaining.isOverdue} />
                    <button
                      onClick={() => openEditModal(crop)}
                      className="btn-icon"
                      title="Edit Crop Details"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteId(crop.cropCycleId)}
                      className="btn-icon"
                      title="Delete Crop Cycle"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Key Dates Badge Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#f7f9f6',
                    fontSize: '0.82rem',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Seeding: </span>
                    <span style={{ fontWeight: 600, color: 'var(--primary-900)' }}>{formatDate(crop.seedingDate)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Expected Harvest: </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: remaining.isOverdue && crop.status !== 'Harvested' ? '#dc2626' : 'var(--primary-900)',
                      }}
                    >
                      {formatDate(crop.expectedHarvestDate)}
                    </span>
                  </div>
                </div>

                {/* Growth Progress Timeline */}
                <GrowthTimeline crop={crop} />

                {/* Optional Notes */}
                {crop.notes && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '10px 12px',
                      backgroundColor: '#fcfdfc',
                      borderRadius: '8px',
                      border: '1px dashed var(--border-subtle)',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <strong>Notes:</strong> {crop.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCrop ? 'Edit Planting' : 'Add Planting'}
        subtitle="Choose the crop, plot, planting date, and cultivated land area."
        maxWidth="640px"
        contentClassName="planting-modal"
      >
        {formError && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.85rem',
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} className="planting-form-box">
          <div className="form-group">
            <label className="form-label">Crop Name or Variety *</label>
            <ChoicePicker ariaLabel="Crop name" value={formData.cropType} placeholder="Choose a crop" onChange={(cropType) => setFormData({ ...formData, cropType })} options={CROP_OPTIONS.map((crop) => ({ value: crop, label: crop, group: 'Quick crop choices' }))} />
            <select
              className="form-input"
              style={{ display: 'none' }}
              value={formData.cropType}
              onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
              required
            >
              <option value="">Choose a crop</option>
              {CROP_OPTIONS.map((crop) => <option key={crop} value={crop}>{crop}</option>)}
            </select>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '6px' }}>
              Choose a crop to create a planting. Add the specific variety in the notes.
            </div>
          </div>

          <div className="planting-form-grid planting-form-grid--area" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Field or Farm Plot Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Choose or enter field / plot name"
                value={formData.farmName}
                onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Land Area & Unit</label>
              <div className="planting-area-row" style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="4.5"
                  value={formData.landArea}
                  onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                />
                <div style={{ width: '110px', flexShrink: 0 }}>
                  <ChoicePicker ariaLabel="Land area unit" value={formData.landAreaUnit} placeholder="Unit" onChange={(landAreaUnit) => setFormData({ ...formData, landAreaUnit: landAreaUnit as LandAreaUnit })} options={['Acres', 'Hectares', 'Bigha', 'Guntha'].map((unit) => ({ value: unit, label: unit }))} />
                </div>
                <select
                  className="form-select"
                  style={{ display: 'none' }}
                  value={formData.landAreaUnit}
                  onChange={(e) => setFormData({ ...formData, landAreaUnit: e.target.value as any })}
                >
                  <option value="Acres">Acres</option>
                  <option value="Hectares">Hectares</option>
                  <option value="Bigha">Bigha</option>
                  <option value="Guntha">Guntha</option>
                </select>
              </div>
            </div>
          </div>

          <div className="planting-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Seeding Date *</label>
              <input
                type="hidden"
                value={formData.seedingDate}
                onChange={(e) => setFormData({ ...formData, seedingDate: e.target.value })}
                required
              />
              <DateField value={formData.seedingDate} onChange={(e) => setFormData({ ...formData, seedingDate: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Harvest Date *</label>
              <input
                type="hidden"
                value={formData.expectedHarvestDate}
                onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                required
              />
              <DateField value={formData.expectedHarvestDate} onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })} required />
            </div>
          </div>

          <div className="planting-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Current Status</label>
              <ChoicePicker ariaLabel="Planting status" value={formData.status} placeholder="Choose a status" onChange={(status) => setFormData({ ...formData, status: status as CropStatus })} options={['Planned', 'Growing', 'Ready to Harvest', 'Harvested'].map((status) => ({ value: status, label: status }))} />
              <select
                className="form-select"
                style={{ display: 'none' }}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="Planned">Planned</option>
                <option value="Growing">Growing</option>
                <option value="Ready to Harvest">Ready to Harvest</option>
                <option value="Harvested">Harvested</option>
              </select>
            </div>

            {formData.status === 'Harvested' && (
              <div className="form-group">
                <label className="form-label">Actual Harvest Date</label>
                <input
                  type="hidden"
                  value={formData.actualHarvestDate}
                  onChange={(e) => setFormData({ ...formData, actualHarvestDate: e.target.value })}
                />
                <DateField value={formData.actualHarvestDate} onChange={(e) => setFormData({ ...formData, actualHarvestDate: e.target.value })} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Notes & Field Observations</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. Soil testing completed; drip irrigation line 3 replaced."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingCrop ? 'Update Crop Cycle' : 'Save Crop Cycle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Crop Cycle"
        message="Are you sure you want to remove this crop cycle? All associated growth records will be deleted."
        confirmLabel="Confirm Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AppShell>
  );
}
