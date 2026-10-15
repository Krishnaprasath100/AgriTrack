'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { ChoicePicker } from '@/components/forms/ChoicePicker';
import { DateField } from '@/components/forms/DateField';
import {
  getCropCycles,
  getExpenseTypeOptions,
  getLedgerAccounts,
  getLedgerContacts,
  getQuickCropChoices,
  saveExpense,
  saveExpenseTypeOption,
  saveIncome,
  saveQuickCropChoice,
} from '@/lib/services/dataService';
import {
  CropCycle,
  ExpenseTypeOption,
  LedgerAccount,
  LedgerContact,
} from '@/types';
import { ArrowDownCircle, ArrowUpCircle, Plus, Save } from 'lucide-react';

const expenseTypes = [
  'Pesticide Purchase',
  'Weeding',
  'Fertilizer Purchase',
  'Labour Wages',
  'Irrigation',
  'Harvesting',
  'Seed Purchase',
  'Tractor Hire',
  'Land Preparation',
  'Transport Charges',
  'Electricity',
  'Equipment Repair',
  'Other',
];

const defaultQuickCrops = [
  'Paddy (Rice)',
  'Wheat',
  'Maize',
  'Cotton',
  'Sugarcane',
  'Banana',
  'Tomato',
  'Onion',
  'Potato',
  'Chilli',
  'Groundnut',
  'Soybean',
  'Millet',
  'Turmeric',
  'Coconut',
];

