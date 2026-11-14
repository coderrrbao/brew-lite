import type { User } from '../store';
import { ApiError, request } from './client';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

type TokenPair = { accessToken: string; refreshToken: string };

export const SESSION_EXPIRED_EVENT = 'brewlite:session-expired';

const ACCESS_TOKEN_KEY = 'brewlite_access_token';
const REFRESH_TOKEN_KEY = 'brewlite_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function saveTokens(tokens: TokenPair) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export async function authenticate(
  mode: 'login' | 'register',
  body: { email: string; password: string; name?: string },
) {
  const result = await request<AuthResult>(`/auth/${mode}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  saveTokens(result);
  return result;
}

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    const tokens = await request<TokenPair>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    saveTokens(tokens);
    return tokens.accessToken;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      return null;
    }
    throw error;
  }
}

function refreshSession() {
  refreshing ??= refreshAccessToken().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Dùng cho mọi API cần đăng nhập: tự refresh khi token hết hạn. */
export async function authorizedRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const withToken = (token: string): RequestInit => ({
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  });

  const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? (await refreshSession());
  if (!token) throw new ApiError(401, 'Chưa đăng nhập');

  try {
    return await request<T>(path, withToken(token));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const fresh = await refreshSession();
      if (fresh) return request<T>(path, withToken(fresh));
    }
    throw error;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  if (
    !localStorage.getItem(ACCESS_TOKEN_KEY) &&
    !localStorage.getItem(REFRESH_TOKEN_KEY)
  ) {
    return null;
  }

  try {
    return await authorizedRequest<User>('/users/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthSession();
      return null;
    }
    throw error;
  }
}

export async function logout() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (refreshToken) {
    try {
      await request<void>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
    
    }
  }
  clearAuthSession();
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}