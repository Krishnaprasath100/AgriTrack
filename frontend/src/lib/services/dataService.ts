import {
  CropCycle,
  ExpenseRecord,
  IncomeRecord,
  ActivityLog,
  UserProfile,
  FinancialSummary,
  CropProfitSummary,
  AccountStatus,
  LedgerContact,
  LedgerAccount,
  ExpenseTypeOption,
} from '@/types';
import {
  INITIAL_DEMO_CROPS,
  INITIAL_DEMO_EXPENSES,
  INITIAL_DEMO_INCOME,
  INITIAL_DEMO_LOGS,
  INITIAL_DEMO_USERS,
} from '@/lib/mockData';
import { generateId } from '@/lib/utils';

const STORAGE_KEYS = {
  CROPS: 'agritrack_crops',
  EXPENSES: 'agritrack_expenses',
  INCOME: 'agritrack_income',
  LOGS: 'agritrack_logs',
  USERS: 'agritrack_users',
  CONTACTS: 'agritrack_contacts',
  ACCOUNTS: 'agritrack_accounts',
  EXPENSE_TYPES: 'agritrack_expense_types',
  QUICK_CROPS: 'agritrack_quick_crops',
};

// Local storage helpers
function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage error:', err);
  }
}

export function initDemoStorage(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.CROPS)) {
    localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INCOME)) {
    localStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_DEMO_USERS));
  }
}

export function resetDemoStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_DEMO_USERS));
}

// ----------------------------------------------------
// LEDGER SETUP (local-first supplementary records)
// ----------------------------------------------------
export function getLedgerContacts(userId: string, kind?: LedgerContact['kind']): LedgerContact[] {
  const records = getLocal<LedgerContact[]>(STORAGE_KEYS.CONTACTS, []);
  return records.filter((record) => record.userId === userId && (!kind || record.kind === kind));
}

export function saveLedgerContact(contact: Omit<LedgerContact, 'id' | 'createdAt'> & { id?: string }): LedgerContact {
  const records = getLocal<LedgerContact[]>(STORAGE_KEYS.CONTACTS, []);
  const saved: LedgerContact = {
    ...contact,
    id: contact.id || generateId(contact.kind),
    createdAt: new Date().toISOString(),
  };
  const index = records.findIndex((record) => record.id === saved.id);
  if (index >= 0) records[index] = { ...records[index], ...saved };
  else records.unshift(saved);
  setLocal(STORAGE_KEYS.CONTACTS, records);
  return saved;
}

export function deleteLedgerContact(id: string): void {
  setLocal(STORAGE_KEYS.CONTACTS, getLocal<LedgerContact[]>(STORAGE_KEYS.CONTACTS, []).filter((record) => record.id !== id));
}

export function getLedgerAccounts(userId: string): LedgerAccount[] {
  const records = getLocal<LedgerAccount[]>(STORAGE_KEYS.ACCOUNTS, []);
  const ownRecords = records.filter((record) => record.userId === userId);
  return ownRecords.length
    ? ownRecords
    : [{ id: 'cash-in-hand', userId, displayName: 'Cash in Hand', accountType: 'Cash', isDefault: true, createdAt: new Date().toISOString() }];
}

export function saveLedgerAccount(account: Omit<LedgerAccount, 'id' | 'createdAt'> & { id?: string }): LedgerAccount {
  const records = getLocal<LedgerAccount[]>(STORAGE_KEYS.ACCOUNTS, []);
  const saved: LedgerAccount = { ...account, id: account.id || generateId('account'), createdAt: new Date().toISOString() };
  const adjusted = saved.isDefault
    ? records.map((record) => record.userId === saved.userId ? { ...record, isDefault: false } : record)
    : records;
  const index = adjusted.findIndex((record) => record.id === saved.id);
  if (index >= 0) adjusted[index] = { ...adjusted[index], ...saved };
  else adjusted.unshift(saved);
  setLocal(STORAGE_KEYS.ACCOUNTS, adjusted);
  return saved;
}

export function deleteLedgerAccount(id: string): void {
  setLocal(STORAGE_KEYS.ACCOUNTS, getLocal<LedgerAccount[]>(STORAGE_KEYS.ACCOUNTS, []).filter((record) => record.id !== id));
}

