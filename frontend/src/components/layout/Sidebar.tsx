'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Sprout,
  BookOpen,
  PlusCircle,
  Tag,
  Users,
  Landmark,
  FileText,
  ShieldAlert,
  LogOut,
  Sparkles,
  LucideIcon,
  User,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, role, logout, isPostgresActive } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems: NavItem[] = [
    { label: 'Ledger', href: '/ledger', icon: BookOpen },
    { label: 'New Entry', href: '/entry', icon: PlusCircle },
    { label: 'Plantings', href: '/crops', icon: Sprout },
    { label: 'Expense Types', href: '/expense-types', icon: Tag },
    { label: 'Payees', href: '/payees', icon: Users },
    { label: 'Accounts', href: '/accounts', icon: Landmark },
    { label: 'Persons', href: '/persons', icon: Users },
    { label: 'Reports', href: '/reports', icon: FileText },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  // Admin verification - strictly for administrators
  const isAdmin =
    mounted &&
    (role === 'admin' ||
      user?.role === 'admin' ||
      user?.email?.toLowerCase() === 'krishnaprasath720@gmail.com');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 90,
          }}
        />
      )}

      <aside
        data-open={isOpen ? 'true' : 'false'}
        className={isOpen ? 'sidebar-open' : ''}
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-sidebar)',
          color: '#ffffff',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/ledger" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #52b788, #2d6a4f)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(82, 183, 136, 0.3)',
              }}
            >
              <Sprout size={22} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-heading-stack)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                }}
              >
                AgriTrack
              </div>
              <div style={{ fontSize: '0.72rem', color: '#95d5b2' }}>Smart Farm Suite</div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255, 255, 255, 0.4)',
              padding: '6px 12px',
            }}
          >
            Management
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                  backgroundColor: isActive ? 'rgba(82, 183, 136, 0.22)' : 'transparent',
                  border: isActive ? '1px solid rgba(82, 183, 136, 0.35)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={18} color={isActive ? '#74c69d' : 'rgba(255,255,255,0.6)'} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Admin Navigation Section - strictly visible ONLY when logged in as admin */}
          {isAdmin && (
            <>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255, 255, 255, 0.4)',
                  padding: '14px 12px 6px',
                }}
              >
                Administration
              </div>

              <Link
                href="/admin"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: pathname === '/admin' ? 600 : 500,
                  color: pathname === '/admin' ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                  backgroundColor: pathname === '/admin' ? 'rgba(245, 158, 11, 0.22)' : 'transparent',
                  border:
                    pathname === '/admin' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <ShieldAlert size={18} color={pathname === '/admin' ? '#fbbf24' : '#f59e0b'} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Admin Console</span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      background: '#f59e0b',
                      color: '#000',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    ADMIN
                  </span>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* User Profile Footer */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(0, 0, 0, 0.22)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            {/* User Profile Info */}
            <Link
              href="/profile"
              onClick={onClose}
              title="Click to view & edit your profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                minWidth: 0,
                flex: 1,
                textDecoration: 'none',
                padding: '4px 6px',
                margin: '-4px -6px',
                borderRadius: '8px',
                transition: 'background-color 0.15s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Avatar Squircle */}
              <div
                suppressHydrationWarning
                style={{
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                  border: '1px solid rgba(82, 183, 136, 0.35)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  letterSpacing: '0.02em',
                }}
              >
                {mounted && user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>

              {/* Text Info */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  suppressHydrationWarning
                  title={user?.fullName || ''}
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.25,
                  }}
                >
                  {mounted && user?.fullName ? user.fullName : 'Active Farmer'}
                </div>
                <div
                  suppressHydrationWarning
                  title={user?.email || ''}
                  style={{
                    fontSize: '0.72rem',
                    color: '#8fa998',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: '2px',
                    lineHeight: 1.2,
                  }}
                >
                  {mounted ? user?.email : ''}
                </div>
              </div>
            </Link>

            {/* Professional Single-Line Logout Button */}
            <button
              onClick={async () => {
                await logout('/login');
              }}
              title="Sign Out"
              aria-label="Sign Out"
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 11px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.16)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                e.currentTarget.style.color = '#fca5a5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#e2e8f0';
              }}
            >
              <LogOut size={13} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
