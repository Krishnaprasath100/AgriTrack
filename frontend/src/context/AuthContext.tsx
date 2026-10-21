'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, UserRole } from '@/types';
import { initDemoStorage } from '@/lib/services/dataService';
import { INITIAL_DEMO_USERS } from '@/lib/mockData';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  loading: boolean;
  isPostgresActive: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    fullName: string,
    email: string,
    pass: string,
    role?: UserRole,
    farmName?: string,
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: (redirectTo?: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'agritrack_active_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPostgresActive, setIsPostgresActive] = useState(true);

  useEffect(() => {
    initDemoStorage();
    restoreLocalSession();
    setLoading(false);
  }, []);

  const restoreLocalSession = () => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
        }
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, error: data.error || 'Authentication failed' };
      }
    } catch {
      // Graceful fallback for offline / preview Vercel deployments when backend is not configured
      const normalized = email.toLowerCase().trim();
      const demoUser = INITIAL_DEMO_USERS.find(
        (u) =>
          u.email.toLowerCase() === normalized ||
          (normalized === 'admin' && u.role === 'admin') ||
          (normalized === 'farmer' && u.role === 'farmer')
      );
      if (demoUser && demoUser.accountStatus !== 'deactivated') {
        setUser(demoUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
        }
        setLoading(false);
        return { success: true };
      }
      setLoading(false);
      return {
        success: false,
        error: 'Unable to reach backend service. Please check your network or credentials.',
      };
    }
  };

  const register = async (
    fullName: string,
    email: string,
    pass: string,
    role: UserRole = 'farmer',
    farmName?: string,
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password: pass, farmName, role, phone }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
        }
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch {
      // Graceful fallback registration for offline / preview environments
      const now = new Date().toISOString();
      const fallbackUser: UserProfile = {
        uid: 'usr_' + Date.now(),
        fullName,
        email: email.toLowerCase().trim(),
        role,
        farmName: farmName || 'My Farm',
        phone,
        accountStatus: 'active',
        createdAt: now,
        updatedAt: now,
      };
      setUser(fallbackUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallbackUser));
      }
      setLoading(false);
      return { success: true };
    }
  };

  const logout = async (redirectTo: string = '/login'): Promise<void> => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (redirectTo) {
        window.location.replace(redirectTo);
      }
    }
  };

  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No active user session' };

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          fullName: updates.fullName !== undefined ? updates.fullName : user.fullName,
          email: updates.email !== undefined ? updates.email : user.email,
          phone: updates.phone !== undefined ? updates.phone : user.phone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to update profile' };
      }
    } catch {
      // Fallback local update
      const updatedUser: UserProfile = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      }
      return { success: true };
    }
  };

  const resetPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No active user session' };

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to reset password' };
      }
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'farmer',
        loading,
        isPostgresActive,
        login,
        register,
        logout,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
