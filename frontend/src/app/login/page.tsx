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
  ArrowRight,
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
      {/* Background Soft Field Silhouette */}
      <svg
        className={styles.fieldHorizon}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,192L80,181.3C160,171,320,149,480,165.3C640,181,800,235,960,240C1120,245,1280,203,1360,181.3L1440,160L1440,320L0,320Z"
          fill="#d8c8af"
          opacity="0.4"
        />
        <path
          d="M0,230L60,224C120,218,240,205,360,208C480,211,600,230,720,234.7C840,239,960,229,1080,224C1200,219,1320,219,1380,219L1440,219L1440,320L0,320Z"
          fill="#cbb89b"
          opacity="0.5"
        />
      </svg>

      <div className={styles.sceneContainer}>
        {/* Animated Pulling Unit: Login Card + Farmer with Rope */}
        <div className={styles.pullingStage}>
          {/* Exact Card matching reference image */}
          <section className={styles.loginCard} aria-labelledby="login-title">
            <div className={styles.cardHeader}>
              <div className={styles.brandLogoWrap}>
                <span className={styles.brandLogoLeaves}>
                  {/* Two Leaves Logo matching reference */}
                  <svg width="40" height="34" viewBox="0 0 40 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M17.5 17C17.5 6 8 4 2 5C2 17 8.5 22 17.5 22V17Z"
                      fill="#15803d"
                    />
                    <path
                      d="M18.5 17C19.5 5 30 2 38 3C39 16 31 23 18.5 23V17Z"
                      fill="#16a34a"
                    />
                  </svg>
                </span>
              </div>
              <h1 id="login-title" className={styles.brandName}>AgriTrack</h1>
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

              {/* Solid Green Login Button */}
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

          {/* Dedicated Farmer Pulling Image & Rope from reference image */}
          <div className={styles.farmerWrapper}>
            <Image
              src="/farmer-pulling-clean.png"
              alt="Farmer pulling login bar with rope"
              width={535}
              height={405}
              priority
              className={styles.farmerImage}
            />

            {/* Subtle exertion accent rays near farmer's head */}
            <svg
              className={styles.sweatMark}
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
