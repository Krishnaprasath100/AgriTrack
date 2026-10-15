/**
 * Format number as Indian Rupee currency (₹)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/**
 * Format number with Indian numbering system (without currency symbol)
 */
export function formatNumberIN(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format ISO date string into readable date (e.g., "12 Oct 2024")
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format timestamp into readable date & time (e.g., "12 Oct 2024, 03:45 PM")
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculate days remaining until target date
 */
export function getDaysRemaining(targetDateStr: string): {
  days: number;
  isOverdue: boolean;
  label: string;
} {
  if (!targetDateStr) {
    return { days: 0, isOverdue: false, label: 'No date set' };
  }
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      days: diffDays,
      isOverdue: true,
      label: `${absDays} day${absDays === 1 ? '' : 's'} overdue`,
    };
  } else if (diffDays === 0) {
    return { days: 0, isOverdue: false, label: 'Today' };
  } else if (diffDays === 1) {
    return { days: 1, isOverdue: false, label: 'Tomorrow' };
  } else {
    return {
      days: diffDays,
      isOverdue: false,
      label: `${diffDays} days left`,
    };
  }
}

/**
 * Calculate progress percentage of crop cycle
 */
export function calculateCropProgress(seedingDateStr: string, harvestDateStr: string): number {
  if (!seedingDateStr || !harvestDateStr) return 0;
  const seeding = new Date(seedingDateStr).getTime();
  const harvest = new Date(harvestDateStr).getTime();
  const now = new Date().getTime();

  if (harvest <= seeding) return 100;
  if (now <= seeding) return 0;
  if (now >= harvest) return 100;

  const total = harvest - seeding;
  const elapsed = now - seeding;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

/**
 * Generate unique ID with prefix
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Export array of objects to CSV file trigger
 */
export function exportToCSV<T extends object>(
  filename: string,
  rows: T[],
  headers: { key: keyof T; label: string }[]
): void {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const csvRows: string[] = [];
  // Header row
  csvRows.push(headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(','));

  // Data rows
  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h.key];
      if (val === null || val === undefined) return '""';
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    });
    csvRows.push(values.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
