import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePaymentDto, PayOrderDto } from "./dto/create-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Idempotent by idempotencyKey. TODO: call real payment gateway (MoMo / ZaloPay / card)
  async create(dto: CreatePaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException("Payment key not found");

    if (payment.orderId !== dto.orderId) {
      throw new ConflictException("Payment key does not belong to this order");
    }

    if (
      payment.status === "PAYMENT_SUCCESS" ||
      payment.order.status === "PAID"
    ) {
      throw new ConflictException("Order has been paid");
    }

    if (payment.status === "PAYMENT_FAILED") {
      throw new ConflictException("Payment has failed");
    }

    return {
      message: `QR thanh toán cho đơn hàng ${payment.orderId}`,
      paymentId: payment.id,
      amount: payment.amount,
    };
  }

  async pay(dto: PayOrderDto) {
    return await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: dto.paymentId },
        include: {
          order: {
            include: {
              items: true,
            },
          },
        },
      });
      if (!payment) throw new NotFoundException("Payment does not exist");

      if (payment.status !== "PENDING") {
        return {
          message: "Payment already processed",
          order: payment.order,
          payment,
        };
      }

      const claimed = await tx.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: { status: dto.success ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED" },
      });

      if (claimed.count === 0) {
        const current = await tx.payment.findUniqueOrThrow({
          where: { id: payment.id },
          include: {
            order: {
              include: {
                items: true,
              },
            },
          },
        });
        return {
          message: "Payment already processed",
          order: current.order,
          payment: current,
        };
      }

      const orderUpdated = await tx.order.updateMany({
        where: { id: payment.orderId, status: "PENDING" },
        data: { status: dto.success ? "PAID" : "PAYMENT_FAILED" },
      });

      if (orderUpdated.count === 0) {
        throw new ConflictException("Order is not pending");
      }

      const updatedPayment = await tx.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: {
          order: {
            include: {
              items: true,
            },
          },
        },
      });

      return {
        message: dto.success
          ? `Thanh toán đơn hàng ${updatedPayment.orderId} thành công`
          : `Thanh toán đơn hàng ${updatedPayment.orderId} thất bại`,
        order: updatedPayment.order,
        payment: updatedPayment,
      };
    });
  }
}
