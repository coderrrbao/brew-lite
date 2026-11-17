import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  OnModuleDestroy,
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
  PAYMENT_FAILED: ["PAID", "CANCELLED"],
  CANCELLED: [],
};

@Injectable()
export class OrdersService implements OnModuleInit, OnModuleDestroy {
  private readonly processingOrders = new Set<string>();
  private scanTimer?: ReturnType<typeof setInterval>;
  private scanning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    private readonly promotion: PromotionsService,
  ) {}

  onModuleInit() {
    this.scanTimer = setInterval(() => {
      void this.scanPaidOrders();
    }, 2500);
  }

  onModuleDestroy() {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
    }
  }

  private async scanPaidOrders(): Promise<void> {
    if (this.scanning) return;

    this.scanning = true;

    try {
      const orders = await this.prisma.order.findMany({
        where: { status: "PAID" },
        select: { id: true },
      });

      for (const order of orders) {
        if (this.processingOrders.has(order.id)) continue;

        this.processingOrders.add(order.id);

        void this.autoProgressOrder(order.id)
          .catch(() => {})
          .finally(() => {
            this.processingOrders.delete(order.id);
          });
      }
    } catch {
      // Bỏ qua lỗi quét đơn hàng
    } finally {
      this.scanning = false;
    }
  }

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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async autoProgressOrder(orderId: string): Promise<void> {
    const statuses = [
      "PREPARING",
      "READY",
      "COMPLETED",
    ] as const;

    for (const status of statuses) {
      await this.sleep(2500);

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) return;

      const expectedStatus =
        status === "PREPARING"
          ? "PAID"
          : status === "READY"
            ? "PREPARING"
            : "READY";

      if (order.status !== expectedStatus) return;

      const result = await this.prisma.order.updateMany({
        where: {
          id: orderId,
          status: expectedStatus,
        },
        data: { status },
      });

      if (result.count === 0) return;
    }
  }
}