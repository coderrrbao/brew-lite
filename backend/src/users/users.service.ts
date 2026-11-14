import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UserDto, UserPointsDto } from './dto/user.dto';

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  loyaltyPoints: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    email: string;
    name?: string;
    passwordHash: string;
  }): Promise<UserDto> {
    return this.prisma.user.create({
      data,
      select: PUBLIC_USER_SELECT,
    });
  }

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { ...PUBLIC_USER_SELECT, passwordHash: true },
    });
  }

  async findById(id: string): Promise<UserDto | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_USER_SELECT,
    });
  }

  async getLoyaltyPoints(id: string): Promise<UserPointsDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { loyaltyPoints: true },
    });
    if (!user) throw new UnauthorizedException('Tài khoản không tồn tại');

    return user;
  }

  async getProfile(id: string): Promise<UserDto> {
    const user = await this.findById(id);
    if (!user) throw new UnauthorizedException('Tài khoản không tồn tại');
    return user;
  }
}

type UserWithPassword = UserDto & Pick<User, 'passwordHash'>;
