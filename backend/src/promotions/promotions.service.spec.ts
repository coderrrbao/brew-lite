import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { Order, Promotion } from "../generated/prisma/client";
import { PromotionsService } from "./promotions.service";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";

describe("promotionsService", () => {
  let service: PromotionsService;
  let prismaMock: {
    promotion: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    order: {
      findMany: jest.Mock;
    };
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
    type: "PERCENTAGE",
    value: 10,
    minimumOrderAmount: 50000,
    maximumDiscountAmount: 20000,
    active: true,
    expiresAt: null,
  };

  const mockCafe5000: Partial<Promotion> = {
    code: "CAFE5000",
    type: "FIXED_AMOUNT",
    value: 5000,
    minimumOrderAmount: 20000,
    maximumDiscountAmount: null,
    active: true,
    expiresAt: null,
  };

  const mockHethan: Partial<Promotion> = {
    code: "HETHAN",
    type: "FIXED_AMOUNT",
    value: 10000,
    minimumOrderAmount: 0,
    maximumDiscountAmount: null,
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
      order: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const userService = new UsersService(
      prismaMock as unknown as PrismaService,
    );
    service = new PromotionsService(
      prismaMock as unknown as PrismaService,
      userService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("không liệt kê mã khuyến mãi đã hết hạn", async () => {
    prismaMock.promotion.findMany.mockResolvedValue([]);
    const mockActivePromotions: Partial<Promotion>[] = [
      { code: "BREW10", active: true, expiresAt: new Date("2026-12-31") },
      { code: "CAFE5000", active: true, expiresAt: null },
    ];

    prismaMock.promotion.findMany.mockResolvedValue(mockActivePromotions);

    const result = await service.findAll("user-1");

    expect(result.some(({ code }) => code === "HETHAN")).toBe(false);
    expect(prismaMock.promotion.findMany).toHaveBeenCalledTimes(1);
  });

  it("ném lỗi khi mã khuyến mãi không tồn tại", async () => {
    prismaMock.promotion.findUnique.mockResolvedValue(null);

    await expect(
      service.validate("KHONGTONTAI", taoDonHang(100000)),
    ).rejects.toThrow(NotFoundException);
  });

  it("báo không đủ điều kiện khi đơn chưa đạt giá trị tối thiểu", async () => {
    prismaMock.promotion.findUnique.mockResolvedValue(mockBrew10);

    await expect(service.validate("BREW10", taoDonHang(40000))).rejects.toThrow(
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

  it("ném lỗi khi mã khuyến mãi đã hết hạn", async () => {
    prismaMock.promotion.findUnique.mockResolvedValue(mockHethan);

    await expect(service.validate("HETHAN", taoDonHang(50000))).rejects.toThrow(
      BadRequestException,
    );
  });
});
