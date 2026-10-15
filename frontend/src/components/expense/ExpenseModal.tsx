'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Sprout,
  Package,
  User,
  Building2,
  FileText,
  ChevronDown,
  Plus,
  X,
  Check,
} from 'lucide-react';
import { ExpenseRecord, CropCycle } from '@/types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    cropCycleId?: string;
    cropName?: string;
    type: string;
    payee?: string;
    amount: number;
    paidFromAccount?: string;
    notes?: string;
    description?: string;
    expenseDate: string;
  }) => Promise<void>;
  crops?: CropCycle[];
  initialData?: ExpenseRecord | null;
}

const DEFAULT_CROPS = [
  'Paddy',
  'Wheat',
  'Cotton',
  'Sugarcane',
  'Maize',
  'Tomato',
  'Groundnut',
  'Chilli',
  'Banana',
  'General Farm',
];

const DEFAULT_EXPENSE_TYPES = [
  'Fertilizer Purchase',
  'Seed Purchase',
  'Pesticide Spray',
  'Labour Wages',
  'Machinery Rental',
  'Irrigation Diesel',
  'Equipment & Tools',
  'Transportation',
  'Electricity Bill',
  'Land Preparation',
  'Other',
];

const DEFAULT_PAYEES = [
  'Murugan Fertilizer Store',
  'Ravi Agri Agency',
  'Selvam Seeds & Inputs',
  'Daily Farm Labourers Team',
  'Kisan Tractor Services',
  'Balaji Agro Chemicals',
  'Local Mandi Vendor',
  'Sri Ram Hardware',
];

const DEFAULT_ACCOUNTS = [
  'Axis Bank ••1234',
  'State Bank of India ••5678',
  'HDFC Bank ••9012',
  'Canara Bank ••3421',
  'Cash in Hand',
  'Kisan Credit Card (KCC) ••7845',
];

