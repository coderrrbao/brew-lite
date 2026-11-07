import "dotenv/config";
import { randomUUID } from "node:crypto";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentsService } from "./payments.service";

describe("PaymentsService (PostgreSQL integration)", () => {
  let prisma: PrismaService;
  let service: PaymentsService;
  let userId: string;
  let orderId: string;
  let paymentId: string;
  let idempotencyKey: string;

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required for DB tests");
    const databaseName = decodeURIComponent(
      new URL(databaseUrl).pathname.slice(1),
    );
    if (!/(^|[_-])test$/i.test(databaseName)) {
      throw new Error(
        `Refusing to run DB tests against non-test database "${databaseName}"`,
      );
    }

    prisma = new PrismaService();
    await prisma.$connect();
    service = new PaymentsService(prisma);
  });

  beforeEach(async () => {
    userId = "";
    orderId = "";
    paymentId = "";
    idempotencyKey = randomUUID();

    const user = await prisma.user.create({
      data: {
        email: `${randomUUID()}@payments.integration.test`,
        passwordHash: "not-used-by-test",
      },
    });
    userId = user.id;

    // Order + payment PENDING tạo sẵn, giống OrdersService.create
    const order = await prisma.order.create({
      data: {
        userId,
        total: 90000,
        payments: {
          create: { idempotencyKey, amount: 90000, method: "mock" },
        },
      },
      include: { payments: true },
    });
    orderId = order.id;
    paymentId = order.payments[0].id;
  });

  afterEach(async () => {
    if (orderId) {
      await prisma.payment.deleteMany({ where: { orderId } });
      await prisma.order.delete({ where: { id: orderId } });
    }
    if (userId) await prisma.user.delete({ where: { id: userId } });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  describe("pay()", () => {
    it("đổi payment sang PAYMENT_SUCCESS và order PENDING sang PAID", async () => {
      const result = await service.pay({ paymentId, success: true });

      const fromDatabase = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { payments: true },
      });
      expect(result.order.status).toBe("PAID");
      expect(result.payment.status).toBe("PAYMENT_SUCCESS");
      expect(fromDatabase.status).toBe("PAID");
      expect(fromDatabase.payments).toHaveLength(1);
      expect(fromDatabase.payments[0]).toMatchObject({
        orderId,
        idempotencyKey,
        status: "PAYMENT_SUCCESS",
      });
    });

    it("đổi order sang PAYMENT_FAILED khi thanh toán thất bại", async () => {
      const result = await service.pay({ paymentId, success: false });

      const fromDatabase = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
      });
      expect(result.order.status).toBe("PAYMENT_FAILED");
      expect(result.payment.status).toBe("PAYMENT_FAILED");
      expect(fromDatabase.status).toBe("PAYMENT_FAILED");
    });

    it("gọi lần hai trả kết quả cũ, không ném lỗi và không ghi đè", async () => {
      await service.pay({ paymentId, success: true });
      const second = await service.pay({ paymentId, success: false });

      expect(second.message).toBe("Payment already processed");
      expect(second.order.status).toBe("PAID");
      expect(await prisma.payment.count({ where: { orderId } })).toBe(1);
    });

    it("hai request song song chỉ một request xử lý", async () => {
      const [a, b] = await Promise.all([
        service.pay({ paymentId, success: true }),
        service.pay({ paymentId, success: false }),
      ]);

      const final = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
      });
      // Kết quả cuối khớp với đúng một request, không bị ghi đè lẫn nhau
      expect(["PAID", "PAYMENT_FAILED"]).toContain(final.status);
      expect(a.order.status === b.order.status).toBe(true);
    });

    it("ném NotFoundException khi paymentId không tồn tại", async () => {
      await expect(
        service.pay({ paymentId: randomUUID(), success: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it("ném ConflictException khi payment PENDING nhưng order không còn PENDING", async () => {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PAYMENT_FAILED" },
      });

      await expect(service.pay({ paymentId, success: true })).rejects.toThrow(
        ConflictException,
      );

      // rollback: payment vẫn PENDING
      const payment = await prisma.payment.findUniqueOrThrow({
        where: { id: paymentId },
      });
      expect(payment.status).toBe("PENDING");
    });
  });

  describe("create()", () => {
    it("trả paymentId và amount khi key hợp lệ", async () => {
      const result = await service.create({ orderId, idempotencyKey });

      expect(result.paymentId).toBe(paymentId);
      expect(Number(result.amount)).toBe(90000);
    });

    it("ném NotFoundException khi key không tồn tại", async () => {
      await expect(
        service.create({ orderId, idempotencyKey: randomUUID() }),
      ).rejects.toThrow(NotFoundException);
    });

    it("ném ConflictException khi key thuộc đơn khác", async () => {
      await expect(
        service.create({ orderId: randomUUID(), idempotencyKey }),
      ).rejects.toThrow(ConflictException);
    });

    it("ném ConflictException khi đơn đã thanh toán", async () => {
      await service.pay({ paymentId, success: true });

      await expect(service.create({ orderId, idempotencyKey })).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
