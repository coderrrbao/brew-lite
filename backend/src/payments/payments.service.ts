import { Injectable } from '@nestjs/common';
import type { OrderStatus, Payment } from '../generated/prisma/client';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly processed = new Map<
    string,
    { orderId: string; status: OrderStatus; payment: Payment }
  >();

  constructor(private readonly orderService: OrdersService) {}

  // Idempotent by idempotencyKey. TODO: call real payment gateway (MoMo / ZaloPay / card)
  async pay(dto: CreatePaymentDto) {
  }
}
