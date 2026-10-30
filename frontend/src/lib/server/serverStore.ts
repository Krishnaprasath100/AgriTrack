import { UserProfile, AccountStatus } from '@/types';
import { INITIAL_DEMO_USERS } from '@/lib/mockData';

export interface StoredUser extends UserProfile {
  passwordHash?: string;
}

const PRIMARY_ADMIN_EMAIL = 'krishnaprasath720@gmail.com';
const PRIMARY_ADMIN_PASSWORD_HASH = '$2b$10$LqPnrPd7dON2hM72FIfTJu4MUP71Fgaht3Ue4WXi/vcLnxPtp9saW';

function createInitialUsers(): StoredUser[] {
  return INITIAL_DEMO_USERS.map((user) => {
    return {
      ...user,
      passwordHash: PRIMARY_ADMIN_PASSWORD_HASH,
    };
  });
}

let memoryUsers: StoredUser[] = createInitialUsers();

export function getAllStoredUsers(): StoredUser[] {
  return memoryUsers;
}

export function saveAllStoredUsers(users: StoredUser[]): void {
  memoryUsers = users;
}

export function addStoredUser(user: StoredUser): void {
  const existingIdx = memoryUsers.findIndex(
    (u) =>
      u.uid === user.uid ||
      (user.email && u.email && u.email.toLowerCase() === user.email.toLowerCase())
  );

  if (existingIdx >= 0) {
    memoryUsers[existingIdx] = { ...memoryUsers[existingIdx], ...user };
  } else {
    memoryUsers.unshift(user);
  }
}

export function updateStoredUser(uid: string, updates: Partial<StoredUser>): StoredUser | null {
  const index = memoryUsers.findIndex(
    (u) => u.uid === uid || (u.email && u.email.toLowerCase() === uid.toLowerCase())
  );

  if (index >= 0) {
    memoryUsers[index] = {
      ...memoryUsers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return memoryUsers[index];
  }

  return null;
}

export function updateStoredUserStatus(uid: string, status: AccountStatus): boolean {
  const index = memoryUsers.findIndex(
    (u) => u.uid === uid || (u.email && u.email.toLowerCase() === uid.toLowerCase())
  );

  if (index >= 0) {
    memoryUsers[index] = {
      ...memoryUsers[index],
      accountStatus: status,
      updatedAt: new Date().toISOString(),
    };
    return true;
  }

  return false;
}

export function findStoredUserByEmail(email: string): StoredUser | null {
  const normalized = email.toLowerCase().trim();
  return memoryUsers.find((u) => u.email && u.email.toLowerCase().trim() === normalized) || null;
}

export function findStoredUserByIdentifier(identifier: string): StoredUser | null {
  const normalized = identifier.toLowerCase().trim();
  const digits = identifier.replace(/\D/g, '');
  return (
    memoryUsers.find((u) => {
      const email = (u.email || '').toLowerCase().trim();
      const phoneDigits = (u.phone || '').replace(/\D/g, '');
      const name = (u.fullName || '').toLowerCase().trim();
      if (email && email === normalized) return true;
      if (digits && digits.length >= 10 && phoneDigits.includes(digits)) return true;
      if (name && name === normalized) return true;
      if (u.uid.toLowerCase() === normalized) return true;
      return false;
    }) || null
  );
}

export function deleteStoredUser(uid: string): boolean {
  const initialLength = memoryUsers.length;
  memoryUsers = memoryUsers.filter(
    (u) => u.uid !== uid && (u.email || '').toLowerCase() !== uid.toLowerCase()
  );
  return memoryUsers.length !== initialLength;
}
