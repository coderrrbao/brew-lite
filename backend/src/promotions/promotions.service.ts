import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order, Promotion, PromotionType } from '../generated/prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(): Promise<Promotion[]> {
    return this.prisma.promotion.findMany({
      where: {
        active: true,
        OR: [
          { expiresAt: { gt: new Date() } },
          { expiresAt: null }
        ]
      }
    });
  }

  async validate(
    promotionCode: string,
    order: Pick<Order, 'total'>,
  ): Promise<{ isValid: boolean, discountAmount: number, totalAmount: number }> {
    const promotion = await this.prisma.promotion.findUnique({ where: { code: promotionCode } });
    if (!promotion) throw new NotFoundException("Không tìm thấy mã giảm giá");
    if (!promotion.active) {
      throw new BadRequestException("Mã giảm giá không còn hiệu lực");
    }
    if (promotion.expiresAt != null && promotion.expiresAt < new Date()) {
      throw new BadRequestException("Mã giảm giá hết hạn");
    }

    function caculationDiscount(
      promotion: Promotion,
      order: Pick<Order, 'total'>,
    ) {
      const discountValue = promotion.value;
      const typePromotion = promotion.type;

      let totalDiscount: number;

      if (typePromotion === PromotionType.PERCENTAGE) {
        totalDiscount = (order.total * discountValue) / 100;
      }
      else if (typePromotion === PromotionType.FIXED_AMOUNT) {
        totalDiscount = discountValue;
      }
      else {
        throw new BadRequestException("Kiểu giảm giá không hợp lệ");
      }

      if (promotion.maximumDiscountAmount != null) {
        totalDiscount = Math.min(promotion.maximumDiscountAmount, totalDiscount);
      }

      let totalAmount = order.total - totalDiscount;
      if (totalAmount < 0) totalAmount = 0;
      return { discountAmount: totalDiscount, totalAmount };
    }

    let isValid = false;
    if (promotion.minimumOrderAmount == null || order.total >= promotion.minimumOrderAmount) {
      isValid = true;
    }

    const { discountAmount, totalAmount } = caculationDiscount(promotion, order);

    return { isValid, discountAmount, totalAmount }

  }
}
