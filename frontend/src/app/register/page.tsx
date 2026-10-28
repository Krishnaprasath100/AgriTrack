'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  Sprout,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from '@/components/auth/AuthPage.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    farmName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Prepopulate form fields if query params exist (e.g. after a page reload)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlFullName = params.get('fullName');
      const urlEmail = params.get('email');
      const urlPhone = params.get('phone');
      const urlFarmName = params.get('farmName');
      if (urlFullName || urlEmail || urlPhone || urlFarmName) {
        setFormData((prev) => ({
          ...prev,
          fullName: urlFullName || prev.fullName,
          email: urlEmail || prev.email,
          phone: urlPhone || prev.phone,
          farmName: urlFarmName || prev.farmName,
        }));
      }
    }
  }, []);

  const update = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!formData.fullName.trim() || !formData.email.trim()) {
      setError('Full name and email address are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await register(
      formData.fullName.trim(),
      formData.email.trim(),
      formData.password,
      'farmer',
      formData.farmName.trim() || undefined,
      formData.phone.trim() || undefined
    );

    if (result.success) {
      window.location.href = `/login?registered=true&email=${encodeURIComponent(formData.email.trim())}`;
      return;
    }
    setError(result.error || 'Failed to create account. Please try again.');
    setLoading(false);
  };

  return (
    <main className={styles.page}>
      <section className={`${styles.card} ${styles.signupCard}`} aria-labelledby="signup-title">
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}><Sprout size={29} /></span>
          AgriTrack
        </Link>
        <h1 id="signup-title" className={styles.heading}>Create your account</h1>

        <nav className={styles.tabs} aria-label="Authentication pages">
          <Link className={styles.tab} href="/login"><LogIn size={19} /> Sign In</Link>
          <span className={styles.tabActive}><UserPlus size={19} /> Sign Up</span>
        </nav>

        {error && (
          <div className={styles.alert} role="alert" style={{ marginBottom: '14px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form className={`${styles.form} ${styles.signupForm}`} onSubmit={submit} method="post">
          <Field label="Full Name *" htmlFor="full-name">
            <input
              id="full-name"
              className={styles.input}
              name="fullName"
              autoComplete="name"
              placeholder="Ramesh Patel"
              value={formData.fullName}
              onChange={(event) => update('fullName', event.target.value)}
              required
            />
          </Field>

          <Field label="Email Address *" htmlFor="email">
            <input
              id="email"
              className={styles.input}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="farmer@example.com"
              value={formData.email}
              onChange={(event) => update('email', event.target.value)}
              required
            />
          </Field>

          <Field label="Mobile Number (optional)" htmlFor="phone">
            <input
              id="phone"
              className={styles.input}
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(event) => update('phone', event.target.value)}
            />
          </Field>

          <Field label="Password *" htmlFor="password">
            <PasswordField
              id="password"
              value={formData.password}
              shown={showPassword}
              onChange={(value) => update('password', value)}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </Field>

          <Field label="Confirm Password *" htmlFor="confirm-password">
            <PasswordField
              id="confirm-password"
              value={formData.confirmPassword}
              shown={showPassword}
              onChange={(value) => update('confirmPassword', value)}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </Field>

          <button className={`${styles.submit} ${styles.fullWidth}`} type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Creating Account...
              </>
            ) : (
              <>
                Create Account <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

function PasswordField({
  id,
  value,
  shown,
  onChange,
  onToggle,
}: {
  id: string;
  value: string;
  shown: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className={styles.inputWrap}>
      <input
        id={id}
        className={`${styles.input} ${styles.inputPassword}`}
        name={id}
        type={shown ? 'text' : 'password'}
        autoComplete="new-password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
      <button
        className={styles.passwordButton}
        type="button"
        onClick={onToggle}
        aria-label={shown ? 'Hide password' : 'Show password'}
      >
        {shown ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}
