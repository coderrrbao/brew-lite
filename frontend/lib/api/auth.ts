import type { User } from '../store';
import { request } from './client';

export interface AuthResult {
  accessToken: string;
  user: User;
}

export function authenticate(
  mode: 'login' | 'register',
  body: { email: string; password: string; name?: string },
) {
  return request<AuthResult>(`/auth/${mode}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
