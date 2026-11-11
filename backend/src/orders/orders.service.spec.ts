import { ConflictException } from '@nestjs/common';
import type { OrderStatus } from '../generated/prisma/client';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const service = new OrdersService({} as never, {} as never);

  it('từ chối chuyển trạng thái đơn hàng không hợp lệ', () => {
    expect(() =>
      service.assertTransition('PENDING' as OrderStatus, 'READY' as OrderStatus),
    ).toThrow(ConflictException);
  });
});