export function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  crops = [],
  initialData = null,
}: ExpenseModalProps) {
  // Lists with custom additions
  const [cropList, setCropList] = useState<string[]>(DEFAULT_CROPS);
  const [typeList, setTypeList] = useState<string[]>(DEFAULT_EXPENSE_TYPES);
  const [payeeList, setPayeeList] = useState<string[]>(DEFAULT_PAYEES);
  const [accountList, setAccountList] = useState<string[]>(DEFAULT_ACCOUNTS);

  // Form inputs matching the exact options from the user
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedCrop, setSelectedCrop] = useState<string>('Paddy');
  const [selectedType, setSelectedType] = useState<string>('Fertilizer Purchase');
  const [selectedPayee, setSelectedPayee] = useState<string>('Murugan Fertilizer Store');
  const [amount, setAmount] = useState<string>('5000');
  const [paidFromAccount, setPaidFromAccount] = useState<string>('Axis Bank ••1234');
  const [notes, setNotes] = useState<string>('Fertilizer for paddy field');

  // Inline "Add New" states
  const [addingField, setAddingField] = useState<'crop' | 'type' | 'payee' | 'account' | null>(null);
  const [newCustomItem, setNewCustomItem] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync available crops from crop cycles
  useEffect(() => {
    if (crops && crops.length > 0) {
      const activeCropNames = crops.map((c) => c.cropType);
      setCropList((prev) => {
        const merged = Array.from(new Set([...activeCropNames, ...prev]));
        return merged;
      });
    }
  }, [crops]);

  // Populate form when editing or resetting
  useEffect(() => {
    if (initialData) {
      setExpenseDate(initialData.expenseDate || new Date().toISOString().split('T')[0]);
      setSelectedType(initialData.type || 'Fertilizer Purchase');
      setSelectedPayee(initialData.payee || 'Murugan Fertilizer Store');
      setAmount(String(initialData.amount || ''));
      setPaidFromAccount(initialData.paidFromAccount || 'Axis Bank ••1234');
      setNotes(initialData.notes || initialData.description || '');

      // Resolve crop name
      if (initialData.cropName) {
        setSelectedCrop(initialData.cropName);
      } else if (initialData.cropCycleId && crops.length > 0) {
        const matching = crops.find((c) => c.cropCycleId === initialData.cropCycleId);
        if (matching) setSelectedCrop(matching.cropType);
      }
    } else {
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setSelectedCrop('Paddy');
      setSelectedType('Fertilizer Purchase');
      setSelectedPayee('Murugan Fertilizer Store');
      setAmount('5000');
      setPaidFromAccount('Axis Bank ••1234');
      setNotes('Fertilizer for paddy field');
    }
    setError('');
    setAddingField(null);
    setNewCustomItem('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Handle adding custom items
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newCustomItem.trim();
    if (!val) return;

    if (addingField === 'crop') {
      if (!cropList.includes(val)) setCropList([val, ...cropList]);
      setSelectedCrop(val);
    } else if (addingField === 'type') {
      if (!typeList.includes(val)) setTypeList([val, ...typeList]);
      setSelectedType(val);
    } else if (addingField === 'payee') {
      if (!payeeList.includes(val)) setPayeeList([val, ...payeeList]);
      setSelectedPayee(val);
    } else if (addingField === 'account') {
      if (!accountList.includes(val)) setAccountList([val, ...accountList]);
      setPaidFromAccount(val);
    }

    setNewCustomItem('');
    setAddingField(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please provide a valid amount in ₹.');
      return;
    }

    if (!expenseDate) {
      setError('Please select a valid date.');
      return;
    }

    setLoading(true);
    try {
      // Find matching crop cycle id if available
      const matchedCycle = crops.find(
        (c) => c.cropType.toLowerCase() === selectedCrop.toLowerCase()
      );

      await onSave({
        cropCycleId: matchedCycle?.cropCycleId,
        cropName: selectedCrop,
        type: selectedType,
        payee: selectedPayee,
        amount: numericAmount,
        paidFromAccount: paidFromAccount,
        notes: notes,
        description: notes || `${selectedType} - ${selectedCrop}`,
        expenseDate,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save expense entry.');
    } finally {
      setLoading(false);
    }
  };

  // Convert YYYY-MM-DD to DD.MM.YYYY for UI display
  const formatDisplayDate = (d: string) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return d;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '24px 22px 28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          fontFamily: "'Inter', -apple-system, sans-serif",
          boxSizing: 'border-box',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Close Button top-right */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Modal Header */}
        <div style={{ marginBottom: '18px' }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
            }}
          >
            {initialData ? 'Edit Expense Entry' : 'Record Farm Expense'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* ======================================================== */}
          {/* 1. DATE :                                                */}
          {/* ======================================================== */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '6px',
              }}
            >
              date :
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <CalendarIcon size={18} />
              </div>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 38px 0 44px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. CROP TYPE: (+ Add Crop)                               */}
          {/* ======================================================== */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                Crop Type:
              </label>
              <button
                type="button"
                onClick={() => {
                  setAddingField(addingField === 'crop' ? null : 'crop');
                  setNewCustomItem('');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 12px',
                  borderRadius: '999px',
                  border: '1.5px solid #0284c7',
                  backgroundColor: '#f0f9ff',
                  color: '#0284c7',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={13} strokeWidth={2.5} /> Add Crop
              </button>
            </div>

            {/* Quick add custom inline field */}
            {addingField === 'crop' && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginBottom: '8px',
                  padding: '8px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <input
                  type="text"
                  placeholder="Enter crop name (e.g. Groundnut)"
                  value={newCustomItem}
                  onChange={(e) => setNewCustomItem(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    height: '36px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustom(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  style={{
                    padding: '0 12px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#2d6a4f',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Sprout size={18} />
              </div>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 38px 0 44px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  appearance: 'none',
                }}
              >
                {cropList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. EXPENCE TYPE: (+ Add Type)                            */}
          {/* ======================================================== */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                Expence Type:
              </label>
              <button
                type="button"
                onClick={() => {
                  setAddingField(addingField === 'type' ? null : 'type');
                  setNewCustomItem('');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 12px',
                  borderRadius: '999px',
                  border: '1.5px solid #0284c7',
                  backgroundColor: '#f0f9ff',
                  color: '#0284c7',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={13} strokeWidth={2.5} /> Add Type
              </button>
            </div>

            {addingField === 'type' && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginBottom: '8px',
                  padding: '8px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <input
                  type="text"
                  placeholder="Enter expense type (e.g. Tractor Fuel)"
                  value={newCustomItem}
                  onChange={(e) => setNewCustomItem(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    height: '36px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustom(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  style={{
                    padding: '0 12px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Package size={18} />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 38px 0 44px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  appearance: 'none',
                }}
              >
                {typeList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 4. FERTILIZER STORE: (+ Add Store)                       */}
          {/* ======================================================== */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                Fertilizer Store:
              </label>
              <button
                type="button"
                onClick={() => {
                  setAddingField(addingField === 'payee' ? null : 'payee');
                  setNewCustomItem('');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 12px',
                  borderRadius: '999px',
                  border: '1.5px solid #0284c7',
                  backgroundColor: '#f0f9ff',
                  color: '#0284c7',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={13} strokeWidth={2.5} /> Add Store
              </button>
            </div>

            {addingField === 'payee' && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginBottom: '8px',
                  padding: '8px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <input
                  type="text"
                  placeholder="Enter fertilizer / agro store name"
                  value={newCustomItem}
                  onChange={(e) => setNewCustomItem(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    height: '36px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustom(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  style={{
                    padding: '0 12px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <User size={18} />
              </div>
              <select
                value={selectedPayee}
                onChange={(e) => setSelectedPayee(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 38px 0 44px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  appearance: 'none',
                }}
              >
                {payeeList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 5. AMOUNT:                                               */}
          {/* ======================================================== */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '6px',
              }}
            >
              Amount:
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ₹
              </div>
              <input
                type="number"
                step="any"
                placeholder="5,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px 0 44px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* 6. PAID FROM ACCOUNT: (+ Add Account)                    */}
          {/* ======================================================== */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                Paid from Account:
              </label>
              <button
                type="button"
                onClick={() => {
                  setAddingField(addingField === 'account' ? null : 'account');
                  setNewCustomItem('');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 12px',
                  borderRadius: '999px',
                  border: '1.5px solid #0284c7',
                  backgroundColor: '#f0f9ff',
                  color: '#0284c7',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={13} strokeWidth={2.5} /> Add Account
              </button>
            </div>

            {addingField === 'account' && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginBottom: '8px',
                  padding: '8px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <input
                  type="text"
                  placeholder="Enter bank / account name"
                  value={newCustomItem}
                  onChange={(e) => setNewCustomItem(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    height: '36px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustom(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  style={{
                    padding: '0 12px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Building2 size={18} />
              </div>
              <select
                value={paidFromAccount}
                onChange={(e) => setPaidFromAccount(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 38px 0 44px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  appearance: 'none',
                }}
              >
                {accountList.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronDown size={18} />
              </div>
            </div>
            {/* Helper text exactly from the user's design */}
            <div
              style={{
                fontSize: '0.78rem',
                color: '#64748b',
                marginTop: '4px',
                paddingLeft: '2px',
              }}
            >
              For income, this becomes Received into account.
            </div>
          </div>

          {/* ======================================================== */}
          {/* 7. NOTES(OPTIONAL):                                      */}
          {/* ======================================================== */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '6px',
              }}
            >
              Notes(optional):
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FileText size={18} />
              </div>
              <input
                type="text"
                placeholder="Fertilizer for paddy field"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px 0 44px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* 8. AT LAST: Save Entry button / cancel button             */}
          {/* ======================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 16px rgba(2, 132, 199, 0.35)',
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Saving Entry...' : 'Save Entry'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '14px',
                border: '1.5px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontSize: '0.98rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s',
              }}
            >
              cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
