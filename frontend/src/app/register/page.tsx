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
  MessageSquare,
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
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [step, setStep] = useState<'details' | 'verification'>('details');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [smsCodePreview, setSmsCodePreview] = useState<string>('');
  const [normalizedPhone, setNormalizedPhone] = useState<string>('');
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
      if (urlFullName || urlEmail || urlPhone) {
        setFormData((prev) => ({
          ...prev,
          fullName: urlFullName || prev.fullName,
          email: urlEmail || prev.email,
          phone: urlPhone || prev.phone,
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

  // Step 1: Validate signup details and send 6-digit SMS OTP to mobile number
  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMsg('');

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();

    if (!fullName) {
      setError('Full name is required.');
      return;
    }

    if (!phone) {
      setError('Mobile number is required for SMS OTP verification.');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address or leave it blank.');
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
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send SMS OTP. Please verify your mobile number.');
        setLoading(false);
        return;
      }

      setNormalizedPhone(data.phone || phone);
      if (data.smsCode) {
        setSmsCodePreview(String(data.smsCode));
      }
      setStep('verification');
      setResendCooldown(30);
      setSuccessMsg(`A 6-digit verification OTP has been sent via SMS to ${data.phone || phone}.`);
      setLoading(false);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch {
      setError('Network error while sending SMS OTP. Please try again.');
      setLoading(false);
    }
  };

  // Resend SMS OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to resend SMS OTP.');
        setLoading(false);
        return;
      }

      setOtpDigits(['', '', '', '', '', '']);
      if (data.smsCode) {
        setSmsCodePreview(String(data.smsCode));
      }
      setResendCooldown(30);
      setSuccessMsg(`A new 6-digit SMS OTP has been sent to ${data.phone || formData.phone.trim()}.`);
      setLoading(false);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch {
      setError('Failed to resend SMS OTP. Please try again.');
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

  const handleFillSmsCode = () => {
    if (!smsCodePreview || smsCodePreview.length !== 6) return;
    setOtpDigits(smsCodePreview.split(''));
    if (error) setError('');
  };

  // Step 2: Verify SMS OTP and create account, then redirect to login
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your SMS verification code.');
      return;
    }

    setLoading(true);

    try {
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone.trim(), otp: otpCode }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        setError(verifyData.error || 'Invalid SMS verification code. Please check the OTP and try again.');
        setLoading(false);
        return;
      }

      const result = await register(
        formData.fullName.trim(),
        formData.email.trim() || undefined,
        formData.password,
        'farmer',
        undefined,
        normalizedPhone || formData.phone.trim(),
        otpCode
      );

      if (result.success) {
        const loginIdentifier = formData.phone.trim() || formData.email.trim();
        window.location.href = `/login?registered=true&verified=true&phone=${encodeURIComponent(loginIdentifier)}`;
        return;
      }

      setError(result.error || 'Failed to create account. Please verify your details.');
      setLoading(false);
    } catch {
      setError('Network error while verifying SMS OTP. Please try again.');
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
                  placeholder="Name"
                  value={formData.fullName}
                  onChange={(event) => update('fullName', event.target.value)}
                  required
                />
              </Field>

              <Field label="Mobile Number *" htmlFor="phone">
                <input
                  id="phone"
                  className={styles.input}
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  required
                />
              </Field>

              <Field label="Email Address (Optional)" htmlFor="email">
                <input
                  id="email"
                  className={styles.input}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email (optional)"
                  value={formData.email}
                  onChange={(event) => update('email', event.target.value)}
                />
              </Field>

              <Field label="Password *" htmlFor="password">
                <PasswordField
                  id="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  shown={showPassword}
                  onChange={(value) => update('password', value)}
                  onToggle={() => setShowPassword(!showPassword)}
                />
              </Field>

              <Field label="Confirm Password *" htmlFor="confirm-password">
                <PasswordField
                  id="confirm-password"
                  placeholder="At least 6 characters"
                  value={formData.confirmPassword}
                  shown={showPassword}
                  onChange={(value) => update('confirmPassword', value)}
                  onToggle={() => setShowPassword(!showPassword)}
                />
              </Field>

              <button className={`${styles.submit} ${styles.fullWidth}`} type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Sending SMS OTP...
                  </>
                ) : (
                  <>
                    Send OTP via SMS <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <p className={styles.footer}>
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#ecfdf5',
                border: '1.5px solid #a7f3d0',
                color: '#047857',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              <ShieldCheck size={30} />
            </div>

            <h1 id="signup-title" className={styles.heading} style={{ marginBottom: '8px' }}>
              Verify Mobile Number
            </h1>
            <p style={{ color: '#4b5563', fontSize: '0.92rem', margin: '0 0 18px 0', lineHeight: 1.5 }}>
              Enter the 6-digit OTP sent via SMS to{' '}
              <strong style={{ color: '#065f46' }}>{normalizedPhone || formData.phone}</strong>
            </p>

            {smsCodePreview && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#f0fdf4',
                  color: '#065f46',
                  border: '1.5px solid #86efac',
                  marginBottom: '16px',
                  fontSize: '0.86rem',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MessageSquare size={18} color="#059669" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#047857' }}>
                      SMS OTP Dispatched ({normalizedPhone || formData.phone})
                    </div>
                    <div>
                      Your verification OTP is{' '}
                      <strong
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '1rem',
                          letterSpacing: '0.1em',
                          backgroundColor: '#ffffff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        {smsCodePreview}
                      </strong>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFillSmsCode}
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Auto-Fill
                </button>
              </div>
            )}

            {successMsg && !smsCodePreview && (
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
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  textAlign: 'left',
                }}
              >
                <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className={styles.alert} role="alert" style={{ marginBottom: '16px', textAlign: 'left' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndRegister} style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label
                  htmlFor="otp-0"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  6-Digit SMS OTP Code
                </label>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                  }}
                  onPaste={handleOtpPaste}
                >
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
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
                  <ArrowLeft size={16} /> Edit Mobile Number
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
                  {resendCooldown > 0 ? `Resend SMS OTP (${resendCooldown}s)` : 'Resend SMS OTP'}
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
  placeholder = 'At least 6 characters',
}: {
  id: string;
  value: string;
  shown: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  placeholder?: string;
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
        placeholder={placeholder}
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
