import { Injectable } from '@nestjs/common';
import { mockPromotions, Promotion } from './promotions.mock';

@Injectable()
export class PromotionsService {
  findAll(): Promotion[] {
    return mockPromotions.filter((promotion) => promotion.active);
  }

  validate(code: string, subtotal: number) {
    const normalizedCode = code.trim().toUpperCase();
    const promotion = mockPromotions.find((item) => item.code === normalizedCode);

    if (!promotion || !promotion.active) {
      return { valid: false, message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn' };
    }

    if (subtotal < promotion.minimumOrderAmount) {
      return {
        valid: false,
        message: `Đơn hàng cần đạt tối thiểu ${promotion.minimumOrderAmount}đ`,
      };
    }

    const calculatedDiscount =
      promotion.type === 'PERCENTAGE'
        ? Math.floor((subtotal * promotion.value) / 100)
        : promotion.value;
    const discountAmount = Math.min(
      subtotal,
      promotion.maximumDiscountAmount === undefined
        ? calculatedDiscount
        : Math.min(calculatedDiscount, promotion.maximumDiscountAmount),
    );

    return {
      valid: true,
      promotion,
      discountAmount,
      totalAfterDiscount: subtotal - discountAmount,
    };
  }
}
