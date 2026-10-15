'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { ActivityLog, ActionType, EntityType } from '@/types';
import { getActivityLogs } from '@/lib/services/dataService';
import { formatDateTime } from '@/lib/utils';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  Edit,
  Trash2,
  RefreshCw,
  Clock,
  Sprout,
  TrendingDown,
  TrendingUp,
  FileText,
  XCircle,
  CheckCircle2,
} from 'lucide-react';

export default function FarmHistoryPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadLogs = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const data = await getActivityLogs(user.uid);
      // Strictly exclude any website administration or user management logs
      const authenticFarmLogs = data.filter((item) => {
        if (!item) return false;
        if (item.entityType === 'user') return false;
        const desc = (item.description || '').toLowerCase();
        if (
          desc.includes('account status') ||
          desc.includes('registered with email') ||
          desc.includes('admin changed') ||
          desc.includes('admin updated')
        ) {
          return false;
        }
        return true;
      });
      setLogs(authenticFarmLogs);
    } catch (err) {
      console.error('Failed to load farm activity logs:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [user]);

  // Filtered and Sorted Logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((l) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          l.description.toLowerCase().includes(query) ||
          l.entityId.toLowerCase().includes(query);

        const matchesAction = actionFilter === 'ALL' || l.actionType === actionFilter;
        const matchesEntity = entityFilter === 'ALL' || l.entityType === entityFilter;

        return matchesSearch && matchesAction && matchesEntity;
      })
      .sort((a, b) => {
        return sortOrder === 'desc'
          ? b.timestamp.localeCompare(a.timestamp)
          : a.timestamp.localeCompare(b.timestamp);
      });
  }, [logs, searchQuery, actionFilter, entityFilter, sortOrder]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Statistics counters
  const totalFarmEvents = logs.length;
  const cropCount = logs.filter((l) => l.entityType === 'cropCycle').length;
  const expenseCount = logs.filter((l) => l.entityType === 'expense').length;
  const incomeCount = logs.filter((l) => l.entityType === 'income').length;

  const getActionBadge = (action: ActionType) => {
    switch (action) {
      case 'created':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 600,
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
            }}
          >
            <PlusCircle size={12} />
            Created
          </span>
        );
      case 'updated':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 600,
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
            }}
          >
            <Edit size={12} />
            Updated
          </span>
        );
      case 'status_change':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 600,
              backgroundColor: '#fffbeb',
              color: '#92400e',
              border: '1px solid #fde68a',
            }}
          >
            <RefreshCw size={12} />
            Status Change
          </span>
        );
      case 'deleted':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 600,
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
            }}
          >
            <Trash2 size={12} />
            Removed
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 600,
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
            }}
          >
            <Clock size={12} />
            Event
          </span>
        );
    }
  };

  const getEntityBadge = (entity: EntityType) => {
    switch (entity) {
      case 'cropCycle':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              backgroundColor: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0',
            }}
          >
            <Sprout size={13} color="#16a34a" />
            Crop Cycle
          </span>
        );
      case 'expense':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              backgroundColor: '#fff7ed',
              color: '#c2410c',
              border: '1px solid #fed7aa',
            }}
          >
            <TrendingDown size={13} color="#ea580c" />
            Farm Expense
          </span>
        );
      case 'income':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
            }}
          >
            <TrendingUp size={13} color="#059669" />
            Harvest Sale
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              backgroundColor: '#f8fafc',
              color: '#475569',
              border: '1px solid #e2e8f0',
            }}
          >
            <FileText size={13} />
            Farm Record
          </span>
        );
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActionFilter('ALL');
    setEntityFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
              }}
            >
              <History size={18} />
            </div>
            <h1 className="page-title" style={{ margin: 0 }}>Farm Activity History</h1>
          </div>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Chronological audit log of crop plantings, field updates, farm expenses, and harvest sales
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={isRefreshing}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Records'}
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Total Farm Events
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                {totalFarmEvents}
              </div>
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
              }}
            >
              <FileText size={20} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Crop Cycle Events
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
                {cropCount}
              </div>
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
              }}
            >
              <Sprout size={20} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Expense Records
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ea580c', marginTop: '4px' }}>
                {expenseCount}
              </div>
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#fff7ed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ea580c',
              }}
            >
              <TrendingDown size={20} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Harvest & Sales
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
                {incomeCount}
              </div>
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}
            >
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)',
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px', width: '100%' }}
            placeholder="Search farm operations, crop names, buyers, or fields..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <XCircle size={16} />
            </button>
          )}
        </div>

        {/* Action Type filter */}
        <select
          className="form-select"
          style={{ width: '175px' }}
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Actions</option>
          <option value="created">Created (New)</option>
          <option value="updated">Updated</option>
          <option value="status_change">Status Changes</option>
          <option value="deleted">Deleted</option>
        </select>

        {/* Entity Type filter - strictly farm operations */}
        <select
          className="form-select"
          style={{ width: '190px' }}
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Farm Entities</option>
          <option value="cropCycle">🌱 Crop Cycles</option>
          <option value="expense">💸 Farm Expenses</option>
          <option value="income">🌾 Harvest & Sales</option>
        </select>

        {/* Sort order toggle */}
        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Toggle Chronological Order"
        >
          <ArrowUpDown size={14} />
          {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
        </button>

        {/* Reset filters if any are active */}
        {(searchQuery || actionFilter !== 'ALL' || entityFilter !== 'ALL') && (
          <button
            onClick={resetFilters}
            className="btn btn-secondary btn-sm"
            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading farm activity logs...</p>
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <div
              className="empty-state-icon"
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#16a34a',
              }}
            >
              <History size={30} />
            </div>
            <div className="empty-state-title" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              No Farm Activity Records Found
            </div>
            <p className="empty-state-text" style={{ maxWidth: '420px', margin: '8px auto 16px' }}>
              {searchQuery || actionFilter !== 'ALL' || entityFilter !== 'ALL'
                ? 'No farm operations match the current filter criteria. Try resetting or adjusting your search.'
                : 'As you plant crop cycles, log farming expenses, or record mandi harvest sales, your chronological timeline will appear here.'}
            </p>
            {(searchQuery || actionFilter !== 'ALL' || entityFilter !== 'ALL') && (
              <button onClick={resetFilters} className="btn btn-secondary btn-sm">
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Timestamp</th>
                  <th style={{ width: '130px' }}>Action</th>
                  <th style={{ width: '150px' }}>Farm Entity</th>
                  <th>Farm Activity Description</th>
                  <th style={{ width: '130px' }}>Record Ref</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => (
                  <tr key={log.logId} style={{ transition: 'background-color 0.15s ease' }}>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td>{getActionBadge(log.actionType)}</td>
                    <td>{getEntityBadge(log.entityType)}</td>
                    <td style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 500, lineHeight: 1.4 }}>
                      {log.description}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          color: 'var(--text-dim)',
                          fontFamily: 'monospace',
                          backgroundColor: '#f8fafc',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {log.entityId}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>
              Showing {paginatedLogs.length} of {filteredLogs.length} farm events (Page {currentPage} of {totalPages})
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
