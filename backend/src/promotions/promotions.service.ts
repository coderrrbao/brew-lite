import { Injectable } from '@nestjs/common';
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
  }
}
