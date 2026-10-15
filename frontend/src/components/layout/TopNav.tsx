'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Menu,
  Database,
  Calendar,
  LogIn,
  UserPlus,
  LogOut,
  Crown,
} from 'lucide-react';

interface TopNavProps {
  onToggleSidebar?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar }) => {
  const router = useRouter();
  const { user, role, logout, isPostgresActive } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdminKrishna =
    mounted &&
    (user?.email?.toLowerCase() === 'krishnaprasath720@gmail.com' || role === 'admin');

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
    <header
      style={{
        height: '68px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
      }}
    >
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
            {mounted && user?.farmName ? user.farmName : 'Kisan Agro Estate'}
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
        {/* Admin status indicator if logged in as administrator */}
        {user && isAdminKrishna && (
          <Link
            href="/admin"
            title="System Administrator Console"
            className="topnav-admin-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 700,
              backgroundColor: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fcd34d',
              textDecoration: 'none',
            }}
          >
            <Crown size={14} color="#d97706" />
            <span>Admin: Krishna Prasath</span>
          </Link>
        )}

        {/* PostgreSQL Database status indicator */}
        <div
          title={
            isPostgresActive
              ? 'Connected to PostgreSQL Database Engine'
              : 'Running in Local Demo Storage Mode'
          }
          className="topnav-db-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.76rem',
            fontWeight: 600,
            backgroundColor: isPostgresActive ? '#dcfce7' : '#f0fdf4',
            color: isPostgresActive ? '#166534' : '#1b4332',
            border: isPostgresActive ? '1px solid #86efac' : '1px solid #b7e4c7',
          }}
        >
          <Database size={13} color={isPostgresActive ? '#16a34a' : '#52b788'} />
          <span>{isPostgresActive ? 'PostgreSQL Active' : 'Demo Mode'}</span>
        </div>

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
