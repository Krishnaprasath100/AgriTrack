'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Eye, EyeOff, LogIn, Sprout, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from '@/components/auth/AuthPage.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    if (result.success) {
      router.replace('/ledger');
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

        {error && <div className={styles.alert} role="alert"><AlertCircle size={18} />{error}</div>}

        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email Address</label>
            <input
              id="email" className={styles.input} name="email" type="email" autoComplete="email"
              placeholder="you@example.com" value={email}
              onChange={(event) => { setEmail(event.target.value); if (error) setError(''); }} required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
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

        <p className={styles.footer}>Don&apos;t have an account yet? <Link href="/register">Create New Farmer Account</Link></p>
      </section>
    </main>
  );
}
