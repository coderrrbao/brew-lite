import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Order,
  OrderItem,
  OrderStatus,
  Payment,
} from '../generated/prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';

export type OrderWithRelations = Order & {
  items: OrderItem[];
  payments: Payment[];
};

@Injectable()
export class OrdersService {
  private readonly orders: OrderWithRelations[] = [];

  create(_dto: CreateOrderDto): OrderWithRelations | undefined {
    return undefined;
  }

  findMine(): OrderWithRelations[] {
    return this.orders;
  }

  // State machine PENDING -> PAID -> PREPARING -> READY -> COMPLETED (TODO: validate transitions)
  updateStatus(
    id: string,
    status: OrderStatus,
    payment?: Payment,
  ): OrderWithRelations {
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new NotFoundException('Order not found');
    order.status = status;
    if (payment) order.payments.push(payment);
    return order;
  }
}
