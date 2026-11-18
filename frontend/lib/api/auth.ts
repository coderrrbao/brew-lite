import type { User } from '../store';
import {
  ApiError,
  clearAuthSession,
  getRefreshToken,
  getAccessToken,
  request,
  saveTokens,
} from './client';

export { SESSION_EXPIRED_EVENT, getAccessToken, clearAuthSession } from './client';

export const authorizedRequest = request;

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
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

export async function getCurrentUser(): Promise<User | null> {
  if (!getAccessToken() && !getRefreshToken()) return null;

  try {
    return await request<User>('/users/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthSession();
      return null;
    }
    throw error;
  }
}

export async function logout() {
  const refreshToken = getRefreshToken();
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