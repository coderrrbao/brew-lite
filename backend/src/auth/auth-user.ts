import type { UserRole } from '../generated/prisma/client';

export interface AuthUser {
  sub: string;
  email: string;
  role: UserRole;
}
