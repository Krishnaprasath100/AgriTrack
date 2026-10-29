export type UserRole = 'farmer' | 'admin';

export type AccountStatus = 'active' | 'deactivated';

export interface UserProfile {
  uid: string;
  fullName: string;
  email?: string;
  password?: string;
  role: UserRole;
  farmName?: string;
  location?: string;
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  accountStatus: AccountStatus;
}

export type CropStatus = 'Planned' | 'Growing' | 'Ready to Harvest' | 'Harvested';

export type LandAreaUnit = 'Acres' | 'Hectares' | 'Bigha' | 'Guntha';

export interface CropCycle {
  cropCycleId: string;
  userId: string;
  cropType: string;
  farmName?: string;
  landArea?: number;
  landAreaUnit?: LandAreaUnit;
  seedingDate: string; // ISO date string YYYY-MM-DD
  expectedHarvestDate: string; // ISO date string YYYY-MM-DD
  actualHarvestDate?: string;
  status: CropStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | 'Seeds'
  | 'Fertilizers'
  | 'Pesticides'
  | 'Labour'
  | 'Irrigation'
  | 'Equipment'
  | 'Machinery rental'
  | 'Transportation'
  | 'Electricity'
  | 'Land preparation'
  | 'Other';

export interface ExpenseRecord {
  expenseId: string;
  userId: string;
  cropCycleId?: string;
  cropName?: string;
  type: string;
  payee?: string;
  amount: number; // in INR
  paidFromAccount?: string;
  description: string;
  notes?: string;
  duration?: string;
  labourCount?: number;
  expenseDate: string; // YYYY-MM-DD
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type QuantityUnit = 'kg' | 'quintal' | 'tonne' | 'bags' | 'crates';

export interface IncomeRecord {
  incomeId: string;
  userId: string;
  cropCycleId?: string;
  cropType: string;
  quantity: number;
  quantityUnit: QuantityUnit;
  unitPrice: number; // in INR per unit
  totalAmount: number; // quantity * unitPrice
  saleDate: string; // YYYY-MM-DD
  buyerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActionType = 'created' | 'updated' | 'deleted' | 'status_change';
export type EntityType = 'cropCycle' | 'expense' | 'income' | 'user';

export interface ActivityLog {
  logId: string;
  userId: string;
  userEmail?: string;
  actionType: ActionType;
  entityType: EntityType;
  entityId: string;
  description: string;
  timestamp: string;
}

export interface CropProfitSummary {
  cropCycleId: string;
  cropName: string;
  farmName?: string;
  status: CropStatus;
  seedingDate: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number; // percentage
  expenseCount: number;
  incomeCount: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  activeCropCount: number;
  completedCropCount: number;
  upcomingHarvestCount: number;
}

export interface LedgerContact {
  id: string;
  userId: string;
  name: string;
  kind: 'person' | 'payee';
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface LedgerAccount {
  id: string;
  userId: string;
  displayName: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  branch?: string;
  accountType: 'Savings' | 'Current' | 'Cash';
  isDefault: boolean;
  createdAt: string;
}

export interface ExpenseTypeOption {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}
