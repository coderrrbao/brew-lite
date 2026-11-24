import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { LoyaltyTransactionType } from "../generated/prisma/client";
import type { Prisma, User } from "../generated/prisma/client";
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

  async getLoyaltyHistory(userId: string) {
    return this.prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            total: true,
            status: true,
          },
        },
      },
    });
  }

  calculatePoints(amount: number): number {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new BadRequestException("Số tiền phải là số nguyên không âm");
    }
    return Math.floor(amount / VND_PER_POINT);
  }

  /**
   * Tăng điểm thưởng khi hoàn thành đơn hàng (EARN) và ghi log LoyaltyTransaction
   */
  async addLoyaltyPoints(
    id: string,
    points: number,
    orderId?: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    if (!Number.isSafeInteger(points) || points < 0) {
      throw new BadRequestException("Số điểm không hợp lệ");
    }
    if (points === 0) return;

    // 1. Cập nhật cộng điểm người dùng
    await tx.user.update({
      where: { id },
      data: { loyaltyPoints: { increment: points } },
    });

    // 2. Ghi nhật ký biến động điểm (LoyaltyTransaction)
    await tx.loyaltyTransaction.create({
      data: {
        userId: id,
        orderId,
        type: LoyaltyTransactionType.EARN,
        points: points, // Số điểm cộng mang dấu dương
      },
    });
  }

  /**
   * Trừ điểm thưởng khi đổi mã ưu đãi (REDEEM) và ghi log LoyaltyTransaction
   */
  async redeemLoyaltyPoints(
    id: string,
    cost: number,
    promotionCode?: string,
    tx: Prisma.TransactionClient = this.prisma,
    orderId?: string,
  ) {
    if (!Number.isSafeInteger(cost) || cost < 0) {
      throw new BadRequestException("Số điểm không hợp lệ");
    }
    if (cost === 0) return;

    // 1. Trừ điểm người dùng (điều kiện điểm hiện có >= cost)
    const { count } = await tx.user.updateMany({
      where: { id, loyaltyPoints: { gte: cost } },
      data: { loyaltyPoints: { decrement: cost } },
    });

    if (count === 0) {
      throw new BadRequestException("Không đủ điểm");
    }

    // 2. Ghi nhật ký biến động điểm (LoyaltyTransaction)
    await tx.loyaltyTransaction.create({
      data: {
        userId: id,
        orderId,
        promotionCode,
        type: LoyaltyTransactionType.REDEEM,
        points: -cost, // Số điểm trừ mang dấu âm theo quy ước schema
      },
    });
  }
}