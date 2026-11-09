import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Order, Promotion } from '../generated/prisma/client';
import { mockPromotions } from './promotions.mock';

@Injectable()
export class PromotionsService {
  findAll(): Promotion[] {
    const now = new Date();
    return mockPromotions.filter(
      (promotion) =>
        promotion.active &&
        (!promotion.expiresAt || promotion.expiresAt > now),
    );
  }

  validate(code: string, order: Pick<Order, 'total'>) {
    const promotion = mockPromotions.find((item) => item.code === code);
    if (!promotion) throw new NotFoundException('Promotion not found');
    if (!promotion.active || (promotion.expiresAt && promotion.expiresAt <= new Date())) {
      throw new BadRequestException('Promotion is expired or inactive');
    }

    if (order.total < promotion.minimumOrderAmount) {
      return {
        valid: false,
        promotion,
        discountAmount: 0,
        totalAfterDiscount: order.total,
      };
    }

    const rawDiscount =
      promotion.type === 'PERCENTAGE'
        ? Math.floor((order.total * promotion.value) / 100)
        : promotion.value;
    const discountAmount = promotion.maximumDiscountAmount
      ? Math.min(rawDiscount, promotion.maximumDiscountAmount)
      : rawDiscount;

    return {
      valid: true,
      promotion,
      discountAmount,
      totalAfterDiscount: Math.max(0, order.total - discountAmount),
    };
  }
}
