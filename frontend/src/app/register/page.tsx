'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Sprout,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Phone,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

// ─── OTP Digit Input Component ──────────────────────────────────────
function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, '').slice(0, 6).split('');

  const focusInput = (idx: number) => {
    if (idx >= 0 && idx < 6) {
      inputRefs.current[idx]?.focus();
    }
  };

  const handleChange = (idx: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const arr = [...digits];
    arr[idx] = char;
    const next = arr.join('');
    onChange(next.replace(/\s/g, ''));
    if (char && idx < 5) {
      focusInput(idx + 1);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        focusInput(idx - 1);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focusInput(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < 5) {
      focusInput(idx + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      focusInput(Math.min(pasted.length, 5));
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[idx]?.trim() || ''}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={idx === 0 ? handlePaste : undefined}
          disabled={disabled}
          autoComplete="one-time-code"
          style={{
            width: '46px',
            height: '52px',
            textAlign: 'center',
            fontSize: '1.4rem',
            fontWeight: 700,
            fontFamily: "'Poppins', monospace",
            color: '#ffffff',
            backgroundColor: disabled ? '#0d1310' : '#16201a',
            border: `2px solid ${
              disabled
                ? 'rgba(82, 183, 136, 0.15)'
                : digits[idx]?.trim()
                ? 'rgba(82, 183, 136, 0.6)'
                : '#283a2d'
            }`,
            borderRadius: '10px',
            outline: 'none',
            transition: 'all 0.2s ease',
            caretColor: '#52b788',
            opacity: disabled ? 0.5 : 1,
            boxShadow: digits[idx]?.trim()
              ? '0 0 12px rgba(82, 183, 136, 0.15)'
              : 'none',
          }}
          onFocus={(e) => {
            if (!disabled) {
              e.target.style.borderColor = 'rgba(82, 183, 136, 0.7)';
              e.target.style.boxShadow = '0 0 16px rgba(82, 183, 136, 0.25)';
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = digits[idx]?.trim()
              ? 'rgba(82, 183, 136, 0.6)'
              : '#283a2d';
            e.target.style.boxShadow = digits[idx]?.trim()
              ? '0 0 12px rgba(82, 183, 136, 0.15)'
              : 'none';
          }}
        />
      ))}
    </div>
  );
}

// ─── Countdown Timer Hook ───────────────────────────────────────────
function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback((s?: number) => {
    setSeconds(s ?? initialSeconds);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initialSeconds]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { seconds, isActive: seconds > 0, start };
}

// ─── Shared Styles ──────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#c4d4c9',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '46px',
  padding: '0 14px',
  borderRadius: '10px',
  border: '1px solid #283a2d',
  backgroundColor: '#16201a',
  fontSize: '0.92rem',
  color: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.2s ease',
};

