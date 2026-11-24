import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { Order, Promotion } from "../generated/prisma/client";
import { PromotionsService } from "./promotions.service";
import { PrismaService } from "../prisma/prisma.service";

describe("PromotionsService", () => {
  let service: PromotionsService;
  let prismaMock: {
    promotion: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    redeemedVoucher: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    voucherUsage: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    user: {
      updateMany: jest.Mock;
    };
    loyaltyTransaction: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const taoDonHang = (total: number): Order =>
    ({
      id: "test-order",
      userId: "test-user",
      total,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as Order;

  const mockBrew10: Partial<Promotion> = {
    code: "BREW10",
    description: "Giảm 10% tối đa 20k",
    type: "PERCENTAGE",
    value: 10,
    minimumOrderAmount: 50000,
    maximumDiscountAmount: 20000,
    pointCost: 0,
    active: true,
    expiresAt: null,
  };

  const mockCafe5000: Partial<Promotion> = {
    code: "CAFE5000",
    description: "Giảm 5k",
    type: "FIXED_AMOUNT",
    value: 5000,
    minimumOrderAmount: 20000,
    maximumDiscountAmount: null,
    pointCost: 0,
    active: true,
    expiresAt: null,
  };

  const mockVip50k: Partial<Promotion> = {
    code: "VIP50K",
    description: "Đổi 100 điểm giảm 50k",
    type: "FIXED_AMOUNT",
    value: 50000,
    minimumOrderAmount: 100000,
    maximumDiscountAmount: null,
    pointCost: 100,
    active: true,
    expiresAt: null,
  };

  const mockHethan: Partial<Promotion> = {
    code: "HETHAN",
    description: "Mã hết hạn",
    type: "FIXED_AMOUNT",
    value: 10000,
    minimumOrderAmount: 0,
    maximumDiscountAmount: null,
    pointCost: 0,
    active: true,
    expiresAt: new Date("2026-11-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-11-04T00:00:00.000Z"));

    prismaMock = {
      promotion: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      redeemedVoucher: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      voucherUsage: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      user: {
        updateMany: jest.fn(),
      },
      loyaltyTransaction: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prismaMock)),
    };

    service = new PromotionsService(prismaMock as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("findAll", () => {
    it("trả về danh sách promotions và redeemedVouchers rỗng khi chưa đăng nhập", async () => {
      prismaMock.promotion.findMany.mockResolvedValue([
        mockBrew10,
        mockCafe5000,
      ]);

      const result = await service.findAll();

      expect(result.promotions).toHaveLength(2);
      expect(result.redeemedVouchers).toEqual([]);
      expect(prismaMock.redeemedVoucher.findMany).not.toHaveBeenCalled();
      expect(prismaMock.voucherUsage.findMany).not.toHaveBeenCalled();
    });

    it("loại bỏ các mã user đã sử dụng khỏi cả promotions và redeemedVouchers", async () => {
      prismaMock.promotion.findMany.mockResolvedValue([
        mockBrew10,
        mockCafe5000,
        mockVip50k,
      ]);
      prismaMock.redeemedVoucher.findMany.mockResolvedValue([
        {
          id: "rv-1",
          userId: "user-1",
          promotionCode: "VIP50K",
          pointsSpent: 100,
          redeemedAt: new Date("2026-11-03T00:00:00.000Z"),
          promotion: mockVip50k,
        },
        {
          id: "rv-2",
          userId: "user-1",
          promotionCode: "BREW10",
          pointsSpent: 0,
          redeemedAt: new Date("2026-11-02T00:00:00.000Z"),
          promotion: mockBrew10,
        },
      ]);
      // User đã dùng mã BREW10
      prismaMock.voucherUsage.findMany.mockResolvedValue([
        { promotionCode: "BREW10" },
      ]);

      const result = await service.findAll("user-1");

      expect(result.promotions.map((p) => p.code)).toEqual([
        "CAFE5000",
        "VIP50K",
      ]);
      expect(result.redeemedVouchers).toHaveLength(1);
      expect(result.redeemedVouchers[0]).toMatchObject({
        code: "VIP50K",
        pointsSpent: 100,
      });
    });
  });

  describe("redeemPromotion", () => {
    it("đổi điểm thành công khi user đủ điểm và chưa đổi/dùng mã", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(mockVip50k);
      prismaMock.voucherUsage.findFirst.mockResolvedValue(null);
      prismaMock.redeemedVoucher.findUnique.mockResolvedValue(null);
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.redeemedVoucher.create.mockResolvedValue({
        id: "rv-new",
        userId: "user-1",
        promotionCode: "VIP50K",
        pointsSpent: 100,
        promotion: mockVip50k,
      });

      const result = await service.redeemPromotion("user-1", "VIP50K");

      expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
        where: { id: "user-1", loyaltyPoints: { gte: 100 } },
        data: { loyaltyPoints: { decrement: 100 } },
      });
      expect(result.message).toBe("Đổi mã giảm giá thành công");
      expect(result.redeemedVoucher.promotionCode).toBe("VIP50K");
    });

    it("ném lỗi nếu mã miễn phí (pointCost = 0)", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(mockBrew10);

      await expect(
        service.redeemPromotion("user-1", "BREW10"),
      ).rejects.toThrow(
        new BadRequestException("Mã này miễn phí, không cần đổi điểm"),
      );
    });

    it("ném lỗi nếu user không đủ điểm", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(mockVip50k);
      prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.redeemPromotion("user-1", "VIP50K"),
      ).rejects.toThrow(
        new BadRequestException("Bạn không đủ 100 điểm để đổi mã này"),
      );
    });

    it("ném lỗi nếu user đã đổi mã này rồi", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(mockVip50k);
      prismaMock.redeemedVoucher.findUnique.mockResolvedValue({ id: "rv-1" });

      await expect(
        service.redeemPromotion("user-1", "VIP50K"),
      ).rejects.toThrow(
        new BadRequestException(
          "Bạn đã đổi mã này rồi, hãy dùng khi thanh toán",
        ),
      );
    });
  });

  describe("validate", () => {
    it("ném lỗi khi mã khuyến mãi không tồn tại", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(null);

      await expect(
        service.validate("KHONGTONTAI", taoDonHang(100000)),
      ).rejects.toThrow(NotFoundException);
    });

    it("ném lỗi khi mã khuyến mãi đã hết hạn", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(mockHethan);

      await expect(
        service.validate("HETHAN", taoDonHang(50000)),
      ).rejects.toThrow(new BadRequestException("Mã giảm giá đã hết hạn"));
    });

    it("ném lỗi nếu user đã từng sử dụng mã này", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(mockBrew10);
      prismaMock.voucherUsage.count.mockResolvedValue(1);

      await expect(
        service.validate("BREW10", taoDonHang(100000), "user-1"),
      ).rejects.toThrow(
        new BadRequestException("Bạn đã sử dụng mã giảm giá này rồi"),
      );
    });

    it("ném lỗi nếu dùng mã đổi điểm nhưng user chưa đổi", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(mockVip50k);
      prismaMock.redeemedVoucher.findUnique.mockResolvedValue(null);

      await expect(
        service.validate("VIP50K", taoDonHang(150000), "user-1"),
      ).rejects.toThrow(
        new BadRequestException(
          "Bạn cần đổi 100 điểm để nhận mã này trước khi áp dụng",
        ),
      );
    });

    it("áp dụng thành công mã đổi điểm khi user đã đổi", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(mockVip50k);
      prismaMock.redeemedVoucher.findUnique.mockResolvedValue({
        id: "rv-1",
        userId: "user-1",
        promotionCode: "VIP50K",
      });

      const ketQua = await service.validate(
        "VIP50K",
        taoDonHang(150000),
        "user-1",
      );

      expect(ketQua).toMatchObject({
        code: "VIP50K",
        isValid: true,
        discountAmount: 50000,
        totalAmount: 100000,
        pointCost: 100,
      });
    });

    it("báo không đủ điều kiện khi đơn chưa đạt giá trị tối thiểu", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(mockBrew10);

      await expect(
        service.validate("BREW10", taoDonHang(40000)),
      ).rejects.toThrow(
        new BadRequestException("Đơn hàng tối thiểu 50.000đ để dùng mã này"),
      );
    });

    it("xác nhận đơn đủ điều kiện và tính giảm giá phần trăm theo giới hạn tối đa", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(mockBrew10);

      const ketQua = await service.validate("BREW10", taoDonHang(300000));

      expect(ketQua).toMatchObject({
        isValid: true,
        discountAmount: 20000,
        totalAmount: 280000,
      });
    });

    it("không tự thay đổi tổng tiền đơn khi chỉ kiểm tra mã giảm giá", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(mockBrew10);
      const donHang = taoDonHang(300000);

      await service.validate("BREW10", donHang);

      expect(donHang.total).toBe(300000);
    });

    it("tính đúng mức giảm cố định và kiểu khuyến mãi", async () => {
      prismaMock.promotion.findUnique.mockResolvedValue(mockCafe5000);

      const ketQua = await service.validate("CAFE5000", taoDonHang(50000));

      expect(ketQua).toMatchObject({
        isValid: true,
        discountAmount: 5000,
        totalAmount: 45000,
      });
    });
  });

  describe("recordVoucherUsage & rollbackVoucherUsage", () => {
    it("ghi nhận sử dụng mã vào VoucherUsage", async () => {
      await service.recordVoucherUsage({
        userId: "user-1",
        promotionCode: "BREW10",
        orderId: "order-1",
        discountAmount: 15000,
      });

      expect(prismaMock.voucherUsage.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          promotionCode: "BREW10",
          orderId: "order-1",
          discountAmount: 15000,
        },
      });
    });

    it("xóa record VoucherUsage theo orderId khi rollback", async () => {
      await service.rollbackVoucherUsage("order-1");

      expect(prismaMock.voucherUsage.deleteMany).toHaveBeenCalledWith({
        where: { orderId: "order-1" },
      });
    });
  });
});