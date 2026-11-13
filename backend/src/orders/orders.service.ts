import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Order, OrderItem, OrderStatus } from "../generated/prisma/client";
import { CreateOrderDto } from "./dto/create-order.dto";
import { PrismaService } from "../prisma/prisma.service";
import { ProductsService } from "../products/products.service";
import { PromotionsService } from "../promotions/promotions.service";

export type OrderWithRelations = Order & {
  items: OrderItem[];
};

const allowedOrderTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PAID", "PAYMENT_FAILED", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  PAYMENT_FAILED: ["PENDING", "CANCELLED"],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    private readonly promotion: PromotionsService,
  ) {}

  assertTransition(from: OrderStatus, to: OrderStatus): void {
    if (!allowedOrderTransitions[from].includes(to)) {
      throw new ConflictException(
        `Cannot change order status from ${from} to ${to}`,
      );
    }
  }
  async create(dto: CreateOrderDto): Promise<OrderWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      await this.products.reserveStock(tx, dto.items);
      const subTotal = dto.items.reduce((sum, item) => sum + item.lineTotal, 0);
      let discountAmount = 0;
      let appliedCode: string | null = null;
      if (dto.promotionCode) {
        const promo = await this.promotion.validate(dto.promotionCode, {
          total: subTotal,
        }, dto.userId);

        discountAmount = promo.discountAmount;
        appliedCode = promo.code;
      }

      const total = Math.max(0, subTotal - discountAmount);

      return tx.order.create({
        data: {
          userId: dto.userId,
          promotionCode: appliedCode ?? null,
          subTotal,
          discountAmount,
          total,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              name: item.name,
              imageUrl: item.imageUrl,
              size: item.size,
              toppings: item.toppings,
              qty: item.qty,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  async findMine(userId: string): Promise<OrderWithRelations[]> {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
  ): Promise<OrderWithRelations> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");

    this.assertTransition(order.status, status);

    const updated = await this.prisma.order.updateMany({
      where: { id, status: order.status },
      data: { status },
    });
    if (updated.count === 0) {
      throw new ConflictException("Order status changed concurrently");
    }

    return this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    });
  }
}