// ─── Register Page ──────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
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

  // OTP State
  const [otpStep, setOtpStep] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const countdown = useCountdown(30);

  // Reset OTP state when phone changes
  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: cleaned });

    // Reset OTP if phone changes after OTP was sent
    if (otpStep !== 'idle') {
      setOtpStep('idle');
      setOtpCode('');
      setOtpError('');
      setOtpSuccess('');
    }
  };

  const handleSendOtp = async () => {
    setOtpError('');
    setOtpSuccess('');

    if (formData.phone.length !== 10) {
      setOtpError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setOtpError('Indian mobile numbers must start with 6, 7, 8, or 9');
      return;
    }

    setOtpSending(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOtpStep('sent');
        if (data.devCode) {
          setOtpSuccess(`OTP sent! (Dev Code: ${data.devCode})`);
          setOtpCode(data.devCode);
        } else {
          setOtpSuccess('OTP sent! Check your SMS inbox.');
        }
        countdown.start(data.cooldown || 30);
      } else {
        setOtpError(data.error || 'Failed to send OTP');
      }
    } catch {
      setOtpError('Network error. Please check your connection.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    setOtpSuccess('');

    if (otpCode.length < 6) {
      setOtpError('Please enter the complete 6-digit OTP');
      return;
    }

    setOtpVerifying(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone, code: otpCode }),
      });

      const data = await res.json();

      if (res.ok && data.verified) {
        setOtpStep('verified');
        setOtpSuccess('Mobile number verified!');
        setOtpError('');
      } else {
        setOtpError(data.error || 'Invalid OTP. Please try again.');
        if (data.expired) {
          setOtpStep('idle');
          setOtpCode('');
        }
      }
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown.isActive) return;
    setOtpCode('');
    await handleSendOtp();
  };

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (otpCode.length === 6 && otpStep === 'sent' && !otpVerifying) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!formData.phone || formData.phone.length !== 10) {
      setError('A valid mobile number is required.');
      return;
    }

    if (otpStep !== 'verified') {
      setError('Please verify your mobile number with OTP before proceeding.');
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
    const assignedRole =
      formData.email.trim().toLowerCase() === 'krishnaprasath720@gmail.com' ? 'admin' : 'farmer';

    const res = await register(
      formData.fullName,
      formData.email,
      formData.password,
      assignedRole,
      formData.farmName,
      formData.phone
    );

    if (res.success) {
      window.location.href = '/ledger';
    } else {
      setError(res.error || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  const isPhoneValid = /^[6-9]\d{9}$/.test(formData.phone);

  return (
    <>
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #000000 !important;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGreen {
          0%, 100% { box-shadow: 0 0 0 0 rgba(82, 183, 136, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(82, 183, 136, 0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes checkBounce {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .otp-section { animation: fadeInUp 0.35s ease-out; }
        .verified-badge { animation: checkBounce 0.4s ease-out forwards; }
      `}</style>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          fontFamily: "'Poppins', 'Inter', -apple-system, sans-serif",
          margin: 0,
        }}
      >
      <div
        className="card"
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#0d1310',
          borderRadius: '24px',
          padding: '36px 36px 40px',
          boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.9), 0 0 40px -8px rgba(45, 106, 79, 0.2)',
          border: '1px solid rgba(45, 106, 79, 0.35)',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 16px rgba(45, 106, 79, 0.45)',
                border: '1px solid rgba(82, 183, 136, 0.3)',
              }}
            >
              <Sprout size={26} />
            </div>
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              AgriTrack
            </span>
          </Link>
          <h1
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#ffffff',
              margin: 0,
            }}
          >
            Create Your Account
          </h1>
          <p style={{ color: '#8fa395', fontSize: '0.88rem', marginTop: '6px' }}>
            Join AgriTrack to track crop cycles, expenses, and farm profits
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            backgroundColor: '#16211a',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '20px',
            gap: '4px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <Link
            href="/login"
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#8fa395',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'color 0.2s ease',
              textAlign: 'center',
            }}
          >
            <LogIn size={16} /> Sign In
          </Link>
          <button
            type="button"
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(82, 183, 136, 0.25)',
              backgroundColor: '#223328',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              cursor: 'default',
            }}
          >
            <UserPlus size={16} /> Sign Up
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={labelStyle}>
              Full Name *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Ramesh Patel"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={labelStyle}>
              Email Address *
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="farmer@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={inputStyle}
            />
          </div>

          {/* ─── Mobile Number + OTP Section ─────────────────────────── */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={labelStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} />
                Mobile Number *
                {otpStep === 'verified' && (
                  <span
                    className="verified-badge"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#52b788',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      marginLeft: '4px',
                    }}
                  >
                    <CheckCircle2 size={14} /> Verified
                  </span>
                )}
              </span>
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              {/* +91 Prefix */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#16201a',
                  border: '1px solid #283a2d',
                  borderRadius: '10px',
                  padding: '0 12px',
                  color: '#8fa395',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  flexShrink: 0,
                  minWidth: '52px',
                  userSelect: 'none',
                }}
              >
                🇮🇳 +91
              </div>
              {/* Phone Input */}
              <input
                type="tel"
                className="form-input"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                maxLength={10}
                disabled={otpStep === 'verified'}
                style={{
                  ...inputStyle,
                  flex: 1,
                  opacity: otpStep === 'verified' ? 0.6 : 1,
                  letterSpacing: '0.05em',
                }}
              />
              {/* Send OTP / Verified Button */}
              {otpStep !== 'verified' ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={!isPhoneValid || otpSending || countdown.isActive}
                  style={{
                    flexShrink: 0,
                    padding: '0 16px',
                    height: '46px',
                    borderRadius: '10px',
                    border: '1px solid rgba(82, 183, 136, 0.35)',
                    background:
                      isPhoneValid && !otpSending && !countdown.isActive
                        ? 'linear-gradient(135deg, #2d6a4f, #1b4332)'
                        : '#16201a',
                    color:
                      isPhoneValid && !otpSending && !countdown.isActive ? '#ffffff' : '#5a6e60',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor:
                      isPhoneValid && !otpSending && !countdown.isActive
                        ? 'pointer'
                        : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    boxShadow:
                      isPhoneValid && !otpSending && !countdown.isActive
                        ? '0 4px 12px rgba(45, 106, 79, 0.35)'
                        : 'none',
                  }}
                >
                  {otpSending ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      Sending...
                    </>
                  ) : countdown.isActive ? (
                    `${countdown.seconds}s`
                  ) : otpStep === 'sent' ? (
                    <>
                      <RefreshCw size={13} /> Resend
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} /> Send OTP
                    </>
                  )}
                </button>
              ) : (
                <div
                  style={{
                    flexShrink: 0,
                    padding: '0 14px',
                    height: '46px',
                    borderRadius: '10px',
                    border: '1px solid rgba(82, 183, 136, 0.4)',
                    backgroundColor: 'rgba(82, 183, 136, 0.1)',
                    color: '#52b788',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <CheckCircle2 size={15} /> Verified
                </div>
              )}
            </div>

            {/* OTP Error / Success Messages */}
            {otpError && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  animation: 'fadeInUp 0.25s ease-out',
                }}
              >
                <AlertCircle size={14} /> {otpError}
              </div>
            )}
            {otpSuccess && !otpError && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(82, 183, 136, 0.12)',
                  color: '#52b788',
                  border: '1px solid rgba(82, 183, 136, 0.25)',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  animation: 'fadeInUp 0.25s ease-out',
                }}
              >
                <CheckCircle2 size={14} /> {otpSuccess}
              </div>
            )}
          </div>

          {/* ─── OTP Entry Section (appears after Send) ──────────────── */}
          {otpStep === 'sent' && (
            <div
              className="otp-section"
              style={{
                marginBottom: '14px',
                padding: '20px 16px',
                backgroundColor: 'rgba(22, 32, 26, 0.8)',
                borderRadius: '14px',
                border: '1px solid rgba(82, 183, 136, 0.15)',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '14px',
                  fontSize: '0.85rem',
                  color: '#8fa395',
                }}
              >
                Enter the 6-digit code sent to{' '}
                <span style={{ color: '#c4d4c9', fontWeight: 700 }}>
                  +91 {formData.phone}
                </span>
              </div>

              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                disabled={otpVerifying}
              />

              {/* Verifying Spinner */}
              {otpVerifying && (
                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '12px',
                    color: '#52b788',
                    fontSize: '0.83rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  Verifying...
                </div>
              )}

              {/* Resend Row */}
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '14px',
                  fontSize: '0.8rem',
                  color: '#6b7f71',
                }}
              >
                {countdown.isActive ? (
                  <span>
                    Resend OTP in{' '}
                    <span style={{ color: '#52b788', fontWeight: 700 }}>
                      {countdown.seconds}s
                    </span>
                  </span>
                ) : (
                  <span>
                    Didn&apos;t receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#52b788',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: 0,
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                      }}
                    >
                      Resend OTP
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={labelStyle}>
              Password * (Min 6 characters)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{
                  ...inputStyle,
                  padding: '0 42px 0 14px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8fa395',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={labelStyle}>
              Confirm Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              style={inputStyle}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '48px',
              padding: '0 20px',
              fontSize: '1rem',
              fontWeight: 700,
              background:
                otpStep === 'verified'
                  ? 'linear-gradient(135deg, #2d6a4f, #1b4332)'
                  : '#16201a',
              color: otpStep === 'verified' ? '#ffffff' : '#5a6e60',
              border: `1px solid ${
                otpStep === 'verified'
                  ? 'rgba(82, 183, 136, 0.35)'
                  : 'rgba(82, 183, 136, 0.15)'
              }`,
              borderRadius: '12px',
              cursor: otpStep === 'verified' && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow:
                otpStep === 'verified'
                  ? '0 6px 20px rgba(45, 106, 79, 0.45)'
                  : 'none',
              transition: 'all 0.3s ease',
            }}
            disabled={loading || otpStep !== 'verified'}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Creating Account...
              </>
            ) : otpStep !== 'verified' ? (
              <>
                <ShieldCheck size={18} />
                Verify Mobile to Continue
              </>
            ) : (
              <>
                Complete Registration <ArrowRight size={18} />
              </>
            )}
          </button>

          {otpStep !== 'verified' && (
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.76rem',
                color: '#5a6e60',
                marginTop: '10px',
                marginBottom: 0,
              }}
            >
              Mobile verification is required for account security
            </p>
          )}
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '0.88rem',
            color: '#8fa395',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>Already have an account?</span>
          <Link
            href="/login"
            style={{ color: '#52b788', fontWeight: 700, textDecoration: 'none' }}
          >
            Sign In Here &rarr;
          </Link>
        </div>
      </div>
    </div>

    {/* Spinner keyframe */}
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
    </>
  );
}
