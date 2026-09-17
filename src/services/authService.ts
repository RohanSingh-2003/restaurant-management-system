import type { LoginCredentials, User, Role } from '../types';

interface SystemAccount {
  user: User;
  password: string;
}

const INITIAL_ACCOUNTS: SystemAccount[] = [
  {
    password: 'manager123',
    user: {
      id: 'usr_001',
      name: 'Manager',
      email: 'manager@restaurant.com',
      role: 'manager',
      status: 'Active',
      phone: '+44 7911 111222',
      joinedAt: '2024-01-15',
    },
  },
  {
    password: 'waiter123',
    user: {
      id: 'usr_002',
      name: 'Alex Morgan',
      email: 'waiter@restaurant.com',
      role: 'waiter',
      status: 'Active',
      phone: '+44 7911 333444',
      joinedAt: '2024-03-01',
    },
  },
  {
    password: 'cook123',
    user: {
      id: 'usr_003',
      name: 'Chef Gordon',
      email: 'cook@restaurant.com',
      role: 'cook',
      status: 'Active',
      phone: '+44 7911 555666',
      joinedAt: '2024-02-20',
    },
  },
  {
    password: 'customer123',
    user: {
      id: 'usr_004',
      name: 'John Doe',
      email: 'customer@restaurant.com',
      role: 'customer',
      status: 'Active',
      phone: '+44 7911 777888',
      joinedAt: '2024-05-10',
    },
  },
  {
    password: 'admin123',
    user: {
      id: 'usr_005',
      name: 'System Administrator',
      email: 'admin@restaurant.com',
      role: 'admin',
      status: 'Active',
      phone: '+44 7911 999000',
      joinedAt: '2023-11-01',
    },
  },
];

const AUTH_STORAGE_KEY = 'rms_auth_user';
const USERS_STORAGE_KEY = 'rms_system_accounts';
const USERS_EVENT = 'rms_users_update';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStoredAccounts(): SystemAccount[] {
  if (typeof window === 'undefined') return INITIAL_ACCOUNTS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_ACCOUNTS));
      return INITIAL_ACCOUNTS;
    }
    return JSON.parse(raw) as SystemAccount[];
  } catch {
    return INITIAL_ACCOUNTS;
  }
}

function saveAccounts(accounts: SystemAccount[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(accounts));
    window.dispatchEvent(new CustomEvent(USERS_EVENT));
  }
}

export async function login(credentials: LoginCredentials): Promise<User> {
  await delay(600);

  const accounts = getStoredAccounts();
  const inputEmail = credentials.email.trim().toLowerCase();
  const entry = accounts.find(
    (acc) => acc.user.email.toLowerCase() === inputEmail
  );

  if (!entry) {
    throw new Error('Invalid email or password.');
  }
  if (entry.password !== credentials.password) {
    throw new Error('Invalid email or password.');
  }
  if (entry.user.status === 'Inactive') {
    throw new Error('This account has been deactivated. Please contact an administrator.');
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(entry.user));
  return entry.user;
}

export async function logout(): Promise<void> {
  await delay(300);
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

// -------------------------------------------------------------
// USER / STAFF MANAGEMENT (ADMIN)
// -------------------------------------------------------------

export function getStoredUsers(): User[] {
  return getStoredAccounts().map((acc) => acc.user);
}

export function addStaffUser(data: {
  name: string;
  email: string;
  role: Role;
  phone?: string;
  password?: string;
}): User {
  const accounts = getStoredAccounts();
  const emailNorm = data.email.trim().toLowerCase();

  if (accounts.some((a) => a.user.email.toLowerCase() === emailNorm)) {
    throw new Error(`A user with email "${data.email}" already exists.`);
  }

  const nextId = `usr_${(accounts.length + 1).toString().padStart(3, '0')}`;
  const now = new Date().toISOString().split('T')[0];

  const newUser: User = {
    id: nextId,
    name: data.name.trim(),
    email: emailNorm,
    role: data.role,
    status: 'Active',
    phone: data.phone?.trim() || undefined,
    joinedAt: now,
  };

  const newAccount: SystemAccount = {
    user: newUser,
    password: data.password || 'password123',
  };

  accounts.push(newAccount);
  saveAccounts(accounts);
  return newUser;
}

export function updateUser(id: string, updates: Partial<User>): User {
  const accounts = getStoredAccounts();
  const idx = accounts.findIndex((a) => a.user.id === id);
  if (idx === -1) throw new Error(`User ${id} not found.`);

  const updatedUser: User = {
    ...accounts[idx].user,
    ...updates,
  };

  accounts[idx].user = updatedUser;
  saveAccounts(accounts);

  // If the updated user is currently logged in, update auth storage
  const currentUser = getStoredUser();
  if (currentUser && currentUser.id === id) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
  }

  return updatedUser;
}

export function toggleUserStatus(id: string): User {
  const accounts = getStoredAccounts();
  const idx = accounts.findIndex((a) => a.user.id === id);
  if (idx === -1) throw new Error(`User ${id} not found.`);

  // Protect system administrator
  if (accounts[idx].user.email === 'admin@restaurant.com') {
    throw new Error('The primary system administrator account cannot be deactivated.');
  }

  const curStatus = accounts[idx].user.status || 'Active';
  const newStatus = curStatus === 'Active' ? 'Inactive' : 'Active';

  accounts[idx].user.status = newStatus;
  saveAccounts(accounts);
  return accounts[idx].user;
}

export function subscribeUserUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(USERS_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(USERS_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
