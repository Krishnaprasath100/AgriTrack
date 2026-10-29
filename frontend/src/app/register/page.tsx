'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  RefreshCw,
  ShieldCheck,
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

  const [step, setStep] = useState<'details' | 'verification'>('details');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

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

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const update = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  // Step 1: Send 6-digit OTP to the new user's email
  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMsg('');

    const email = formData.email.trim();
    if (!formData.fullName.trim() || !email) {
      setError('Full name and email address are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send verification code. Please check your email.');
        setLoading(false);
        return;
      }

      setStep('verification');
      setResendCooldown(60);
      setSuccessMsg(`A 6-digit verification code has been sent to ${email}.`);
      setLoading(false);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch {
      setError('Network error while sending verification code. Please try again.');
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to resend OTP.');
        setLoading(false);
        return;
      }

      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(60);
      setSuccessMsg('A new 6-digit verification code has been sent to your email.');
      setLoading(false);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch {
      setError('Failed to resend verification code. Please try again.');
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    const char = cleaned.slice(-1);
    const next = [...otpDigits];
    next[index] = char;
    setOtpDigits(next);
    if (error) setError('');

    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || '';
    }
    setOtpDigits(next);
    if (error) setError('');

    const focusIdx = Math.min(pasted.length, 5);
    otpInputsRef.current[focusIdx]?.focus();
  };

  // Step 2: Verify OTP and create new user account
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);

    try {
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim(), otp: otpCode }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        setError(verifyData.error || 'Invalid verification code. Please check your email.');
        setLoading(false);
        return;
      }

      const result = await register(
        formData.fullName.trim(),
        formData.email.trim(),
        formData.password,
        'farmer',
        formData.farmName.trim() || undefined,
        formData.phone.trim() || undefined,
        otpCode
      );

      if (result.success) {
        window.location.href = `/login?registered=true&verified=true&email=${encodeURIComponent(formData.email.trim())}`;
        return;
      }

      setError(result.error || 'Failed to create account. Please try again.');
      setLoading(false);
    } catch {
      setError('Network error while verifying OTP. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={`${styles.card} ${styles.signupCard}`} aria-labelledby="signup-title">
        {/* Brand Header */}
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>
            <Sprout size={29} />
          </span>
          AgriTrack
        </Link>

        {step === 'details' ? (
          <>
            <h1 id="signup-title" className={styles.heading}>
              Create your account
            </h1>

            <nav className={styles.tabs} aria-label="Authentication pages">
              <Link className={styles.tab} href="/login">
                <LogIn size={19} /> Sign In
              </Link>
              <span className={styles.tabActive}>
                <UserPlus size={19} /> Sign Up
              </span>
            </nav>

            {error && (
              <div className={styles.alert} role="alert" style={{ marginBottom: '14px' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form className={`${styles.form} ${styles.signupForm}`} onSubmit={handleSendOtp} method="post">
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
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Sending OTP...
                  </>
                ) : (
                  <>
                    Verify Email & Register <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <p className={styles.footer}>
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </>
        ) : (
          /* STEP 2: Email OTP Verification */
          <div style={{ display: 'grid', gap: '20px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '8px',
                padding: '10px 0 4px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #1d5a42, #2c7655)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 8px 18px rgba(25, 83, 60, 0.28)',
                  marginBottom: '4px',
                }}
              >
                <Sprout size={36} />
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <ShieldCheck size={15} /> Email Verification
              </div>

              <h2
                style={{
                  margin: '2px 0 0',
                  color: '#08281d',
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                }}
              >
                The AgroTrack Verification
              </h2>

              <p style={{ margin: 0, color: '#4b5563', fontSize: '0.92rem', lineHeight: 1.5, maxWidth: '420px' }}>
                We have sent a 6-digit verification code to your email address:
                <br />
                <strong style={{ color: '#0f172a', fontWeight: 700 }}>{formData.email}</strong>
                <br />
                <span style={{ fontSize: '0.84rem', color: '#6b7280' }}>
                  Please check your inbox (and spam folder) and enter the 6-digit OTP below.
                </span>
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
                  fontSize: '0.86rem',
                  fontWeight: 500,
                }}
              >
                <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className={styles.alert} role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndRegister} style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                  Enter 6-Digit OTP Code
                </label>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    width: '100%',
                    maxWidth: '380px',
                  }}
                  onPaste={handleOtpPaste}
                >
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputsRef.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      aria-label={`OTP digit ${index + 1}`}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      style={{
                        width: '48px',
                        height: '56px',
                        textAlign: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        borderRadius: '12px',
                        border: digit ? '2px solid #1d5a42' : '1.5px solid #d1d5db',
                        backgroundColor: digit ? '#f0fdf4' : '#ffffff',
                        color: '#08281d',
                        outline: 'none',
                        transition: 'all 0.15s ease-in-out',
                        boxShadow: digit ? '0 0 0 3px rgba(29, 90, 66, 0.12)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <button className={`${styles.submit} ${styles.fullWidth}`} type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Verifying OTP...
                  </>
                ) : (
                  <>
                    Verify OTP & Create Account <CheckCircle2 size={20} />
                  </>
                )}
              </button>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '4px',
                  fontSize: '0.88rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep('details');
                    setError('');
                    setSuccessMsg('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  <ArrowLeft size={16} /> Edit Email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#9ca3af' : '#1d5a42',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 700,
                    padding: 0,
                  }}
                >
                  <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                  {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                </button>
              </div>
            </form>
          </div>
        )}
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