export function getExpenseTypeOptions(userId: string): ExpenseTypeOption[] {
  return getLocal<ExpenseTypeOption[]>(STORAGE_KEYS.EXPENSE_TYPES, []).filter((record) => record.userId === userId);
}

export function saveExpenseTypeOption(option: Omit<ExpenseTypeOption, 'id' | 'createdAt'> & { id?: string }): ExpenseTypeOption {
  const records = getLocal<ExpenseTypeOption[]>(STORAGE_KEYS.EXPENSE_TYPES, []);
  const saved: ExpenseTypeOption = { ...option, id: option.id || generateId('expense-type'), createdAt: new Date().toISOString() };
  const index = records.findIndex((record) => record.id === saved.id);
  if (index >= 0) records[index] = { ...records[index], ...saved };
  else records.unshift(saved);
  setLocal(STORAGE_KEYS.EXPENSE_TYPES, records);
  return saved;
}

export function deleteExpenseTypeOption(id: string): void {
  setLocal(STORAGE_KEYS.EXPENSE_TYPES, getLocal<ExpenseTypeOption[]>(STORAGE_KEYS.EXPENSE_TYPES, []).filter((record) => record.id !== id));
}

export function getQuickCropChoices(userId: string): string[] {
  const records = getLocal<Record<string, string[]>>(STORAGE_KEYS.QUICK_CROPS, {});
  return records[userId] || [];
}

export function saveQuickCropChoice(userId: string, cropName: string): string[] {
  const cleanedName = cropName.trim().replace(/\s+/g, ' ');
  if (!cleanedName) return getQuickCropChoices(userId);

  const records = getLocal<Record<string, string[]>>(STORAGE_KEYS.QUICK_CROPS, {});
  const current = records[userId] || [];
  const exists = current.some((crop) => crop.toLowerCase() === cleanedName.toLowerCase());
  const updated = exists ? current : [...current, cleanedName];
  setLocal(STORAGE_KEYS.QUICK_CROPS, { ...records, [userId]: updated });
  return updated;
}

// ----------------------------------------------------
// ACTIVITY LOGGING
// ----------------------------------------------------
export async function logActivity(
  userId: string,
  actionType: ActivityLog['actionType'],
  entityType: ActivityLog['entityType'],
  entityId: string,
  description: string
): Promise<void> {
  // Never log website administration, user management, or account status updates into farm activity history
  if (
    entityType === 'user' ||
    description.toLowerCase().includes('account status') ||
    description.toLowerCase().includes('admin changed') ||
    description.toLowerCase().includes('registered with email')
  ) {
    return;
  }

  const newLog: ActivityLog = {
    logId: generateId('log'),
    userId,
    actionType,
    entityType,
    entityId,
    description,
    timestamp: new Date().toISOString(),
  };

  initDemoStorage();
  const logs = getLocal<ActivityLog[]>(STORAGE_KEYS.LOGS, INITIAL_DEMO_LOGS);
  setLocal(STORAGE_KEYS.LOGS, [newLog, ...logs]);
}

