import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Idempotent by idempotencyKey. TODO: call real payment gateway (MoMo / ZaloPay / card)
  async pay(dto: CreatePaymentDto) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const existingPayment = await transaction.payment.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
        });
        if (existingPayment) {
          throw new ConflictException('Payment key has already been processed');
        }

        const order = await transaction.order.findUnique({
          where: { id: dto.orderId },
          select: { id: true, total: true },
        });
        if (!order) throw new NotFoundException('Order not found');

        const status = dto.success ? 'PAID' : 'PAYMENT_FAILED';
        const updated = await transaction.order.updateMany({
          where: { id: order.id, status: 'PENDING' },
          data: { status },
        });
        if (updated.count === 0) {
          throw new ConflictException('Order is not pending');
        }

        const payment = dto.success
          ? await transaction.payment.create({
              data: {
                orderId: order.id,
                idempotencyKey: dto.idempotencyKey,
                amount: order.total,
                method: 'mock',
              },
            })
          : null;

        const updatedOrder = await transaction.order.findUniqueOrThrow({
          where: { id: order.id },
          include: { items: true, payments: true },
        });

        // TODO(repo1): apply the order promotion and award loyalty points
        // in this transaction after a successful PAID transition.
        return { order: updatedOrder, payment };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Payment key has already been processed');
      }
      throw error;
    }
  }
}
