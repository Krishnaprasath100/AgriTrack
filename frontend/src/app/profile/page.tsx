'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { formatDate } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  Save,
  Loader2,
  Calendar,
  Lock,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, resetPassword, logout, isPostgresActive } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Reset Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setMounted(true);
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone ? user.phone.replace(/^\+91/, '') : '',
      });
    }
  }, [user]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileData.fullName.trim()) {
      setProfileError('Full name is required.');
      return;
    }

    if (!profileData.email.trim()) {
      setProfileError('Email address is required.');
      return;
    }

    const cleanPhone = profileData.phone.replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length !== 10) {
      setProfileError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setProfileLoading(true);

    const res = await updateProfile({
      fullName: profileData.fullName.trim(),
      email: profileData.email.trim(),
      phone: cleanPhone ? `+91${cleanPhone}` : undefined,
    });

    setProfileLoading(false);

    if (res.success) {
      setProfileSuccess('Profile details updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } else {
      setProfileError(res.error || 'Failed to update profile.');
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    const res = await resetPassword(
      passwordData.currentPassword,
      passwordData.newPassword
    );

    setPasswordLoading(false);

    if (res.success) {
      setPasswordSuccess('Password has been changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 4000);
    } else {
      setPasswordError(res.error || 'Failed to update password.');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '46px',
    padding: '0 14px',
    borderRadius: '10px',
    border: '1.5px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: '0.92rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.86rem',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '6px',
  };

  return (
    <AppShell>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1
            className="page-title"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#0d2818',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Profile Details
          </h1>
          <p
            className="page-subtitle"
            style={{
              color: '#475569',
              fontSize: '0.92rem',
              marginTop: '4px',
            }}
          >
            View and edit your personal information, mobile number, and account credentials
          </p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left Column: Personal Details & Password Reset */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: Personal Details */}
          <div
            className="card"
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #d8e5dd',
              borderRadius: '16px',
              padding: '26px',
              boxShadow: '0 4px 18px rgba(15, 45, 30, 0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid #eef2ef',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(45, 106, 79, 0.25)',
                }}
              >
                <User size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0d2818', margin: 0 }}>
                  Personal Details
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Update your display name, mobile number, and email address
                </span>
              </div>
            </div>

            {profileSuccess && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #86efac',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={18} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #fca5a5',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                }}
              >
                <AlertCircle size={18} />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              {/* Name */}
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>
                  <User size={15} color="#2d6a4f" /> Name *
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="e.g. Ramesh Patel"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  required
                />
              </div>

              {/* Mobile Number */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    <Phone size={15} color="#2d6a4f" /> Mobile Number
                  </label>
                  {user?.phoneVerified ? (
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#15803d',
                        backgroundColor: '#dcfce7',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        border: '1px solid #86efac',
                      }}
                    >
                      ✓ Mobile Verified
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#92400e',
                        backgroundColor: '#fef3c7',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        border: '1px solid #fcd34d',
                      }}
                    >
                      ✗ Mobile Unverified
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f1f5f9',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '0 14px',
                      color: '#334155',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      userSelect: 'none',
                    }}
                  >
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    style={{ ...inputStyle, flex: 1, letterSpacing: '0.04em' }}
                    placeholder="9876543210"
                    maxLength={10}
                    value={profileData.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setProfileData({ ...profileData, phone: digits });
                    }}
                  />
                </div>
              </div>

              {/* Mail ID */}
              <div style={{ marginBottom: '22px' }}>
                <label style={labelStyle}>
                  <Mail size={15} color="#2d6a4f" /> Mail ID *
                </label>
                <input
                  type="email"
                  style={inputStyle}
                  placeholder="farmer@example.com"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={profileLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 24px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: profileLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(45, 106, 79, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {profileLoading ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Saving Details...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save Details
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Password & Reset Password */}
          <div
            className="card"
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #d8e5dd',
              borderRadius: '16px',
              padding: '26px',
              boxShadow: '0 4px 18px rgba(15, 45, 30, 0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid #eef2ef',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #b45309, #78350f)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(180, 83, 9, 0.25)',
                }}
              >
                <KeyRound size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0d2818', margin: 0 }}>
                  Account Password & Security
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Reset or change your login password securely
                </span>
              </div>
            </div>

            {passwordSuccess && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #86efac',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={18} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #fca5a5',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                }}
              >
                <AlertCircle size={18} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset}>
              {/* Current Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>
                  <Lock size={15} color="#b45309" /> Current Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    style={{ ...inputStyle, paddingRight: '44px' }}
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    aria-label="Toggle password visibility"
                  >
                    {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>
                  <KeyRound size={15} color="#b45309" /> New Password * (Min 6 characters)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    style={{ ...inputStyle, paddingRight: '44px' }}
                    placeholder="Enter new secure password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    aria-label="Toggle password visibility"
                  >
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div style={{ marginBottom: '22px' }}>
                <label style={labelStyle}>
                  <KeyRound size={15} color="#b45309" /> Confirm New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    style={{ ...inputStyle, paddingRight: '44px' }}
                    placeholder="Repeat new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    aria-label="Toggle password visibility"
                  >
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 24px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #b45309, #78350f)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: passwordLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(180, 83, 9, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} /> Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Account Overview & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* User Overview Card */}
          <div
            className="card"
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #d8e5dd',
              borderRadius: '16px',
              padding: '28px 24px',
              textAlign: 'center',
              boxShadow: '0 4px 18px rgba(15, 45, 30, 0.05)',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                border: '3px solid #86efac',
                boxShadow: '0 6px 20px rgba(45, 106, 79, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#ffffff',
                marginBottom: '14px',
              }}
            >
              {mounted && user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0d2818', margin: 0 }}>
              {mounted && user?.fullName ? user.fullName : 'Active Farmer'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '4px', marginBottom: '14px' }}>
              {mounted ? user?.email : ''}
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                backgroundColor: user?.role === 'admin' ? '#fef3c7' : '#dcfce7',
                color: user?.role === 'admin' ? '#92400e' : '#15803d',
                border: user?.role === 'admin' ? '1px solid #fcd34d' : '1px solid #86efac',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <ShieldCheck size={15} /> {mounted ? user?.role || 'Farmer' : 'Farmer'}
            </div>
          </div>

          {/* Account Security & Database Details */}
          <div
            className="card"
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #d8e5dd',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 18px rgba(15, 45, 30, 0.05)',
            }}
          >
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#0d2818',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldCheck size={20} color="#2d6a4f" /> Account Status
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Account Status:</span>
                <span
                  style={{
                    color: '#15803d',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={16} /> Active
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Mobile Verification:</span>
                <span
                  style={{
                    color: user?.phoneVerified ? '#15803d' : '#b45309',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.82rem',
                  }}
                >
                  {user?.phoneVerified ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  {user?.phoneVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Email Verification:</span>
                <span
                  style={{
                    color: user?.emailVerified ? '#15803d' : '#b45309',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.82rem',
                  }}
                >
                  {user?.emailVerified ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  {user?.emailVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Member Since:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>
                  {mounted && user?.createdAt ? formatDate(user.createdAt) : 'Current Season'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid #eef2ef' }}>
              <button
                type="button"
                onClick={() => logout('/login')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#b91c1c',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fecaca';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fee2e2';
                }}
              >
                <LogOut size={16} /> Sign Out of Account
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .profile-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.85fr);
          gap: 24px;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AppShell>
  );
}
