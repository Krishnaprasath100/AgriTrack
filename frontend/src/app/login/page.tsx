'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sprout,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from '@/components/auth/FarmerLogin.module.css';

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
        const isVerified = params.get('verified') === 'true';
        setSuccessMsg(
          isVerified
            ? 'Mobile number verified & account created! Please sign in.'
            : 'Account created successfully! Please sign in.'
        );
        const loginParam = params.get('phone') || params.get('email') || params.get('identifier');
        if (loginParam) {
          setEmail(loginParam);
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
    <main className={styles.loginPage}>
      {/* 16:9 Cinema Farm Canvas matching referral video */}
      <div className={styles.stage}>
        {/* Interactive card positioned right over the canvas card */}
        <div className={styles.cardSlot}>
          <div className={styles.brandHeader}>
            <Link href="/" style={{ textDecoration: 'none' }} className={styles.brandLogo}>
              <Sprout size={26} />
            </Link>
            <h1 id="login-title" className={styles.brandName}>AgriTrack</h1>
            <p className={styles.brandTagline}>Smarter Farming. Better Tomorrow.</p>
          </div>

          {successMsg && (
            <div className={styles.successAlert} role="status">
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className={styles.alert} role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form className={styles.form} onSubmit={submit}>
            {/* Email or Mobile Number Input */}
            <div className={styles.inputField}>
              <span className={styles.inputIcon}>
                <User size={18} />
              </span>
              <input
                id="email"
                className={styles.input}
                name="email"
                type="text"
                autoComplete="username"
                placeholder="Email or Mobile Number"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                required
              />
            </div>

            {/* Password Input */}
            <div className={styles.inputField}>
              <span className={styles.inputIcon}>
                <Lock size={18} />
              </span>
              <input
                id="password"
                className={styles.input}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Forgot password */}
            <div className={styles.forgotLinkWrap}>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot Password?
              </Link>
            </div>

            {/* Solid Green Login Button (Static / DOES NOT MOVE) */}
            <button className={styles.loginButton} type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Create Account Link */}
          <div className={styles.cardFooter}>
            <Link href="/register" className={styles.createAccountLink}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
