import { Injectable, NotFoundException } from '@nestjs/common';
import { MockOrderItem, MockPayment, OrderStatus } from '../common/types';
import { CreateOrderDto } from './dto/create-order.dto';

export interface MockOrder {
  id: string;
  userId: string;
  items: MockOrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  payment?: MockPayment;
}

@Injectable()
export class OrdersService {
  private readonly orders: MockOrder[] = [];

  create(dto: CreateOrderDto): MockOrder {
    const id = `BL-${Date.now().toString().slice(-8)}`;
    const order: MockOrder = {
      id,
      userId: dto.userId,
      items: dto.items.map(({ unitPrice: _unitPrice, ...item }) => ({
        ...item,
        orderId: id,
        lineTotal: item.lineTotal,
      })),
      total: dto.total,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.orders.unshift(order);
    return order;
  }

  findMine(): MockOrder[] {
    return this.orders;
  }

  // State machine PENDING -> PAID -> PREPARING -> READY -> COMPLETED (TODO: validate transitions)
  updateStatus(id: string, status: OrderStatus, payment?: MockPayment): MockOrder {
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new NotFoundException('Order not found');
    order.status = status;
    if (payment) order.payment = payment;
    return order;
  }
}
