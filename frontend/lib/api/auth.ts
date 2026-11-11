import type { User } from '../store';
import { ApiError, request } from './client';

export interface AuthResult {
  accessToken: string;
  user: User;
}

const ACCESS_TOKEN_KEY = 'brewlite_access_token';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function authenticate(
  mode: 'login' | 'register',
  body: { email: string; password: string; name?: string },
) {
  const result = await request<AuthResult>(`/auth/${mode}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
  return result;
}

export async function getCurrentUser(): Promise<User | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    return await request<User>('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthSession();
      return null;
    }
    throw error;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}
