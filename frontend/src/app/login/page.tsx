'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff, LogIn, Sprout, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from '@/components/auth/AuthPage.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('registered') === 'true') {
        setSuccessMsg('Account created successfully! Please sign in with your credentials.');
        const emailParam = params.get('email');
        if (emailParam) {
          setEmail(emailParam);
        }
      } else if (params.get('reset') === 'true') {
        setSuccessMsg('Password reset successfully! Please sign in with your new password.');
        const idParam = params.get('identifier');
        if (idParam) {
          setEmail(idParam);
        }
      }
    }
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please provide your email or mobile number, and password.');
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    if (result.success) {
      window.location.href = '/ledger';
      return;
    }
    setError(result.error || 'Authentication failed. Please verify your credentials.');
    setLoading(false);
  };

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}><Sprout size={29} /></span>
          AgriTrack
        </Link>
        <h2 id="login-title" className={styles.heading}>Welcome Back</h2>

        <nav className={styles.tabs} aria-label="Authentication pages">
          <span className={styles.tabActive}><LogIn size={19} /> Sign In</span>
          <Link className={styles.tab} href="/register"><UserPlus size={19} /> Sign Up</Link>
        </nav>

        {successMsg && (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              marginBottom: '16px',
              fontSize: '0.88rem',
              fontWeight: 500,
            }}
          >
            <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && <div className={styles.alert} role="alert"><AlertCircle size={18} />{error}</div>}

        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email or Mobile Number</label>
            <input
              id="email" className={styles.input} name="email" type="text" autoComplete="username"
              placeholder="Email or Mobile number" value={email}
              onChange={(event) => { setEmail(event.target.value); if (error) setError(''); }} required
            />
          </div>
          <div className={styles.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.label} htmlFor="password" style={{ margin: 0 }}>Password</label>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: '0.85rem',
                  color: '#1d5a42',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Forgot Password?
              </Link>
            </div>
            <div className={styles.inputWrap}>
              <input
                id="password" className={`${styles.input} ${styles.inputPassword}`}
                name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                placeholder="Enter password" value={password}
                onChange={(event) => { setPassword(event.target.value); if (error) setError(''); }} required
              />
              <button className={styles.passwordButton} type="button" onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? 'Signing In...' : <>Sign In to Account <ArrowRight size={20} /></>}
          </button>
        </form>

        <p className={styles.footer}>Don&apos;t have an account yet? <Link href="/register">Create New Account</Link></p>
      </section>
    </main>
  );
}
