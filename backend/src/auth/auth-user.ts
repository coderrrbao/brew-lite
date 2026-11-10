import type { UserRole } from '../generated/prisma/client';

export interface AuthUser {
  sub: string;
  email: string;
  role: UserRole;
}

export type AuthenticatedRequest = {
  headers: { authorization?: string };
  user?: AuthUser;
};