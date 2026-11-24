import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  Order,
  Prisma,
  Promotion,
  PromotionType,
} from "../generated/prisma/client";

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

async findAll(userId?: string) {
    const now = new Date();
    const activeFilter: Prisma.PromotionWhereInput = {
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    if (!userId) {
      const promotions = await this.prisma.promotion.findMany({
        where: activeFilter,
        orderBy: { createdAt: "desc" },
      });

      return {
        promotions,
        redeemedVouchers: [],
      };
    }

    const [activePromotions, redeemedList, usedList] = await Promise.all([
      this.prisma.promotion.findMany({
        where: activeFilter,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.redeemedVoucher.findMany({
        where: {
          userId,
          promotion: activeFilter,
        },
        include: { promotion: true },
        orderBy: { redeemedAt: "desc" },
      }),
      this.prisma.voucherUsage.findMany({
        where: { userId },
        select: { promotionCode: true },
      }),
    ]);

    const usedCodes = new Set(usedList.map((u) => u.promotionCode));

  
    const promotions = activePromotions.filter((p) => !usedCodes.has(p.code));

    // 2. Tập mã user đã đổi còn hạn (đã loại mã user đã dùng), kèm full thông tin promotion
    const redeemedVouchers = redeemedList
      .filter((r) => !usedCodes.has(r.promotionCode))
      .map((r) => ({
        ...r.promotion,
        redeemedAt: r.redeemedAt,
        pointsSpent: r.pointsSpent,
      }));

    return {
      promotions,
      redeemedVouchers,
    };
  }


  
  /**
   * Đổi điểm lấy mã giảm giá -> Lưu vào bảng RedeemedVoucher
   */
  async redeemPromotion(userId: string, promotionCode: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { code: promotionCode },
    });

    if (!promotion) throw new NotFoundException("Không tìm thấy mã giảm giá");
    if (!promotion.active) {
      throw new BadRequestException("Mã giảm giá không còn hiệu lực");
    }
    if (promotion.expiresAt != null && promotion.expiresAt <= new Date()) {
      throw new BadRequestException("Mã giảm giá đã hết hạn");
    }
    if (promotion.pointCost <= 0) {
      throw new BadRequestException("Mã này miễn phí, không cần đổi điểm");
    }

    const [alreadyUsed, alreadyRedeemed] = await Promise.all([
      this.prisma.voucherUsage.findFirst({
        where: { userId, promotionCode },
      }),
      this.prisma.redeemedVoucher.findUnique({
        where: { userId_promotionCode: { userId, promotionCode } },
      }),
    ]);

    if (alreadyUsed) {
      throw new BadRequestException("Bạn đã sử dụng mã giảm giá này rồi");
    }
    if (alreadyRedeemed) {
      throw new BadRequestException(
        "Bạn đã đổi mã này rồi, hãy dùng khi thanh toán",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({
        where: { id: userId, loyaltyPoints: { gte: promotion.pointCost } },
        data: { loyaltyPoints: { decrement: promotion.pointCost } },
      });

      if (count === 0) {
        throw new BadRequestException(
          `Bạn không đủ ${promotion.pointCost} điểm để đổi mã này`,
        );
      }

      await tx.loyaltyTransaction.create({
        data: {
          userId,
          promotionCode: promotion.code,
          type: "REDEEM",
          points: -promotion.pointCost,
        },
      });

      const redeemedVoucher = await tx.redeemedVoucher.create({
        data: {
          userId,
          promotionCode: promotion.code,
          pointsSpent: promotion.pointCost,
        },
        include: { promotion: true },
      });

      return {
        message: "Đổi mã giảm giá thành công",
        redeemedVoucher,
      };
    });
  }

  /**
   * Kiểm tra và tính toán
   */
  async validate(
    promotionCode: string,
    order: Pick<Order, "total">,
    userId?: string,
  ): Promise<{
    code: string;
    isValid: boolean;
    discountAmount: number;
    totalAmount: number;
    pointCost: number;
  }> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { code: promotionCode },
    });
    if (!promotion) throw new NotFoundException("Không tìm thấy mã giảm giá");
    if (!promotion.active) {
      throw new BadRequestException("Mã giảm giá không còn hiệu lực");
    }
    if (promotion.expiresAt != null && promotion.expiresAt <= new Date()) {
      throw new BadRequestException("Mã giảm giá đã hết hạn");
    }

    // 1. Check đã dùng chưa (VoucherUsage)
    if (userId) {
      const usedCount = await this.prisma.voucherUsage.count({
        where: { userId, promotionCode },
      });
      if (usedCount > 0) {
        throw new BadRequestException("Bạn đã sử dụng mã giảm giá này rồi");
      }
    }

    // 2. Nếu là mã đổi điểm -> Check đã đổi chưa (RedeemedVoucher)
    if (promotion.pointCost > 0) {
      if (!userId) {
        throw new BadRequestException("Vui lòng đăng nhập để dùng mã đổi điểm");
      }

      const redeemed = await this.prisma.redeemedVoucher.findUnique({
        where: { userId_promotionCode: { userId, promotionCode } },
      });

      if (!redeemed) {
        throw new BadRequestException(
          `Bạn cần đổi ${promotion.pointCost} điểm để nhận mã này trước khi áp dụng`,
        );
      }
    }

    // 3. Check giá trị đơn tối thiểu
    if (order.total < promotion.minimumOrderAmount) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu ${promotion.minimumOrderAmount.toLocaleString("vi-VN")}đ để dùng mã này`,
      );
    }

    const { discountAmount, totalAmount } = this.calculateDiscount(
      promotion,
      order,
    );

    return {
      isValid: true,
      discountAmount,
      totalAmount,
      code: promotion.code,
      pointCost: promotion.pointCost,
    };
  }


  // lưu mgg sử dụng vào db
  async recordVoucherUsage(
    params: {
      userId: string;
      promotionCode: string;
      orderId: string;
      discountAmount: number;
    },
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    await tx.voucherUsage.create({
      data: params,
    });
  }

  // hoàn lại mgg cho user
  async rollbackVoucherUsage(
    orderId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    await tx.voucherUsage.deleteMany({
      where: { orderId },
    });
  }

  private calculateDiscount(
    promotion: Promotion,
    order: Pick<Order, "total">,
  ) {
    let totalDiscount: number;

    if (promotion.type === PromotionType.PERCENTAGE) {
      totalDiscount = Math.floor((order.total * promotion.value) / 100);
    } else if (promotion.type === PromotionType.FIXED_AMOUNT) {
      totalDiscount = promotion.value;
    } else {
      throw new BadRequestException("Kiểu giảm giá không hợp lệ");
    }

    if (promotion.maximumDiscountAmount != null) {
      totalDiscount = Math.min(promotion.maximumDiscountAmount, totalDiscount);
    }

    const totalAmount = Math.max(0, order.total - totalDiscount);
    return { discountAmount: totalDiscount, totalAmount };
  }
}