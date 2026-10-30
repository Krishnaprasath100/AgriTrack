import { UserProfile, CropCycle, ExpenseRecord, IncomeRecord, ActivityLog } from '@/types';

export const INITIAL_DEMO_USERS: UserProfile[] = [
  {
    uid: 'admin_krishna',
    fullName: 'Krishna Prasath',
    email: 'krishnaprasath720@gmail.com',
    role: 'admin',
    farmName: 'AgriTrack Central Command',
    location: 'Tamil Nadu, India',
    phone: '+917418665001',
    accountStatus: 'active',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-01-01T08:00:00.000Z',
  },
];

export const INITIAL_DEMO_CROPS: CropCycle[] = [];

export const INITIAL_DEMO_EXPENSES: ExpenseRecord[] = [];

export const INITIAL_DEMO_INCOME: IncomeRecord[] = [];

export const INITIAL_DEMO_LOGS: ActivityLog[] = [];
