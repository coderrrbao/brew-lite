import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly processed = new Map<string, { orderId: string; status: string }>();

  constructor(private readonly orders: OrdersService) {}

  // Idempotent by idempotencyKey. TODO: call real payment gateway (MoMo / ZaloPay / card)
  pay(dto: CreatePaymentDto) {
    const cached = this.processed.get(dto.idempotencyKey);
    if (cached) return cached;
    const order = this.orders.updateStatus(dto.orderId, 'PAID', dto.method);
    const result = { orderId: order.id, status: order.status };
    this.processed.set(dto.idempotencyKey, result);
    return result;
  }
}
