import { BadRequestException } from "@nestjs/common";
import { LoyaltyTransactionType } from "../generated/prisma/client";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";

describe("UsersService - Loyalty Transactions", () => {
  let service: UsersService;
  let prismaMock: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    loyaltyTransaction: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      loyaltyTransaction: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new UsersService(prismaMock as unknown as PrismaService);
  });

  describe("addLoyaltyPoints", () => {
    it("tăng điểm và ghi nhật ký giao dịch loại EARN mang dấu dương", async () => {
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.loyaltyTransaction.create.mockResolvedValue({});

      await service.addLoyaltyPoints("u1", 50, "order-123");

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { loyaltyPoints: { increment: 50 } },
      });
      expect(prismaMock.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: "u1",
          orderId: "order-123",
          type: LoyaltyTransactionType.EARN,
          points: 50,
        },
      });
    });

    it("bỏ qua khi points = 0 (không ghi log rác)", async () => {
      await service.addLoyaltyPoints("u1", 0);

      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(prismaMock.loyaltyTransaction.create).not.toHaveBeenCalled();
    });

    it("ném lỗi khi points là số âm hoặc không hợp lệ", async () => {
      await expect(service.addLoyaltyPoints("u1", -10)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("redeemLoyaltyPoints", () => {
    it("trừ điểm an toàn concurrency và ghi nhật ký REDEEM mang dấu âm", async () => {
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.loyaltyTransaction.create.mockResolvedValue({});

      await service.redeemLoyaltyPoints("u1", 80, "VOUCHER80", undefined, "order-1");

      expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
        where: { id: "u1", loyaltyPoints: { gte: 80 } },
        data: { loyaltyPoints: { decrement: 80 } },
      });
      expect(prismaMock.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: "u1",
          orderId: "order-1",
          promotionCode: "VOUCHER80",
          type: LoyaltyTransactionType.REDEEM,
          points: -80,
        },
      });
    });

    it("ném lỗi khi không đủ điểm thưởng", async () => {
      prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.redeemLoyaltyPoints("u1", 100, "VIP100"),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.loyaltyTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe("getLoyaltyHistory", () => {
    it("truy vấn danh sách giao dịch điểm của người dùng theo thời gian mới nhất", async () => {
      const mockHistory = [
        {
          id: "tx-1",
          userId: "u1",
          points: 50,
          type: LoyaltyTransactionType.EARN,
          createdAt: new Date(),
        },
      ];
      prismaMock.loyaltyTransaction.findMany.mockResolvedValue(mockHistory);

      const res = await service.getLoyaltyHistory("u1");

      expect(prismaMock.loyaltyTransaction.findMany).toHaveBeenCalledWith({
        where: { userId: "u1" },
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
      expect(res).toBe(mockHistory);
    });
  });
});
