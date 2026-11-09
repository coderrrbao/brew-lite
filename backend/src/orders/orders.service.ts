import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Order,
  OrderItem,
  OrderStatus,
  Payment,
} from '../generated/prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from '../prisma/prisma.service';

export type OrderWithRelations = Order & {
  items: OrderItem[];
  payments: Payment[];
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto): Promise<OrderWithRelations> {
    return this.prisma.$transaction(async (transaction) => {
      for (const item of dto.items) {
        const updated = await transaction.product.updateMany({
          where: { id: item.productId, active: true, stock: { gte: item.qty } },
          data: { stock: { decrement: item.qty } },
        });
        if (updated.count !== 1) {
          throw new ConflictException(`Insufficient stock for product ${item.productId}`);
        }
      }

      return transaction.order.create({
        data: {
          userId: dto.userId,
          total: dto.total,
          items: { create: dto.items },
        },
        include: { items: true, payments: true },
      });
    });
  }

  async findMine(): Promise<OrderWithRelations[]> {
    return this.prisma.order.findMany({
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
  ): Promise<OrderWithRelations> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const allowedNextStatuses: Partial<Record<OrderStatus, OrderStatus[]>> = {
      PAID: ['PREPARING'],
      PREPARING: ['READY'],
      READY: ['COMPLETED'],
    };
    if (!allowedNextStatuses[order.status]?.includes(status)) {
      throw new ConflictException(
        `Cannot change order status from ${order.status} to ${status}`,
      );
    }

    const updated = await this.prisma.order.updateMany({
      where: { id, status: order.status },
      data: { status },
    });
    if (updated.count === 0) {
      throw new ConflictException('Order status changed concurrently');
    }

    return this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: { items: true, payments: true },
    });
  }
}