export default function EntryPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [payees, setPayees] = useState<LedgerContact[]>([]);
  const [persons, setPersons] = useState<LedgerContact[]>([]);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [types, setTypes] = useState<ExpenseTypeOption[]>([]);

  const [savedQuickCrops, setSavedQuickCrops] = useState<string[]>([]);
  const [typedCrop, setTypedCrop] = useState('');
  const [typedExpenseType, setTypedExpenseType] = useState('');

  const [form, setForm] = useState({
    date: '',
    crop: '',
    counterparty: '',
    account: '',
    expenseType: '',
    amount: '',
    notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    getCropCycles(user.uid).then(setCrops);
    setPayees(getLedgerContacts(user.uid, 'payee'));
    setPersons(getLedgerContacts(user.uid, 'person'));

    const accountList = getLedgerAccounts(user.uid);
    setAccounts(accountList);
    setTypes(getExpenseTypeOptions(user.uid));
    setSavedQuickCrops(getQuickCropChoices(user.uid));

    setForm((current) => ({
      ...current,
      account: current.account,
    }));
  }, [user]);

  const selectedPlanting = crops.find((crop) => crop.cropCycleId === form.crop);
  const cropName =
    selectedPlanting?.cropType ||
    (form.crop.startsWith('quick:') ? form.crop.slice(6) : '');
  const contacts = kind === 'expense' ? payees : persons;

  const allTypes = [...expenseTypes, ...types.map((type) => type.name)].filter(
    (value, index, list) => list.indexOf(value) === index
  );

  const allQuickCrops = [...defaultQuickCrops, ...savedQuickCrops].filter(
    (crop, index, list) =>
      list.findIndex((item) => item.toLowerCase() === crop.toLowerCase()) === index
  );

  const addTypedCrop = () => {
    if (!user || !typedCrop.trim()) return;
    const name = typedCrop.trim().replace(/\s+/g, ' ');
    setSavedQuickCrops(saveQuickCropChoice(user.uid, name));
    setForm({ ...form, crop: `quick:${name}` });
    setTypedCrop('');
    setError('');
  };

  const addTypedExpenseType = () => {
    if (!user || !typedExpenseType.trim()) return;
    const name = typedExpenseType.trim().replace(/\s+/g, ' ');
    const saved = saveExpenseTypeOption({ userId: user.uid, name });
    setTypes((current) =>
      current.some((type) => type.name.toLowerCase() === saved.name.toLowerCase())
        ? current
        : [...current, saved]
    );
    setForm({ ...form, expenseType: name });
    setTypedExpenseType('');
    setError('');
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const amount = Number(form.amount);
    if (!form.date || !cropName || !amount || amount <= 0 || (kind === 'expense' && !form.expenseType)) {
      setError(kind === 'expense' ? 'Choose a date, crop, and expense type, then enter an amount greater than zero.' : 'Choose a date and crop, then enter an amount greater than zero.');
      return;
    }

    if (kind === 'expense') {
      await saveExpense({
        userId: user.uid,
        cropCycleId: selectedPlanting?.cropCycleId,
        cropName,
        type: form.expenseType,
        payee: form.counterparty || undefined,
        paidFromAccount: form.account || undefined,
        amount,
        description: form.notes || `${form.expenseType} for ${cropName}`,
        notes: form.notes || undefined,
        expenseDate: form.date,
      });
    } else {
      await saveIncome({
        userId: user.uid,
        cropCycleId: selectedPlanting?.cropCycleId,
        cropType: cropName,
        quantity: 1,
        quantityUnit: 'kg',
        unitPrice: amount,
        buyerName: form.counterparty || undefined,
        notes: form.notes || undefined,
        saleDate: form.date,
      });
    }

    router.push('/ledger');
  };
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">New {kind === 'expense' ? 'Expense' : 'Income'} Entry</h1>
          <p className="page-subtitle">Record income or expenditure for your agricultural activities.</p>
        </div>
      </div>

      <section className="card" style={{ maxWidth: 1100 }}>
        <div
          style={{
            display: 'flex',
            gap: 10,
            paddingBottom: 20,
            marginBottom: 24,
            borderBottom: '1.5px solid var(--border-subtle)',
          }}
        >
          <button
            className={`btn ${kind === 'income' ? 'btn-primary' : 'btn-secondary'}`}
            type="button"
            onClick={() => setKind('income')}
          >
            <ArrowUpCircle size={16} /> Income
          </button>
          <button
            className={`btn ${kind === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
            type="button"
            onClick={() => setKind('expense')}
          >
            <ArrowDownCircle size={16} /> Expense
          </button>
        </div>

        <form onSubmit={save}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date</label>
              <DateField
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                placeholder="dd-mm-yyyy"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Crop / planting</label>
              <ChoicePicker
                ariaLabel="Crop or planting"
                value={form.crop}
                placeholder="Choose a crop"
                onChange={(crop) => setForm({ ...form, crop })}
                options={[
                  ...crops.map((crop) => ({ value: crop.cropCycleId, label: `${crop.cropType}${crop.farmName ? ` · ${crop.farmName}` : ''}`, group: 'Your plantings' })),
                  ...allQuickCrops.map((crop) => ({ value: `quick:${crop}`, label: crop, group: 'Quick crop choices' })),
                ]}
              />
              <select
                className="form-select"
                style={{ display: 'none' }}
                value={form.crop}
                onChange={(e) => setForm({ ...form, crop: e.target.value })}
              >
                <option value="">Choose a crop</option>
                {crops.length > 0 && (
                  <optgroup label="Your plantings">
                    {crops.map((crop) => (
                      <option key={crop.cropCycleId} value={crop.cropCycleId}>
                        {crop.cropType}
                        {crop.farmName ? ` · ${crop.farmName}` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Quick crop choices">
                  {allQuickCrops.map((crop) => (
                    <option key={crop} value={`quick:${crop}`}>
                      {crop}
                    </option>
                  ))}
                </optgroup>
              </select>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input
                  className="form-input"
                  value={typedCrop}
                  onChange={(e) => setTypedCrop(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTypedCrop();
                    }
                  }}
                  placeholder="Type a new crop name"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addTypedCrop}
                  disabled={!typedCrop.trim()}
                >
                  <Plus size={14} /> Add crop
                </button>
              </div>
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  marginTop: 6,
                }}
              >
                Added crops are saved to Quick crop choices for future entries.
              </div>
            </div>

            {kind === 'expense' && (
              <div className="form-group">
                <label className="form-label">Expense type</label>
                <ChoicePicker
                  ariaLabel="Expense type"
                  value={form.expenseType}
                  placeholder="Choose an expense type"
                  onChange={(expenseType) => setForm({ ...form, expenseType })}
                  options={allTypes.map((type) => ({ value: type, label: type, group: 'Expense types' }))}
                />
                <select
                  className="form-select"
                  style={{ display: 'none' }}
                  value={form.expenseType}
                  onChange={(e) => setForm({ ...form, expenseType: e.target.value })}
                >
                  {allTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input
                    className="form-input"
                    value={typedExpenseType}
                    onChange={(e) => setTypedExpenseType(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTypedExpenseType();
                      }
                    }}
                    placeholder="Type a new expense type"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={addTypedExpenseType}
                    disabled={!typedExpenseType.trim()}
                  >
                    <Plus size={14} /> Add type
                  </button>
                </div>
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    marginTop: 6,
                  }}
                >
                  Added types are saved to the expense type choices.
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{kind === 'expense' ? 'Payee' : 'Received from'}</label>
              <ChoicePicker
                ariaLabel={kind === 'expense' ? 'Payee' : 'Person'}
                value={form.counterparty}
                placeholder={`Choose ${kind === 'expense' ? 'a payee' : 'a person'} (optional)`}
                onChange={(counterparty) => setForm({ ...form, counterparty })}
                options={contacts.map((contact) => ({ value: contact.name, label: contact.name }))}
              />
              <select
                className="form-select"
                style={{ display: 'none' }}
                value={form.counterparty}
                onChange={(e) => setForm({ ...form, counterparty: e.target.value })}
              >
                <option value="">Select optional {kind === 'expense' ? 'payee' : 'person'}</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.name}>
                    {contact.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => router.push(kind === 'expense' ? '/payees' : '/persons')}
              >
                <Plus size={14} /> Add {kind === 'expense' ? 'payee' : 'person'}
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">
                {kind === 'expense' ? 'Paid from account' : 'Received into account'}
              </label>
              <ChoicePicker
                ariaLabel="Account"
                value={form.account}
                placeholder="Choose an account"
                onChange={(account) => setForm({ ...form, account })}
                options={accounts.map((account) => ({ value: account.displayName, label: account.displayName }))}
              />
              <select
                className="form-select"
                style={{ display: 'none' }}
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.displayName}>
                    {account.displayName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => router.push('/accounts')}
              >
                <Plus size={14} /> Add account
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              rows={3}
              className="form-textarea"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={kind === 'expense' ? 'What was this expense for?' : 'What income did you receive?'}
            />
          </div>

          {error && (
            <p className="form-error" style={{ marginBottom: 14 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-secondary" type="button" onClick={() => router.push('/ledger')}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit">
              <Save size={16} /> Save {kind === 'expense' ? 'Expense' : 'Income'}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
