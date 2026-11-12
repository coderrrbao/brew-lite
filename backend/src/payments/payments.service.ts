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

  async create(dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) {
      throw new NotFoundException("Đơn hàng không tồn tại");
    }

    let payment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });

    if (!payment) {
      if (!["PENDING", "PAYMENT_FAILED"].includes(order.status)) {
        throw new ConflictException("Order is not payable");
      }

      try {
        payment = await this.prisma.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey: dto.idempotencyKey,
            amount: order.total,
            method: dto.method,
            status: "PENDING",
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          payment = await this.prisma.payment.findUniqueOrThrow({
            where: { idempotencyKey: dto.idempotencyKey },
          });
        } else {
          throw error;
        }
      }
    }

    if (payment.orderId !== dto.orderId) {
      throw new ConflictException("Idempotency key đã dùng cho đơn hàng khác");
    }

    return {
      message:
        payment.status === "PAYMENT_SUCCESS"
          ? "Đơn hàng đã thanh toán"
          : payment.status === "PAYMENT_FAILED"
            ? "Đơn thanh toán thất bại"
            : `QR thanh toán cho đơn hàng ${payment.orderId}`,
      payment,
      orderId: payment.orderId,
    };
  }

  async pay(dto: PayOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: { order: { include: { items: true } } },
      });
      if (!payment) {
        throw new NotFoundException("Payment key not found");
      }

      if (payment.status !== "PENDING") {
        return {
          message:
            payment.status === "PAYMENT_SUCCESS"
              ? "Đơn hàng đã thanh toán"
              : "Đơn thanh toán thất bại",
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
          include: { order: { include: { items: true } } },
        });
        return {
          message:
            current.status === "PAYMENT_SUCCESS"
              ? "Đơn hàng đã thanh toán"
              : current.status === "PAYMENT_FAILED"
                ? "Đơn thanh toán thất bại"
                : "Đơn hàng đang trong quá trình thanh toán",
          order: current.order,
          payment: current,
        };
      }

      const updated = await tx.order.updateMany({
        where: {
          id: payment.orderId,
          status: { in: ["PENDING", "PAYMENT_FAILED"] },
        },
        data: { status: dto.success ? "PAID" : "PAYMENT_FAILED" },
      });

      if (updated.count === 0) {
        throw new ConflictException("Order is not payable");
      }

      const updatedPayment = await tx.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: { order: { include: { items: true } } },
      });

      return {
        message: dto.success
          ? `Thanh toán đơn hàng ${payment.orderId} thành công`
          : `Thanh toán đơn hàng ${payment.orderId} thất bại`,
        order: updatedPayment.order,
        payment: updatedPayment,
      };
    });
  }
}
