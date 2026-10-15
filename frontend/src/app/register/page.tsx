'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    farmName: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    // If the user registers with krishnaprasath720@gmail.com, auto-assign admin role
    const assignedRole =
      formData.email.trim().toLowerCase() === 'krishnaprasath720@gmail.com' ? 'admin' : 'farmer';

    const res = await register(
      formData.fullName,
      formData.email,
      formData.password,
      assignedRole,
      formData.farmName
    );

    if (res.success) {
      window.location.href = '/ledger';
    } else {
      setError(res.error || 'Failed to create account. Please try again.');
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
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label
              className="form-label"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#c4d4c9',
                marginBottom: '6px',
              }}
            >
              Full Name *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Ramesh Patel"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              style={{
                width: '100%',
                height: '46px',
                padding: '0 14px',
                borderRadius: '10px',
                border: '1px solid #283a2d',
                backgroundColor: '#16201a',
                fontSize: '0.92rem',
                color: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label
              className="form-label"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#c4d4c9',
                marginBottom: '6px',
              }}
            >
              Email Address *
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="farmer@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                width: '100%',
                height: '46px',
                padding: '0 14px',
                borderRadius: '10px',
                border: '1px solid #283a2d',
                backgroundColor: '#16201a',
                fontSize: '0.92rem',
                color: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label
              className="form-label"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#c4d4c9',
                marginBottom: '6px',
              }}
            >
              Farm / Estate Name (Optional)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Green Valley Farm"
              value={formData.farmName}
              onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
              style={{
                width: '100%',
                height: '46px',
                padding: '0 14px',
                borderRadius: '10px',
                border: '1px solid #283a2d',
                backgroundColor: '#16201a',
                fontSize: '0.92rem',
                color: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label
              className="form-label"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#c4d4c9',
                marginBottom: '6px',
              }}
            >
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
                  width: '100%',
                  height: '46px',
                  padding: '0 42px 0 14px',
                  borderRadius: '10px',
                  border: '1px solid #283a2d',
                  backgroundColor: '#16201a',
                  fontSize: '0.92rem',
                  color: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
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

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label
              className="form-label"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#c4d4c9',
                marginBottom: '6px',
              }}
            >
              Confirm Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              style={{
                width: '100%',
                height: '46px',
                padding: '0 14px',
                borderRadius: '10px',
                border: '1px solid #283a2d',
                backgroundColor: '#16201a',
                fontSize: '0.92rem',
                color: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '48px',
              padding: '0 20px',
              fontSize: '1rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
              color: '#ffffff',
              border: '1px solid rgba(82, 183, 136, 0.35)',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(45, 106, 79, 0.45)',
              transition: 'all 0.2s',
            }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}{' '}
            <ArrowRight size={18} />
          </button>
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
    </>
  );
}
