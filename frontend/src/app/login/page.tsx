'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
      {/* Background Soft Overlay */}
      <div className={styles.pageOverlay} />

      {/* Foreground Organic Leaf Accents matching referral video corners */}
      <svg className={styles.decorativeLeafTopLeft} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M-20 -20 C 60 10, 110 50, 140 130 C 90 150, 20 120, -20 -20 Z" fill="#15803d" opacity="0.6" />
        <path d="M-10 20 C 50 40, 80 80, 95 135 C 50 145, 10 120, -10 20 Z" fill="#22c55e" opacity="0.4" />
      </svg>
      <svg className={styles.decorativeLeafBottomRight} viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M190 190 C 110 170, 70 120, 30 40 C 90 20, 150 60, 190 190 Z" fill="#15803d" opacity="0.65" />
        <path d="M180 160 C 120 140, 90 90, 70 30 C 120 20, 160 60, 180 160 Z" fill="#22c55e" opacity="0.45" />
      </svg>

      <div className={styles.sceneContainer}>
        {/* Animated Pulling Unit: Login Card + Farmer with Rope */}
        <div className={styles.pullingStage}>
          {/* Main Card with official app logo */}
          <section className={styles.loginCard} aria-labelledby="login-title">
            <div className={styles.cardHeader}>
              <Link href="/" style={{ textDecoration: 'none' }} className={styles.brandLogo}>
                <Sprout size={30} />
              </Link>
              <h1 id="login-title" className={styles.brandTitle}>AgriTrack</h1>
              <p className={styles.brandTagline}>Smarter Farming. Better Tomorrow.</p>
            </div>

            {successMsg && (
              <div className={styles.successAlert} role="status">
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className={styles.alert} role="alert">
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form className={styles.form} onSubmit={submit}>
              {/* Email or Mobile Number Input */}
              <div className={styles.inputField}>
                <span className={styles.inputIcon}>
                  <User size={19} />
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
                  <Lock size={19} />
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Forgot password */}
              <div className={styles.forgotLinkWrap}>
                <Link href="/forgot-password" className={styles.forgotLink}>
                  Forgot Password?
                </Link>
              </div>

              {/* Fixed Solid Green Login Button (Does NOT move) */}
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
          </section>

          {/* Farmer with Rope pulling the login card */}
          <div className={styles.farmerWrapper}>
            <Image
              src="/farmer-pulling-clean.png"
              alt="Farmer pulling login card with rope"
              width={535}
              height={405}
              priority
              className={styles.farmerImage}
            />

            {/* Effort rays near farmer */}
            <svg
              className={styles.sweatRays}
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M 6,16 L 2,16" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 8,8 L 4,4" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 16,6 L 16,2" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </main>
  );
}
