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
  PAYMENT_FAILED: ["PENDING", "PAID", "CANCELLED"],
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

  async create(dto: CreateOrderDto, userId?: string): Promise<OrderWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Giữ tồn kho bằng optimistic locking trong ProductsService
      await this.products.reserveStock(tx, dto.items);

      // 2. Truy vấn toàn bộ Product, SizeOption, Topping liên quan từ DB
      const productIds = [...new Set(dto.items.map((i) => i.productId))];
      const sizeValues = [...new Set(dto.items.map((i) => i.size))];
      const toppingIds = [...new Set(dto.items.flatMap((i) => i.toppings))];

      const [dbProducts, dbSizes, dbToppings] = await Promise.all([
        tx.product.findMany({ where: { id: { in: productIds } } }),
        tx.sizeOption.findMany({ where: { value: { in: sizeValues } } }),
        tx.topping.findMany({
          where: { id: { in: toppingIds }, active: true },
        }),
      ]);

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));
      const sizeMap = new Map(dbSizes.map((s) => [s.value, s]));
      const toppingMap = new Map(dbToppings.map((t) => [t.id, t]));

      // 3. Validate & tính lại đơn giá (unitPrice) + thành tiền (lineTotal) trên Server
      const preparedItems = dto.items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product || !product.active) {
          throw new NotFoundException(
            `Sản phẩm ${item.productId} không tồn tại hoặc đã ngừng bán.`,
          );
        }

        const sizeOption = sizeMap.get(item.size);
        if (!sizeOption) {
          throw new BadRequestException(
            `Kích cỡ "${item.size}" không hợp lệ.`,
          );
        }

        const uniqueToppings = [...new Set(item.toppings)];
        let toppingAdd = 0;
        for (const tid of uniqueToppings) {
          const topping = toppingMap.get(tid);
          if (!topping) {
            throw new BadRequestException(
              `Topping "${tid}" không hợp lệ hoặc đã ngừng phục vụ.`,
            );
          }
          toppingAdd += topping.price;
        }

        const unitPrice = product.price + sizeOption.priceAdd + toppingAdd;
        const lineTotal = unitPrice * item.qty;

        return {
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          size: sizeOption.value,
          toppings: uniqueToppings,
          qty: item.qty,
          unitPrice,
          lineTotal,
        };
      });

      const subTotal = preparedItems.reduce((sum, i) => sum + i.lineTotal, 0);

      // 4. Kiểm tra và tính giảm giá (nếu có mã khuyến mãi)
      let discountAmount = 0;
      let appliedCode: string | null = null;
      if (dto.promotionCode) {
        const promo = await this.promotion.validate(
          dto.promotionCode,
          { total: subTotal },
          userId,
        );

        discountAmount = promo.discountAmount;
        appliedCode = promo.code;
      }

      const total = Math.max(0, subTotal - discountAmount);

      // 5. Tạo đơn ở trạng thái PENDING với giá chuẩn từ DB
      return tx.order.create({
        data: {
          userId: userId ?? null,
          promotionCode: appliedCode,
          subTotal,
          discountAmount,
          total,
          items: {
            create: preparedItems,
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

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        items: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // Dành riêng cho khách hàng tự cập nhật trạng thái đơn của chính mình (Thanh toán lại -> PENDING hoặc Hủy -> CANCELLED)
  async updateStatusByUser(
    id: string,
    status: OrderStatus,
    userId: string,
  ): Promise<OrderWithRelations> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (order.userId !== userId) {
      throw new ConflictException("You do not have permission to modify this order");
    }

    if (status !== "PENDING" && status !== "CANCELLED") {
      throw new ConflictException("Customers can only retry or cancel their orders");
    }

    this.assertTransition(order.status, status);

    const updated = await this.prisma.order.updateMany({
      where: { id, status: order.status },
      data: { status },
    });

    if (updated.count === 0) {
      throw new ConflictException("Order status changed concurrently");
    }

    // Nếu khách hàng tự hủy đơn (CANCELLED), tự động hoàn trả lại tồn kho sản phẩm
    if (status === "CANCELLED" && order.status !== "CANCELLED") {
      const orderItems = await this.prisma.orderItem.findMany({
        where: { orderId: id },
      });
      for (const item of orderItems) {
        await this.prisma.product.update({
          where: { id: item.productId as string },
          data: { stock: { increment: item.qty } },
        }).catch(() => {});
      }
    }

    return this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    });
  }

  // Dành cho Staff: PAID -> PREPARING -> READY -> COMPLETED
  async updateStatus(
    id: string,
    status: OrderStatus,
  ): Promise<OrderWithRelations> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

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