export async function getActivityLogs(userId?: string): Promise<ActivityLog[]> {
  initDemoStorage();
  const rawLogs = getLocal<ActivityLog[]>(STORAGE_KEYS.LOGS, INITIAL_DEMO_LOGS);

  // Strictly filter out website details, user profile changes, and admin account management
  const farmLogs = (rawLogs || []).filter((l) => {
    if (!l) return false;
    if (l.entityType === 'user') return false;
    const desc = (l.description || '').toLowerCase();
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

  // Purge any stored unwanted website logs from localStorage permanently
  if (farmLogs.length !== rawLogs.length) {
    setLocal(STORAGE_KEYS.LOGS, farmLogs);
  }

  if (!userId) return farmLogs;

  const userLogs = farmLogs.filter((l) => l.userId === userId);
  if (userLogs.length > 0) {
    return userLogs;
  }

  // Provide initial farm activities for preview/demo
  return farmLogs;
}

// ----------------------------------------------------
// CROP CYCLES
// ----------------------------------------------------
export async function getCropCycles(userId: string): Promise<CropCycle[]> {
  try {
    const res = await fetch(`/api/crop-cycles?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('API getCropCycles error, falling back to local storage:', err);
  }

  initDemoStorage();
  const crops = getLocal<CropCycle[]>(STORAGE_KEYS.CROPS, []);
  return crops.filter((c) => c.userId === userId);
}

export async function saveCropCycle(
  crop: Omit<CropCycle, 'cropCycleId' | 'createdAt' | 'updatedAt'> & { cropCycleId?: string }
): Promise<CropCycle> {
  const isNew = !crop.cropCycleId;
  const id = crop.cropCycleId || generateId('crop');
  const now = new Date().toISOString();

  const fullCrop: CropCycle = {
    ...crop,
    cropCycleId: id,
    createdAt: (crop as any).createdAt || now,
    updatedAt: now,
  };

  try {
    const res = await fetch('/api/crop-cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullCrop),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        Object.assign(fullCrop, json.data);
      }
    }
  } catch (err) {
    console.warn('API saveCropCycle error:', err);
  }

  initDemoStorage();
  const crops = getLocal<CropCycle[]>(STORAGE_KEYS.CROPS, []);
  const existingIdx = crops.findIndex((c) => c.cropCycleId === id);
  if (existingIdx >= 0) {
    crops[existingIdx] = fullCrop;
  } else {
    crops.unshift(fullCrop);
  }
  setLocal(STORAGE_KEYS.CROPS, crops);

  await logActivity(
    fullCrop.userId,
    isNew ? 'created' : 'updated',
    'cropCycle',
    id,
    `${isNew ? 'Created' : 'Updated'} crop cycle: ${fullCrop.cropType} (${fullCrop.status})`
  );

  return fullCrop;
}

export async function deleteCropCycle(cropCycleId: string, userId: string): Promise<void> {
  try {
    await fetch(`/api/crop-cycles/${encodeURIComponent(cropCycleId)}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('API deleteCropCycle error:', err);
  }

  initDemoStorage();
  const crops = getLocal<CropCycle[]>(STORAGE_KEYS.CROPS, []);
  const filtered = crops.filter((c) => c.cropCycleId !== cropCycleId);
  setLocal(STORAGE_KEYS.CROPS, filtered);

  await logActivity(userId, 'deleted', 'cropCycle', cropCycleId, `Deleted crop cycle #${cropCycleId}`);
}

// ----------------------------------------------------
// EXPENSES
// ----------------------------------------------------
export async function getExpenses(userId: string): Promise<ExpenseRecord[]> {
  try {
    const res = await fetch(`/api/expenses?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('API getExpenses error:', err);
  }

  initDemoStorage();
  const expenses = getLocal<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, []);
  return expenses.filter((e) => e.userId === userId);
}

export async function saveExpense(
  expense: Omit<ExpenseRecord, 'expenseId' | 'createdAt' | 'updatedAt'> & { expenseId?: string }
): Promise<ExpenseRecord> {
  const isNew = !expense.expenseId;
  const id = expense.expenseId || generateId('exp');
  const now = new Date().toISOString();

  const fullExpense: ExpenseRecord = {
    ...expense,
    expenseId: id,
    amount: Number(expense.amount),
    createdAt: (expense as any).createdAt || now,
    updatedAt: now,
  };

  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullExpense),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        Object.assign(fullExpense, json.data);
      }
    }
  } catch (err) {
    console.warn('API saveExpense error:', err);
  }

  initDemoStorage();
  const list = getLocal<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, []);
  const existingIdx = list.findIndex((e) => e.expenseId === id);
  if (existingIdx >= 0) {
    list[existingIdx] = fullExpense;
  } else {
    list.unshift(fullExpense);
  }
  setLocal(STORAGE_KEYS.EXPENSES, list);

  await logActivity(
    fullExpense.userId,
    isNew ? 'created' : 'updated',
    'expense',
    id,
    `${isNew ? 'Added' : 'Updated'} expense: ${fullExpense.type} (₹${fullExpense.amount})`
  );

  return fullExpense;
}

export async function deleteExpense(expenseId: string, userId: string): Promise<void> {
  try {
    await fetch(`/api/expenses/${encodeURIComponent(expenseId)}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('API deleteExpense error:', err);
  }

  initDemoStorage();
  const list = getLocal<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, []);
  setLocal(
    STORAGE_KEYS.EXPENSES,
    list.filter((e) => e.expenseId !== expenseId)
  );

  await logActivity(userId, 'deleted', 'expense', expenseId, `Deleted expense record #${expenseId}`);
}

// ----------------------------------------------------
// INCOME
// ----------------------------------------------------
export async function getIncome(userId: string): Promise<IncomeRecord[]> {
  try {
    const res = await fetch(`/api/income?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('API getIncome error:', err);
  }

  initDemoStorage();
  const incomeList = getLocal<IncomeRecord[]>(STORAGE_KEYS.INCOME, []);
  return incomeList.filter((i) => i.userId === userId);
}

export async function saveIncome(
  income: Omit<IncomeRecord, 'incomeId' | 'totalAmount' | 'createdAt' | 'updatedAt'> & {
    incomeId?: string;
  }
): Promise<IncomeRecord> {
  const isNew = !income.incomeId;
  const id = income.incomeId || generateId('inc');
  const now = new Date().toISOString();
  const qty = Number(income.quantity);
  const price = Number(income.unitPrice);
  const totalAmount = Math.round(qty * price * 100) / 100;

  const fullIncome: IncomeRecord = {
    ...income,
    incomeId: id,
    quantity: qty,
    unitPrice: price,
    totalAmount,
    createdAt: (income as any).createdAt || now,
    updatedAt: now,
  };

  try {
    const res = await fetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullIncome),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        Object.assign(fullIncome, json.data);
      }
    }
  } catch (err) {
    console.warn('API saveIncome error:', err);
  }

  initDemoStorage();
  const list = getLocal<IncomeRecord[]>(STORAGE_KEYS.INCOME, []);
  const existingIdx = list.findIndex((i) => i.incomeId === id);
  if (existingIdx >= 0) {
    list[existingIdx] = fullIncome;
  } else {
    list.unshift(fullIncome);
  }
  setLocal(STORAGE_KEYS.INCOME, list);

  await logActivity(
    fullIncome.userId,
    isNew ? 'created' : 'updated',
    'income',
    id,
    `${isNew ? 'Recorded' : 'Updated'} income: ${fullIncome.cropType} (₹${fullIncome.totalAmount})`
  );

  return fullIncome;
}

export async function deleteIncome(incomeId: string, userId: string): Promise<void> {
  try {
    await fetch(`/api/income/${encodeURIComponent(incomeId)}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('API deleteIncome error:', err);
  }

  initDemoStorage();
  const list = getLocal<IncomeRecord[]>(STORAGE_KEYS.INCOME, []);
  setLocal(
    STORAGE_KEYS.INCOME,
    list.filter((i) => i.incomeId !== incomeId)
  );

  await logActivity(userId, 'deleted', 'income', incomeId, `Deleted income record #${incomeId}`);
}

// ----------------------------------------------------
// FINANCIAL SUMMARIES & PROFIT CALCULATIONS
// ----------------------------------------------------
export async function getFinancialMetrics(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  summary: FinancialSummary;
  cropProfits: CropProfitSummary[];
  recentExpenses: ExpenseRecord[];
  recentIncome: IncomeRecord[];
  activeCrops: CropCycle[];
  upcomingHarvests: CropCycle[];
}> {
  const [allCrops, allExpenses, allIncome] = await Promise.all([
    getCropCycles(userId),
    getExpenses(userId),
    getIncome(userId),
  ]);

  const filteredExpenses = allExpenses.filter((e) => {
    if (!e.expenseDate) return true;
    if (startDate && e.expenseDate < startDate) return false;
    if (endDate && e.expenseDate > endDate) return false;
    return true;
  });

  const filteredIncome = allIncome.filter((i) => {
    if (!i.saleDate) return true;
    if (startDate && i.saleDate < startDate) return false;
    if (endDate && i.saleDate > endDate) return false;
    return true;
  });

  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalIncome = filteredIncome.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  const activeCrops = allCrops.filter(
    (c) => c.status === 'Growing' || c.status === 'Ready to Harvest'
  );
  const completedCrops = allCrops.filter((c) => c.status === 'Harvested');

  const upcomingHarvests = allCrops
    .filter((c) => c.status !== 'Harvested')
    .sort((a, b) => (a.expectedHarvestDate || '').localeCompare(b.expectedHarvestDate || ''));

  const cropProfits: CropProfitSummary[] = allCrops.map((crop) => {
    const cropExpenses = filteredExpenses.filter((e) => e.cropCycleId === crop.cropCycleId);
    const cropIncomeList = filteredIncome.filter((i) => i.cropCycleId === crop.cropCycleId);

    const cExp = cropExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const cInc = cropIncomeList.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const cProfit = cInc - cExp;
    const margin = cInc > 0 ? Math.round((cProfit / cInc) * 100) : cExp > 0 ? -100 : 0;

    return {
      cropCycleId: crop.cropCycleId,
      cropName: crop.cropType,
      farmName: crop.farmName,
      status: crop.status,
      seedingDate: crop.seedingDate,
      totalIncome: cInc,
      totalExpenses: cExp,
      netProfit: cProfit,
      profitMargin: margin,
      expenseCount: cropExpenses.length,
      incomeCount: cropIncomeList.length,
    };
  });

  cropProfits.sort((a, b) => b.netProfit - a.netProfit);

  const recentExpenses = [...filteredExpenses]
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
    .slice(0, 5);

  const recentIncome = [...filteredIncome]
    .sort((a, b) => b.saleDate.localeCompare(a.saleDate))
    .slice(0, 5);

  return {
    summary: {
      totalIncome,
      totalExpenses,
      netProfit,
      activeCropCount: activeCrops.length,
      completedCropCount: completedCrops.length,
      upcomingHarvestCount: upcomingHarvests.length,
    },
    cropProfits,
    recentExpenses,
    recentIncome,
    activeCrops,
    upcomingHarvests,
  };
}

// ----------------------------------------------------
// ADMIN OPERATIONS
// ----------------------------------------------------
export async function getAdminUsersList(): Promise<UserProfile[]> {
  try {
    const res = await fetch(`/api/admin/users?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        initDemoStorage();
        setLocal(STORAGE_KEYS.USERS, json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('API getAdminUsersList error:', err);
  }

  initDemoStorage();
  return getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
}

export async function updateUserAccountStatus(
  uid: string,
  newStatus: AccountStatus,
  adminUid: string
): Promise<void> {
  try {
    await fetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountStatus: newStatus, adminUid }),
    });
  } catch (err) {
    console.warn('API updateUserAccountStatus error:', err);
  }

  initDemoStorage();
  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
  const updated = users.map((u) =>
    u.uid === uid || (u.email && u.email.toLowerCase() === uid.toLowerCase())
      ? { ...u, accountStatus: newStatus, updatedAt: new Date().toISOString() }
      : u
  );
  setLocal(STORAGE_KEYS.USERS, updated);
}

export async function deleteUserAccount(uid: string): Promise<void> {
  try {
    await fetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('API deleteUserAccount error:', err);
  }

  initDemoStorage();
  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
  const updated = users.filter(
    (u) => u.uid !== uid && (u.email ? u.email.toLowerCase() !== uid.toLowerCase() : true)
  );
  setLocal(STORAGE_KEYS.USERS, updated);
}

export async function getPlatformStatistics(userList?: UserProfile[]): Promise<{
  totalUsers: number;
  totalActiveFarmers: number;
  totalCropsTracked: number;
  totalRevenueVolume: number;
  totalExpenseVolume: number;
  totalTransactions: number;
}> {
  initDemoStorage();
  const users = userList || getLocal<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_DEMO_USERS);
  const crops = getLocal<CropCycle[]>(STORAGE_KEYS.CROPS, INITIAL_DEMO_CROPS);
  const expenses = getLocal<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, INITIAL_DEMO_EXPENSES);
  const income = getLocal<IncomeRecord[]>(STORAGE_KEYS.INCOME, INITIAL_DEMO_INCOME);

  const totalExpenseVolume = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalRevenueVolume = income.reduce((s, i) => s + (i.totalAmount || 0), 0);

  return {
    totalUsers: users.length,
    totalActiveFarmers: users.filter((u) => u.accountStatus === 'active' && u.role === 'farmer')
      .length,
    totalCropsTracked: crops.length,
    totalRevenueVolume,
    totalExpenseVolume,
    totalTransactions: expenses.length + income.length,
  };
}
