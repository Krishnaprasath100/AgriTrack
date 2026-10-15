'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, UserRole } from '@/types';
import { initDemoStorage } from '@/lib/services/dataService';

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
    farmName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: (redirectTo?: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
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
      setLoading(false);
      return {
        success: false,
        error: 'Unable to reach the authentication service. Please try again shortly.',
      };
    }
  };

  const register = async (
    fullName: string,
    email: string,
    pass: string,
    role: UserRole = 'farmer',
    farmName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password: pass, farmName, role }),
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
    } catch (err: any) {
      // Fallback local registration
      const newLocalProfile: UserProfile = {
        uid: `farmer_${Date.now()}`,
        fullName,
        email,
        role,
        farmName: farmName || 'Green Field Farm',
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(newLocalProfile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newLocalProfile));
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

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setUser(updatedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
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
