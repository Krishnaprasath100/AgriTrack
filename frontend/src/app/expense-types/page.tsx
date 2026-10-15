'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import {
  deleteExpenseTypeOption,
  getExpenseTypeOptions,
  saveExpenseTypeOption,
} from '@/lib/services/dataService';
import { ExpenseTypeOption } from '@/types';
import { Plus, Tag, Trash2 } from 'lucide-react';

const examples = [
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
];

export default function ExpenseTypesPage() {
  const { user } = useAuth();
  const [types, setTypes] = useState<ExpenseTypeOption[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    if (user) {
      setTypes(getExpenseTypeOptions(user.uid));
    }
  };

  useEffect(load, [user]);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !name.trim()) {
      setError('Expense type name is required.');
      return;
    }

    saveExpenseTypeOption({ userId: user.uid, name: name.trim() });
    setName('');
    setError('');
    load();
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Expense Type</h1>
          <p className="page-subtitle">Create a category for your farming expenses.</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>
            <Tag size={20} /> Expense type details
          </div>

          <form onSubmit={save}>
            <div className="form-group">
              <label className="form-label">Expense type name *</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter expense type name"
              />
            </div>

            <div
              style={{
                background: 'var(--primary-50)',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                marginBottom: 18,
              }}
            >
              <strong>Quick examples</strong>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '.82rem',
                  margin: '4px 0 12px',
                }}
              >
                Select an option to fill the name.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 8,
                }}
              >
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setName(example);
                      setError('');
                    }}
                    style={{
                      justifyContent: 'flex-start',
                      whiteSpace: 'normal',
                      textAlign: 'left',
                      borderColor: name === example ? 'var(--primary-600)' : undefined,
                      backgroundColor: name === example ? '#e8f5ec' : undefined,
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="form-error" style={{ marginBottom: 12 }}>
                {error}
              </p>
            )}

            <button className="btn btn-primary" type="submit">
              <Plus size={16} /> Save Type
            </button>
          </form>
        </section>

        <section className="card" style={{ background: 'var(--primary-50)' }}>
          <div className="card-title" style={{ marginBottom: 16 }}>
            Saved expense types
          </div>

          {types.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>
              Saved types will appear in the New Entry expense dropdown.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {types.map((type) => (
                <div
                  key={type.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 14px',
                    background: '#fff',
                    border: '1.5px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <strong>{type.name}</strong>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => {
                      deleteExpenseTypeOption(type.id);
                      load();
                    }}
                    style={{ color: 'var(--loss-red)' }}
                    title="Delete expense type"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
