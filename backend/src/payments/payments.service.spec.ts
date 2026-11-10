describe('PaymentsService', () => {
  it.todo('từ chối Idempotency-Key bị gửi lặp trước khi tạo thanh toán mới');
  /*
  import { ConflictException } from '@nestjs/common';
  import { PaymentsService } from './payments.service';

  it('từ chối Idempotency-Key bị gửi lặp trước khi tạo thanh toán mới', async () => {
    const existingPayment = { id: 'payment-1' };
    const transaction = {
      payment: {
        findUnique: jest.fn().mockResolvedValue(existingPayment),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const service = new PaymentsService(prisma as never);

    await expect(
      service.pay({
        orderId: 'order-1',
        idempotencyKey: 'same-key',
        success: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.payment.findUnique).toHaveBeenCalledWith({
      where: { idempotencyKey: 'same-key' },
    });
  });
  */
});
