import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  Order,
  OrderStatus,
  Promotion,
  PromotionType,
} from "../generated/prisma/client";
import { UsersService } from "../users/users.service";

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
  ) {}

  async findAll(userId?: string): Promise<Promotion[]> {
    if (!userId) return [];

    const usedOrders = await this.prisma.order.findMany({
      where: {
        userId,
        promotionCode: { not: null },
        status: { notIn: [OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED] },
      },
      select: { promotionCode: true },
      distinct: ["promotionCode"],
    });

    const usedCodes = usedOrders.map((o) => o.promotionCode as string);

    return this.prisma.promotion.findMany({
      where: {
        active: true,
        OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
        code: { notIn: usedCodes },
      },
    });
  }

  async validate(
    promotionCode: string,
    order: Pick<Order, "total">,
    userId?: string,
  ): Promise<{
    code: string;
    isValid: boolean;
    discountAmount: number;
    totalAmount: number;
    pointCost: number | null;
  }> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { code: promotionCode },
    });
    if (!promotion) throw new NotFoundException("Không tìm thấy mã giảm giá");
    if (!promotion.active) {
      throw new BadRequestException("Mã giảm giá không còn hiệu lực");
    }
    if (promotion.expiresAt != null && promotion.expiresAt < new Date()) {
      throw new BadRequestException("Mã giảm giá hết hạn");
    }

    const pointCost = promotion.pointCost ?? 0;

    if (pointCost > 0) {
      if (!userId) {
        throw new BadRequestException("Vui lòng đăng nhập để dùng mã đổi điểm");
      }

      const { loyaltyPoints } = await this.userService.getLoyaltyPoints(userId);

      if (pointCost > loyaltyPoints) {
        throw new BadRequestException(
          `Bạn cần ${pointCost} điểm để dùng mã này (hiện có ${loyaltyPoints} điểm)`,
        );
      }
    }

    if (userId) {
      const usedCount = await this.prisma.order.count({
        where: {
          userId,
          promotionCode,
          status: { notIn: [OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED] },
        },
      });

      if (usedCount > 0) {
        throw new BadRequestException("Bạn đã sử dụng mã này rồi");
      }
    }

    function caculationDiscount(
      promotion: Promotion,
      order: Pick<Order, "total">,
    ) {
      const discountValue = promotion.value;
      const typePromotion = promotion.type;

      let totalDiscount: number;

      if (typePromotion === PromotionType.PERCENTAGE) {
        totalDiscount = Math.floor((order.total * discountValue) / 100);
      } else if (typePromotion === PromotionType.FIXED_AMOUNT) {
        totalDiscount = discountValue;
      } else {
        throw new BadRequestException("Kiểu giảm giá không hợp lệ");
      }

      if (promotion.maximumDiscountAmount != null) {
        totalDiscount = Math.min(
          promotion.maximumDiscountAmount,
          totalDiscount,
        );
      }

      let totalAmount = order.total - totalDiscount;
      if (totalAmount < 0) totalAmount = 0;
      return { discountAmount: totalDiscount, totalAmount };
    }

    if (
      promotion.minimumOrderAmount != null &&
      order.total < promotion.minimumOrderAmount
    ) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu ${promotion.minimumOrderAmount.toLocaleString("vi-VN")}đ để dùng mã này`,
      );
    }

    const { discountAmount, totalAmount } = caculationDiscount(
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
}
