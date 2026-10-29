import { UserProfile, AccountStatus } from '@/types';
import { INITIAL_DEMO_USERS } from '@/lib/mockData';

export interface StoredUser extends UserProfile {
  passwordHash?: string;
}

const PRIMARY_ADMIN_EMAIL = 'krishnaprasath720@gmail.com';
const PRIMARY_ADMIN_PASSWORD_HASH = '$2b$10$LqPnrPd7dON2hM72FIfTJu4MUP71Fgaht3Ue4WXi/vcLnxPtp9saW';
const NITHESH_EMAIL = 'nitheshmurugesan28@gmail.com';
const NITHESH_PASSWORD_HASH = '$2b$10$LF7UzRI6OlMsu0HUQpGXvOBTM4Um74m6oGPzx7ttxTgzM9LsEI3QO';
const DEMO_PASSWORD_HASH = '$2a$10$w09Zl/GgP7bK5hDq4yTveO8B8Ufq8r0JbXbYvJ5Y6a7h.ZfS3i96K';

function createInitialUsers(): StoredUser[] {
  return INITIAL_DEMO_USERS.map((user) => {
    const email = user.email.toLowerCase().trim();
    let passwordHash = DEMO_PASSWORD_HASH;
    if (email === PRIMARY_ADMIN_EMAIL) {
      passwordHash = PRIMARY_ADMIN_PASSWORD_HASH;
    } else if (email === NITHESH_EMAIL) {
      passwordHash = NITHESH_PASSWORD_HASH;
    }
    return {
      ...user,
      passwordHash,
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
    (u) => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase()
  );

  if (existingIdx >= 0) {
    memoryUsers[existingIdx] = { ...memoryUsers[existingIdx], ...user };
  } else {
    memoryUsers.unshift(user);
  }
}

export function updateStoredUser(uid: string, updates: Partial<StoredUser>): StoredUser | null {
  const index = memoryUsers.findIndex(
    (u) => u.uid === uid || u.email.toLowerCase() === uid.toLowerCase()
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
    (u) => u.uid === uid || u.email.toLowerCase() === uid.toLowerCase()
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
  return memoryUsers.find((u) => u.email.toLowerCase().trim() === normalized) || null;
}

export function deleteStoredUser(uid: string): boolean {
  const initialLength = memoryUsers.length;
  memoryUsers = memoryUsers.filter(
    (u) => u.uid !== uid && u.email.toLowerCase() !== uid.toLowerCase()
  );
  return memoryUsers.length !== initialLength;
}
