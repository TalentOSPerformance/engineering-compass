import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';
import type { AuthUser } from '@/types/shared-types';

const MOCK_ENABLED =
  (import.meta as any).env?.VITE_MOCK === 'true' ||
  (import.meta as any).env?.VITE_MOCK === true ||
  !(import.meta as any).env?.VITE_API_URL;

const MOCK_USER: AuthUser = {
  id: 'user-mock-001',
  username: 'admin',
  role: 'admin',
  organizationId: 'mock-org-001',
  personId: 'person-1',
};

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
  const [user, setUser] = useState<AuthUser | null>(MOCK_ENABLED ? MOCK_USER : null);
  const [loading, setLoading] = useState(!MOCK_ENABLED);
  const [defaultOrgId, setDefaultOrgId] = useState<string | null>(MOCK_ENABLED ? 'mock-org-001' : null);
  /** Only true after mount; keeps server and first client render identical (no localStorage/org resolution) */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshUser = useCallback(async () => {
    if (MOCK_ENABLED) {
      setUser(MOCK_USER);
      return;
    }
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
    if (MOCK_ENABLED) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  // When not logged in, resolve default organization so dashboard/integrations etc. work
  useEffect(() => {
    if (MOCK_ENABLED) return;
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

  const effectiveOrganizationId = MOCK_ENABLED
    ? 'mock-org-001'
    : mounted
      ? (user?.organizationId ??
         (typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null) ??
         defaultOrgId)
      : null;

  const login = async (username: string, password: string) => {
    if (MOCK_ENABLED) {
      setUser(MOCK_USER);
      return;
    }
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
    if (MOCK_ENABLED) {
      setUser(null);
      return;
    }
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
