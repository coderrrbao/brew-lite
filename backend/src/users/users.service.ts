import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import type { User } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  loyaltyPoints: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type PublicUser = Omit<User, "passwordHash">;
export type UserWithPassword = PublicUser & Pick<User, "passwordHash">;

const VND_PER_POINT = 1_000;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(data: {
    email: string;
    name?: string;
    passwordHash: string;
  }): Promise<PublicUser> {
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

  async findById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_USER_SELECT,
    });
  }

  async getLoyaltyPoints(id?: string): Promise<{ loyaltyPoints: number }> {
    if (!id) throw new NotFoundException("Không thấy user");
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { loyaltyPoints: true },
    });
    if (!user) throw new UnauthorizedException("Tài khoản không tồn tại");

    return user;
  }

  calculatePoints(amount: number): number {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new BadRequestException("Số tiền phải là số nguyên không âm");
    }
    return Math.floor(amount / VND_PER_POINT);
  }

  async addLoyaltyPoints(id: string, points: number) {
    if (!Number.isSafeInteger(points) || points < 0) {
      throw new BadRequestException("Số điểm không hợp lệ");
    }
    if (points === 0) return;

    await this.prisma.user.update({
      where: { id },
      data: { loyaltyPoints: { increment: points } },
    });
  }

  async redeemLoyaltyPoints(id: string, cost: number) {
    if (!Number.isSafeInteger(cost) || cost < 0) {
      throw new BadRequestException("Số điểm không hợp lệ");
    }
    if (cost === 0) return;

    const { count } = await this.prisma.user.updateMany({
      where: { id, loyaltyPoints: { gte: cost } },
      data: { loyaltyPoints: { decrement: cost } },
    });

    if (count === 0) {
      throw new BadRequestException("Không đủ điểm");
    }
  }
}
