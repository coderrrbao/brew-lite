import type { UserRole } from '../../generated/prisma/client';

export class UserDto {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserPointsDto {
  loyaltyPoints: number;
}
