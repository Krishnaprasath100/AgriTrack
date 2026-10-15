'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Sprout,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    setError('');

    const targetEmail = (email || emailRef.current?.value || '').trim();
    const targetPassword = password || passwordRef.current?.value || '';

    if (!targetEmail || !targetPassword) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await login(targetEmail, targetPassword);

      if (res && res.success) {
        router.replace('/ledger');
      } else {
        setError(res?.error || 'Authentication failed. Please verify credentials.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify credentials.');
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #000000 !important;
        }
      `}</style>
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          boxSizing: 'border-box',
          fontFamily: "'Poppins', 'Inter', -apple-system, sans-serif",
          position: 'relative',
          overflow: 'hidden',
          margin: 0,
        }}
      >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          zIndex: 1,
        }}
      >
        {/* ======================================================== */}
        {/* LEFT SIDE: Balanced High-End Login Card / Bar            */}
        {/* ======================================================== */}
        <div
          style={{
            maxWidth: '470px',
            width: '100%',
            backgroundColor: '#0d1310',
            borderRadius: '24px',
            padding: '38px 36px 42px',
            boxShadow:
              '0 24px 60px -12px rgba(0, 0, 0, 0.95), 0 0 42px -8px rgba(45, 106, 79, 0.3)',
            border: '1px solid rgba(45, 106, 79, 0.38)',
            boxSizing: 'border-box',
          }}
        >
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '13px',
                  background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 18px rgba(45, 106, 79, 0.5)',
                  border: '1px solid rgba(82, 183, 136, 0.35)',
                }}
              >
                <Sprout size={27} />
              </div>
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '1.55rem',
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
                fontSize: '1.85rem',
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
              }}
            >
              Welcome Back
            </h1>
          </div>

          {/* Tab Switcher: Sign In vs Sign Up */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              backgroundColor: '#16211a',
              padding: '4px',
              borderRadius: '13px',
              marginBottom: '24px',
              gap: '5px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <button
              type="button"
              style={{
                padding: '11px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(82, 183, 136, 0.25)',
                backgroundColor: '#223328',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                cursor: 'default',
              }}
            >
              <LogIn size={17} /> Sign In
            </button>
            <Link
              href="/register"
              style={{
                padding: '11px 16px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#8fa395',
                fontWeight: 600,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'color 0.2s',
              }}
            >
              <UserPlus size={17} /> Sign Up
            </Link>
          </div>

          {error && (
            <div
              style={{
                padding: '13px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '11px',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(e);
              return false;
            }}
          >
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#c4d4c9',
                  marginBottom: '7px',
                }}
              >
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={emailRef}
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 15px',
                    borderRadius: '11px',
                    border: '1px solid #283a2d',
                    backgroundColor: '#16201a',
                    fontSize: '0.94rem',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#c4d4c9',
                  marginBottom: '7px',
                }}
              >
                password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 44px 0 15px',
                    borderRadius: '11px',
                    border: '1px solid #283a2d',
                    backgroundColor: '#16201a',
                    fontSize: '0.94rem',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
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
                    color: '#8fa395',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                height: '50px',
                padding: '0 20px',
                fontSize: '1.02rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                color: '#ffffff',
                border: '1px solid rgba(82, 183, 136, 0.35)',
                borderRadius: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '9px',
                boxShadow: '0 6px 22px rgba(45, 106, 79, 0.45)',
                transition: 'all 0.2s',
              }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In to Account'}{' '}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Link to Sign Up */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '18px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center',
              fontSize: '0.9rem',
              color: '#8fa395',
            }}
          >
            Don&apos;t have an account yet?{' '}
            <Link
              href="/register"
              style={{ color: '#52b788', fontWeight: 700, textDecoration: 'none' }}
            >
              Create New Farmer Account
            </Link>
          </div>
        </div>


      </div>
    </div>
    </>
  );
}
