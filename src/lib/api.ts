/**
 * API client for TalentOS frontend.
 *
 * - When VITE_MOCK=true, returns mock data without hitting any server.
 * - Otherwise sends credentials (cookies) automatically.
 * - On 401, attempts refresh (queues concurrent requests).
 * - If refresh fails, redirects to /login.
 */

import { matchMockRoute } from './mock-data';

const MOCK_ENABLED =
  (import.meta as any).env?.VITE_MOCK === 'true' ||
  (import.meta as any).env?.VITE_MOCK === true ||
  !(import.meta as any).env?.VITE_API_URL; // Auto-enable mock when no API URL is configured

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api/v1';

let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];

function subscribeTokenRefresh(cb: () => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

function forceLogout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

async function refreshTokens(): Promise<boolean> {
  try {
    const refreshToken = typeof window !== 'undefined'
      ? localStorage.getItem('refreshToken')
      : null;

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // ─── Mock mode ─────────────────────────────────────────────
  if (MOCK_ENABLED) {
    // Simulate network delay for realism
    await new Promise((r) => setTimeout(r, Math.random() * 200 + 50));

    // Extract body for POST/PUT/PATCH
    let body: any;
    if (options.body && typeof options.body === 'string') {
      try { body = JSON.parse(options.body); } catch { /* ignore */ }
    }

    const result = matchMockRoute(path, body);
    if (result !== undefined) {
      return result as T;
    }
    // If no mock route matched, return empty object/array as fallback
    console.warn(`[Mock] No handler for: ${path}`);
    return {} as T;
  }

  // ─── Real API mode ─────────────────────────────────────────
  const url = `${API_URL}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add Bearer token from localStorage (fallback for non-cookie mode)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle 401: only try refresh + redirect when we had a token (session expired)
  if (res.status === 401 && !path.includes('/auth/refresh') && !path.includes('/auth/login')) {
    const hadToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
    if (!hadToken) {
      throw new Error('Não autenticado');
    }
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh(async () => {
          try {
            const retryResult = await apiFetch<T>(path, options);
            resolve(retryResult);
          } catch (err) {
            reject(err);
          }
        });
      });
    }
    isRefreshing = true;
    const refreshed = await refreshTokens();
    isRefreshing = false;
    if (refreshed) {
      onTokenRefreshed();
      return apiFetch<T>(path, options);
    }
    forceLogout();
    throw new Error('Sessão expirada');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Convenience methods ─────────────────────────────────────

export const api = {
  get: <T = any>(path: string) => apiFetch<T>(path),

  post: <T = any>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),
};

export default api;
