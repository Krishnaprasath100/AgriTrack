'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Sprout,
} from 'lucide-react';
import styles from '@/components/auth/AuthPage.module.css';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please provide your registered email or mobile number.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, newPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to reset password. Please check your details.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Your password has been reset successfully!');
      setTimeout(() => {
        window.location.href = `/login?reset=true&identifier=${encodeURIComponent(cleanId)}`;
      }, 1500);
    } catch {
      setError('Network error while resetting password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="forgot-title">
        {/* Brand Header */}
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>
            <Sprout size={29} />
          </span>
          AgriTrack
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: '#ecfdf5',
              color: '#047857',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              border: '1px solid #a7f3d0',
            }}
          >
            <KeyRound size={26} />
          </div>
          <h1 id="forgot-title" className={styles.heading} style={{ marginBottom: '8px' }}>
            Forgot Password?
          </h1>
          <p style={{ color: '#586d62', fontSize: '0.94rem', margin: 0, lineHeight: 1.5 }}>
            Enter your registered email address or mobile number to set a new password.
          </p>
        </div>

        {successMsg && (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              marginBottom: '18px',
              fontSize: '0.88rem',
              fontWeight: 500,
            }}
          >
            <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
            <span>{successMsg} Redirecting to sign in...</span>
          </div>
        )}

        {error && (
          <div className={styles.alert} role="alert" style={{ marginBottom: '18px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="identifier">
              Email or Mobile Number
            </label>
            <input
              id="identifier"
              className={styles.input}
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder="you@example.com or mobile number"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (error) setError('');
              }}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="new-password">
              New Password
            </label>
            <div className={styles.inputWrap}>
              <input
                id="new-password"
                className={`${styles.input} ${styles.inputPassword}`}
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError('');
                }}
                required
              />
              <button
                className={styles.passwordButton}
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm-password">
              Confirm New Password
            </label>
            <div className={styles.inputWrap}>
              <input
                id="confirm-password"
                className={`${styles.input} ${styles.inputPassword}`}
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                required
              />
              <button
                className={styles.passwordButton}
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Resetting Password...
              </>
            ) : (
              <>
                Reset Password <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className={styles.footer}>
          Remember your password?{' '}
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={15} /> Back to Sign In
          </Link>
        </p>
      </section>
    </main>
  );
}

