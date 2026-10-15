'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import {
  deleteLedgerContact,
  getLedgerContacts,
  saveLedgerContact,
} from '@/lib/services/dataService';
import { LedgerContact } from '@/types';
import { Plus, Trash2, WalletCards } from 'lucide-react';

export default function PayeesPage() {
  const { user } = useAuth();
  const [payees, setPayees] = useState<LedgerContact[]>([]);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [error, setError] = useState('');

  const load = () => {
    if (user) {
      setPayees(getLedgerContacts(user.uid, 'payee'));
    }
  };

  useEffect(load, [user]);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !form.name.trim()) {
      setError('Payee name is required.');
      return;
    }

    saveLedgerContact({
      userId: user.uid,
      kind: 'payee',
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
    });

    setForm({ name: '', phone: '', email: '', address: '' });
    setError('');
    load();
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Payee</h1>
          <p className="page-subtitle">Add the person or business you pay.</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>
            <WalletCards size={20} /> Payee details
          </div>

          <form onSubmit={save}>
            <div className="form-group">
              <label className="form-label">Payee name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter payee name"
              />
            </div>

            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Mobile number</label>
                <input
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter mobile number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>

            {error && (
              <p className="form-error" style={{ marginBottom: 12 }}>
                {error}
              </p>
            )}

            <button className="btn btn-primary" type="submit">
              <Plus size={16} /> Save Payee
            </button>
          </form>
        </section>

        <section className="card" style={{ background: 'var(--primary-50)' }}>
          <div className="card-title" style={{ marginBottom: 16 }}>
            Payees
          </div>

          {payees.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>
              Saved payees will appear in the New Entry form.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {payees.map((payee) => (
                <div
                  key={payee.id}
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
                  <div>
                    <strong>{payee.name}</strong>
                    {(payee.phone || payee.email) && (
                      <div
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: '.78rem',
                          marginTop: 3,
                        }}
                      >
                        {payee.phone || payee.email}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => {
                      deleteLedgerContact(payee.id);
                      load();
                    }}
                    style={{ color: 'var(--loss-red)' }}
                    title="Delete payee"
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
