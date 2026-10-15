'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { formatDate } from '@/lib/utils';
import {
  User,
  Mail,
  MapPin,
  Phone,
  Building,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  LogOut,
  Save,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, logout, isPostgresActive } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    farmName: user?.farmName || '',
    location: user?.location || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    setMounted(true);
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        farmName: user.farmName || '',
        location: user.location || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    await updateProfile({
      fullName: formData.fullName,
      farmName: formData.farmName,
      location: formData.location,
      phone: formData.phone,
    });

    setSavedSuccess(true);
    setLoading(false);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Farmer Account & Profile</h1>
          <p className="page-subtitle">
            Manage your personal agricultural credentials, farm name, and location settings
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '28px', alignItems: 'flex-start' }} className="grid-2">
        {/* Profile Edit Form Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <User size={20} color="#2d6a4f" /> Account Information
            </h2>
          </div>

          {savedSuccess && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
                fontSize: '0.88rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Profile settings successfully updated!</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Login Identifier)</label>
              <input
                type="email"
                className="form-input"
                value={user?.email || ''}
                disabled
                style={{ backgroundColor: '#f8faf7', color: 'var(--text-muted)', cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Email identifier is bound to your account identity.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Farm / Agro Estate Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Green Valley Agro Farm"
                value={formData.farmName}
                onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Location (District / State)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ludhiana, Punjab"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Save size={16} /> {loading ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Account Details & Status Side Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-900)', marginBottom: '16px' }}>
              Security & Permissions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Role:</span>
                <span
                  suppressHydrationWarning
                  style={{
                    backgroundColor: user?.role === 'admin' ? '#fef3c7' : '#dcfce7',
                    color: user?.role === 'admin' ? '#92400e' : '#166534',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                  }}
                >
                  {mounted ? (user?.role || 'farmer') : 'farmer'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Account Status:</span>
                <span style={{ color: 'var(--profit-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> Active
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registered Since:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 500 }} suppressHydrationWarning>
                  {mounted && user?.createdAt ? formatDate(user.createdAt) : 'Active Season'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Database Sync:</span>
                <span style={{ color: isPostgresActive ? '#15803d' : '#2d6a4f', fontWeight: 600 }}>
                  {isPostgresActive ? 'PostgreSQL Database Engine' : 'Local Persistence (Demo)'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => logout('/login')}
                className="btn btn-secondary"
                style={{ width: '100%', color: '#dc2626' }}
              >
                <LogOut size={16} /> Sign Out of Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
