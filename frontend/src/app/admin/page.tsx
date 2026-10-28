'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/ui/StatCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserProfile, AccountStatus } from '@/types';
import {
  getAdminUsersList,
  updateUserAccountStatus,
  deleteUserAccount,
  getPlatformStatistics,
} from '@/lib/services/dataService';
import { formatINR, formatDate } from '@/lib/utils';
import {
  ShieldAlert,
  Users,
  Sprout,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  ShieldCheck,
  UserX,
  Trash2,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalActiveFarmers: 0,
    totalCropsTracked: 0,
    totalRevenueVolume: 0,
    totalExpenseVolume: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Status toggle confirmation
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  // Delete confirmation
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAdminData = async (isManualRefresh: boolean = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const uList = await getAdminUsersList();
      const pStats = await getPlatformStatistics(uList);
      setUsers(uList);
      setStats(pStats);
      if (isManualRefresh) {
        setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadAdminData(true);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleStatusChange = async (userItem: UserProfile) => {
    const newStatus: AccountStatus = userItem.accountStatus === 'active' ? 'deactivated' : 'active';

    // 1. Immediate optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.uid === userItem.uid ? { ...u, accountStatus: newStatus } : u))
    );
    setStats((prev) => ({
      ...prev,
      totalActiveFarmers:
        userItem.role === 'farmer'
          ? newStatus === 'active'
            ? prev.totalActiveFarmers + 1
            : Math.max(0, prev.totalActiveFarmers - 1)
          : prev.totalActiveFarmers,
    }));
    setTargetUser(null);

    // 2. Persist to server API
    try {
      await updateUserAccountStatus(userItem.uid, newStatus, user?.uid || 'admin');
    } catch (err) {
      console.error('Failed to update status on server:', err);
    }

    // 3. Re-sync from server to maintain parity
    await loadAdminData();
  };

  const handleDeleteUser = async (userItem: UserProfile) => {
    setDeleting(true);
    // 1. Immediate optimistic UI update
    setUsers((prev) => prev.filter((u) => u.uid !== userItem.uid));
    setStats((prev) => ({
      ...prev,
      totalUsers: Math.max(0, prev.totalUsers - 1),
      totalActiveFarmers:
        userItem.role === 'farmer' && userItem.accountStatus === 'active'
          ? Math.max(0, prev.totalActiveFarmers - 1)
          : prev.totalActiveFarmers,
    }));
    setDeleteTargetUser(null);

    // 2. Persist deletion via dataService
    try {
      await deleteUserAccount(userItem.uid);
    } catch (err) {
      console.error('Failed to delete user on server:', err);
    } finally {
      setDeleting(false);
    }

    // 3. Re-sync from server to maintain parity
    await loadAdminData();
  };

  const isAdmin =
    role === 'admin' ||
    user?.role === 'admin' ||
    user?.email?.toLowerCase() === 'krishnaprasath720@gmail.com';

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // While checking or restoring auth session, show a clean loading indicator
  if (authLoading) {
    return (
      <AppShell>
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            color: 'var(--text-muted)',
          }}
        >
          <RefreshCw size={32} className="animate-spin" style={{ color: '#16a34a' }} />
          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Verifying administrator credentials...</p>
        </div>
      </AppShell>
    );
  }

  // Not logged in (router is redirecting to /login)
  if (!user) {
    return null;
  }

  // Strict access guard: only administrators can view this page
  if (!isAdmin) {
    return (
      <AppShell>
        <div
          className="card"
          style={{
            maxWidth: '560px',
            margin: '60px auto',
            textAlign: 'center',
            padding: '48px 32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <ShieldAlert size={36} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-900)', marginBottom: '12px' }}>
            Administrator Access Restricted
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '28px' }}>
            This administration console is strictly restricted to platform administrators (krishnaprasath720@gmail.com).
            Other users do not have permissions to access or view platform controls.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Link href="/ledger" className="btn btn-primary">
              Return to Farm Ledger
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const filteredUsers = users.filter((u) => {
    return (
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery)) ||
      (u.farmName && u.farmName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <AppShell>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-title">Platform Administration & Governance</h1>
            <span
              style={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              PRIVILEGED
            </span>
          </div>
          <p className="page-subtitle">
            Oversee registered farmer accounts, monitor system volumes, and manage credentials
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary btn-sm"
            style={{
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.75 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Fetch the latest users and statistics from PostgreSQL"
          >
            <RefreshCw
              size={14}
              style={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Platform Data'}</span>
          </button>
          {lastRefreshedAt && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              Synced with DB: {lastRefreshedAt}
            </span>
          )}
        </div>
      </div>

      {/* Platform Statistics Cards */}
      <div className="grid-stats">
        <StatCard
          label="Total Registered Users"
          value={stats.totalUsers}
          icon={Users}
          subtext={`${stats.totalActiveFarmers} active farmers`}
          colorTone="green"
        />
        <StatCard
          label="Total Crops Tracked"
          value={stats.totalCropsTracked}
          icon={Sprout}
          subtext="Active & harvested plantings"
          colorTone="blue"
        />
        <StatCard
          label="Platform Revenue Volume"
          value={formatINR(stats.totalRevenueVolume)}
          icon={TrendingUp}
          subtext="Total agricultural sales"
          colorTone="green"
        />
        <StatCard
          label="Total Financial Entries"
          value={stats.totalTransactions}
          icon={TrendingDown}
          subtext="Combined sales & expenses"
          colorTone="amber"
        />
      </div>

      {/* User Management Section */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="card-title">
              <Users size={20} color="#2d6a4f" /> Registered Farmer Accounts
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Manage accounts and enforce authorization security
            </p>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
              placeholder="Search user or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Farmer Name</th>
                <th>Contact Info</th>
                <th>Farm / Location</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Member Since</th>
                <th>Security Action</th>
                <th style={{ textAlign: 'right' }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((item) => {
                const isActive = item.accountStatus === 'active';

                return (
                  <tr key={item.uid}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-900)' }}>
                      {item.fullName}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.email}</div>
                      {item.phone && (
                        <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span>📱 {item.phone}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {item.farmName || 'Primary Holding'}
                      {item.location && <span style={{ color: 'var(--text-dim)' }}> ({item.location})</span>}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: item.role === 'admin' ? '#fef3c7' : '#e0f2fe',
                          color: item.role === 'admin' ? '#92400e' : '#0369a1',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        {item.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                          color: isActive ? '#15803d' : '#991b1b',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                        }}
                      >
                        {isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                      {formatDate(item.createdAt)}
                    </td>
                    <td>
                      {item.uid === user?.uid ||
                      item.email.toLowerCase() === user?.email?.toLowerCase() ||
                      item.email.toLowerCase() === 'krishnaprasath720@gmail.com' ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Self Account
                        </span>
                      ) : (
                        <button
                          onClick={() => setTargetUser(item)}
                          className={isActive ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                          style={{
                            color: isActive ? '#dc2626' : '#ffffff',
                            fontSize: '0.78rem',
                            padding: '4px 10px',
                          }}
                        >
                          {isActive ? (
                            <>
                              <Lock size={12} /> Deactivate
                            </>
                          ) : (
                            <>
                              <Unlock size={12} /> Activate
                            </>
                          )}
                        </button>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.uid === user?.uid ||
                      item.email.toLowerCase() === user?.email?.toLowerCase() ||
                      item.email.toLowerCase() === 'krishnaprasath720@gmail.com' ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Protected
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteTargetUser(item)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            color: '#dc2626',
                            borderColor: '#fca5a5',
                            backgroundColor: '#fef2f2',
                            fontSize: '0.78rem',
                            padding: '4px 10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title={`Delete account for ${item.fullName}`}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM STATUS TOGGLE DIALOG */}
      {targetUser && (
        <ConfirmDialog
          isOpen={Boolean(targetUser)}
          title={targetUser.accountStatus === 'active' ? 'Deactivate User Account' : 'Activate User Account'}
          message={`Are you sure you want to ${
            targetUser.accountStatus === 'active' ? 'deactivate' : 'reactivate'
          } the account for ${targetUser.fullName} (${targetUser.email})? Deactivated users are blocked from logging in.`}
          confirmLabel={targetUser.accountStatus === 'active' ? 'Confirm Deactivation' : 'Confirm Activation'}
          isDestructive={targetUser.accountStatus === 'active'}
          onConfirm={() => handleStatusChange(targetUser)}
          onCancel={() => setTargetUser(null)}
        />
      )}

      {/* CONFIRM DELETE DIALOG */}
      {deleteTargetUser && (
        <ConfirmDialog
          isOpen={Boolean(deleteTargetUser)}
          title="Delete Farmer Account"
          message={`Are you sure you want to permanently delete the account for "${deleteTargetUser.fullName}" (${deleteTargetUser.email})? This action cannot be undone and will permanently remove their registered profile and associated farm data.`}
          confirmLabel={deleting ? 'Deleting...' : 'Delete Account'}
          isDestructive={true}
          onConfirm={() => handleDeleteUser(deleteTargetUser)}
          onCancel={() => setDeleteTargetUser(null)}
        />
      )}
    </AppShell>
  );
}
