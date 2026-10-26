import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '../common/types';
import { CreateOrderDto } from './dto/create-order.dto';

export interface MockOrder {
  id: string;
  items: Array<Record<string, unknown>>;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  createdAt: string;
}

@Injectable()
export class OrdersService {
  private readonly orders: MockOrder[] = [];

  create(dto: CreateOrderDto): MockOrder {
    const order: MockOrder = {
      id: `BL-${Date.now().toString().slice(-8)}`,
      items: dto.items,
      total: dto.total,
      status: 'PENDING',
      paymentMethod: '',
      createdAt: new Date().toISOString(),
    };
    this.orders.unshift(order);
    return order;
  }

  findMine(): MockOrder[] {
    return this.orders;
  }

  // State machine PENDING -> PAID -> PREPARING -> READY -> COMPLETED (TODO: validate transitions)
  updateStatus(id: string, status: OrderStatus, paymentMethod?: string): MockOrder {
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new NotFoundException('Order not found');
    order.status = status;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    return order;
  }
}
