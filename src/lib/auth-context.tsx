import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';
import type { AuthUser } from '@/types/shared-types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  /** Organization ID to use: from user, localStorage, or default org when not logged in */
  effectiveOrganizationId: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultOrgId, setDefaultOrgId] = useState<string | null>(null);
  /** Only true after mount; keeps server and first client render identical (no localStorage/org resolution) */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      if (data) {
        const authUser = {
          id: data.id,
          username: data.username,
          role: data.role,
          organizationId: data.organizationId,
          personId: data.personId,
        };
        setUser(authUser);
        if (authUser.organizationId && typeof window !== 'undefined') {
          localStorage.setItem('organizationId', authUser.organizationId);
        }
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  // When not logged in, resolve default organization so dashboard/integrations etc. work
  useEffect(() => {
    if (user?.organizationId) return;
    const stored = typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null;
    if (stored) {
      setDefaultOrgId(stored);
      return;
    }
    api
      .get<{ id: string; name: string; slug: string } | null>('/public/default-organization')
      .then((org) => {
        if (org?.id && typeof window !== 'undefined') {
          localStorage.setItem('organizationId', org.id);
          setDefaultOrgId(org.id);
        }
      })
      .catch(() => {});
  }, [user?.organizationId]);

  const effectiveOrganizationId = mounted
    ? (user?.organizationId ??
       (typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null) ??
       defaultOrgId)
    : null;

  const login = async (username: string, password: string) => {
    const data = await api.post('/auth/login', { username, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      setUser(data.user);
      if (data.user?.organizationId && typeof window !== 'undefined') {
        localStorage.setItem('organizationId', data.user.organizationId);
      }
    } else {
      throw new Error(data.error || 'Erro ao fazer login');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {
        refreshToken: localStorage.getItem('refreshToken'),
      });
    } catch {
      // Ignore — server might reject if already expired
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('organizationId');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, effectiveOrganizationId, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
