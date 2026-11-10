import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { PayOrderDto } from "./dto/create-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}
  async pay(dto: PayOrderDto) {
    return await this.prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });

      if (existing) {
        throw new ConflictException("Idempotency key already used");
      }

      const order = await tx.order.findUnique({
        where: { id: dto.orderId },
      });

      if (!order) throw new NotFoundException("Order does not exist");
      if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
        throw new ConflictException("Order is not payable");
      }

      let payment;
      try {
        payment = await tx.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey: dto.idempotencyKey,
            amount: order.total,
            method: dto.method ?? "mock",
            status: dto.success ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED",
          },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          throw new ConflictException("Idempotency key already used");
        }
        throw e;
      }

      const updated = await tx.order.updateMany({
        where: { id: order.id, status: { in: ["PENDING", "PAYMENT_FAILED"] } },
        data: { status: dto.success ? "PAID" : "PAYMENT_FAILED" },
      });
      if (updated.count === 0)
        throw new ConflictException("Order is not payable");

      // if (dto.success) {
      //   await tx.user.update({
      //     where: { id: order.userId },
      //     data: {
      //       loyaltyPoints: { increment: Math.floor(order.total / 1000) },
      //     },
      //   });
      // }

      const updatedOrder = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { items: true },
      });

      return {
        message: dto.success
          ? `Thanh toán đơn hàng ${order.id} thành công`
          : `Thanh toán đơn hàng ${order.id} thất bại`,
        order: updatedOrder,
        payment,
      };
    });
  }
}
