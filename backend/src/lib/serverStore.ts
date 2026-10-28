import fs from 'fs';
import path from 'path';
import { UserProfile, AccountStatus } from '../types';
import { INITIAL_DEMO_USERS } from './mockData';

const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

export interface StoredUser extends UserProfile {
  passwordHash?: string;
}

// In-memory cache as fallback for serverless/edge environments
let memoryUsers: StoredUser[] | null = null;

const PRIMARY_ADMIN_EMAIL = 'krishnaprasath720@gmail.com';
const PRIMARY_ADMIN_PASSWORD_HASH = '$2b$10$LqPnrPd7dON2hM72FIfTJu4MUP71Fgaht3Ue4WXi/vcLnxPtp9saW';
const DEMO_PASSWORD_HASH = '$2a$10$w09Zl/GgP7bK5hDq4yTveO8B8Ufq8r0JbXbYvJ5Y6a7h.ZfS3i96K';

function createInitialUsers(): StoredUser[] {
  return INITIAL_DEMO_USERS.map((user) => ({
    ...user,
    passwordHash:
      user.email.toLowerCase() === PRIMARY_ADMIN_EMAIL
        ? PRIMARY_ADMIN_PASSWORD_HASH
        : DEMO_PASSWORD_HASH,
  }));
}

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      // Initialize with INITIAL_DEMO_USERS
      const initialUsers = createInitialUsers();
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialUsers, null, 2), 'utf8');
      memoryUsers = initialUsers;
    }
  } catch (err) {
    console.warn('Unable to write to disk, using in-memory store:', err);
    if (!memoryUsers) {
      memoryUsers = createInitialUsers();
    }
  }
}

export function getAllStoredUsers(): StoredUser[] {
  ensureDataFile();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryUsers = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading users file:', err);
  }

  if (!memoryUsers || memoryUsers.length === 0) {
    memoryUsers = createInitialUsers();
  }

  return memoryUsers;
}

export function saveAllStoredUsers(users: StoredUser[]): void {
  memoryUsers = users;
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.warn('Error saving users file:', err);
  }
}

export function addStoredUser(user: StoredUser): void {
  const users = getAllStoredUsers();
  // Check if user already exists
  const existingIdx = users.findIndex(
    (u) => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase()
  );

  if (existingIdx >= 0) {
    users[existingIdx] = { ...users[existingIdx], ...user };
  } else {
    users.unshift(user);
  }

  saveAllStoredUsers(users);
}

export function updateStoredUser(uid: string, updates: Partial<StoredUser>): StoredUser | null {
  const users = getAllStoredUsers();
  const index = users.findIndex(
    (u) => u.uid === uid || u.email.toLowerCase() === uid.toLowerCase()
  );

  if (index >= 0) {
    users[index] = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveAllStoredUsers(users);
    return users[index];
  }

  return null;
}

export function updateStoredUserStatus(uid: string, status: AccountStatus): boolean {
  const users = getAllStoredUsers();
  const index = users.findIndex(
    (u) => u.uid === uid || u.email.toLowerCase() === uid.toLowerCase()
  );

  if (index >= 0) {
    users[index] = {
      ...users[index],
      accountStatus: status,
      updatedAt: new Date().toISOString(),
    };
    saveAllStoredUsers(users);
    return true;
  }

  return false;
}

export function findStoredUserByEmail(email: string): StoredUser | null {
  const users = getAllStoredUsers();
  const normalized = email.toLowerCase().trim();
  return users.find((u) => u.email.toLowerCase().trim() === normalized) || null;
}

export function deleteStoredUser(uid: string): boolean {
  const users = getAllStoredUsers();
  const filtered = users.filter(
    (u) => u.uid !== uid && u.email.toLowerCase() !== uid.toLowerCase()
  );
  if (filtered.length !== users.length) {
    saveAllStoredUsers(filtered);
    return true;
  }
  return false;
}
