import { Injectable } from '@nestjs/common';
import { MockPayment } from '../common/types';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly processed = new Map<
    string,
    { orderId: string; status: string; payment: MockPayment }
  >();

  constructor(private readonly orders: OrdersService) {}

  // Idempotent by idempotencyKey. TODO: call real payment gateway (MoMo / ZaloPay / card)
  pay(dto: CreatePaymentDto) {
    const cached = this.processed.get(dto.idempotencyKey);
    if (cached) return cached;
    const order = this.orders.updateStatus(dto.orderId, 'PAID');
    const payment: MockPayment = {
      id: `payment-${Date.now()}`,
      orderId: order.id,
      idempotencyKey: dto.idempotencyKey,
      amount: order.total,
      method: dto.method,
    };
    this.orders.updateStatus(order.id, 'PAID', payment);
    const result = { orderId: order.id, status: order.status, payment };
    this.processed.set(dto.idempotencyKey, result);
    return result;
  }
}
