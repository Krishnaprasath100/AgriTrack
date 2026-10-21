'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Menu,
  Calendar,
  LogIn,
  UserPlus,
  LogOut,
} from 'lucide-react';

interface TopNavProps {
  onToggleSidebar?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar }) => {
  const router = useRouter();
  const { user, role, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleLogout = async () => {
    await logout('/login');
  };

  return (
    <header className="app-topnav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            color: 'var(--text-main)',
          }}
          className="mobile-toggle-btn"
          aria-label="Toggle Navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <div suppressHydrationWarning style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-900)' }}>
            {mounted && user?.fullName ? user.fullName : 'AgriTrack Farm Suite'}
          </div>
          <div
            suppressHydrationWarning
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Calendar size={12} /> {mounted ? today : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
          title={language === 'en' ? 'தமிழில் மாற்றவும்' : 'Switch to English'}
          aria-label="Change application language"
          className="language-toggle"
        >
          {language === 'en' ? 'தமிழ்' : 'English'}
        </button>

        {/* Auth Button: If logged in, ONLY show clean Log Out. If not logged in, show Login and Sign Up. */}
        <div>
          {mounted && user ? (
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#dc2626',
                borderColor: '#fca5a5',
                backgroundColor: '#fef2f2',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.15s ease',
              }}
              title="Sign Out of Account"
            >
              <LogOut size={14} /> Log Out
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                href="/login"
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <LogIn size={13} /> Login
              </Link>
              <Link
                href="/register"
                className="btn btn-primary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <UserPlus size={13} /> Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 992px) {
          .mobile-toggle-btn {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
};

export default TopNav;
