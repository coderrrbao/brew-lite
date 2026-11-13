// import "dotenv/config";
// import { execSync } from "node:child_process";
// import { randomUUID } from "node:crypto";
// import { ConflictException, NotFoundException } from "@nestjs/common";
// import { Client } from "pg";
// import { PrismaService } from "../prisma/prisma.service";
// import { PaymentsService } from "./payments.service";

// async function ensureTestDatabase(databaseUrl: string, databaseName: string) {
//   // Kết nối vào DB "postgres" (luôn tồn tại) để tạo DB test
//   const adminUrl = new URL(databaseUrl);
//   adminUrl.pathname = "/postgres";
//   adminUrl.search = "";

//   const admin = new Client({ connectionString: adminUrl.toString() });
//   await admin.connect();
//   try {
//     const { rowCount } = await admin.query(
//       "SELECT 1 FROM pg_database WHERE datname = $1",
//       [databaseName],
//     );
//     if (!rowCount) {
//       await admin.query(
//         `CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`,
//       );
//     }
//   } finally {
//     await admin.end();
//   }

//   // Đưa schema vào DB test
//   if (!process.env.CI) {
//     execSync("pnpm prisma migrate deploy", {
//       stdio: "inherit",
//       env: { ...process.env, DATABASE_URL: databaseUrl },
//     });
//   }
// }

// describe("PaymentsService (PostgreSQL integration)", () => {
//   let prisma: PrismaService;
//   let service: PaymentsService;
//   let userId: string;
//   let orderId: string;

//   beforeAll(async () => {
//     const databaseUrl = process.env.DATABASE_URL;
//     if (!databaseUrl) throw new Error("DATABASE_URL is required for DB tests");
//     const databaseName = decodeURIComponent(
//       new URL(databaseUrl).pathname.slice(1),
//     );
//     if (!/(^|[_-])test$/i.test(databaseName)) {
//       throw new Error(
//         `Refusing to run DB tests against non-test database "${databaseName}"`,
//       );
//     }

//     await ensureTestDatabase(databaseUrl, databaseName);

//     prisma = new PrismaService();
//     await prisma.$connect();
//     service = new PaymentsService(prisma);
//   }, 60_000);

//   beforeEach(async () => {
//     const user = await prisma.user.create({
//       data: {
//         email: `${randomUUID()}@payments.integration.test`,
//         passwordHash: "not-used-by-test",
//       },
//     });
//     userId = user.id;

//     const order = await prisma.order.create({
//       data: { userId, total: 90000, status: "PENDING" },
//     });
//     orderId = order.id;
//   });

//   afterEach(async () => {
//     if (!prisma || !orderId) return;
//     await prisma.payment.deleteMany({ where: { orderId } });
//     await prisma.orderItem.deleteMany({ where: { orderId } });
//     await prisma.order.delete({ where: { id: orderId } });
//     await prisma.user.delete({ where: { id: userId } });
//   });

//   afterAll(async () => {
//     await prisma?.$disconnect();
//   });

//   const createPayment = (
//     key = randomUUID(),
//     targetOrderId = orderId,
//     method = "mock",
//   ) =>
//     service.create({
//       orderId: targetOrderId,
//       method: method,
//       idempotencyKey: key,
//     });

//   const getOrder = () =>
//     prisma.order.findUniqueOrThrow({
//       where: { id: orderId },
//       include: { payments: true },
//     });

//   const countPayments = () => prisma.payment.count({ where: { orderId } });

//   it("create() saves a PENDING payment and pay() changes the order to PAID", async () => {
//     const idempotencyKey = randomUUID();
//     await createPayment(idempotencyKey);

//     const pending = await getOrder();
//     expect(pending.status).toBe("PENDING");
//     expect(pending.payments).toHaveLength(1);
//     expect(pending.payments[0].status).toBe("PENDING");

//     const result = await service.pay({ idempotencyKey, success: true });

//     const fromDatabase = await getOrder();
//     expect(result.order.status).toBe("PAID");
//     expect(fromDatabase.status).toBe("PAID");
//     expect(fromDatabase.payments).toHaveLength(1);
//     expect(fromDatabase.payments[0]).toMatchObject({
//       orderId,
//       idempotencyKey,
//       amount: 90000,
//       method: "mock",
//       status: "PAYMENT_SUCCESS",
//     });
//   });

//   it("pay() changes the order to PAYMENT_FAILED when payment fails", async () => {
//     const idempotencyKey = randomUUID();
//     await createPayment(idempotencyKey);

//     const result = await service.pay({ idempotencyKey, success: false });

//     const fromDatabase = await getOrder();
//     expect(result.order.status).toBe("PAYMENT_FAILED");
//     expect(fromDatabase.status).toBe("PAYMENT_FAILED");
//     expect(fromDatabase.payments[0].status).toBe("PAYMENT_FAILED");
//   });

//   it("pay() replays the PAID result for a repeated key (no error, no new payment)", async () => {
//     const idempotencyKey = randomUUID();
//     await createPayment(idempotencyKey);
//     const first = await service.pay({ idempotencyKey, success: true });

//     const second = await service.pay({ idempotencyKey, success: true });

//     expect(second.payment.id).toBe(first.payment.id);
//     expect(second.payment.status).toBe("PAYMENT_SUCCESS");
//     expect(second.order.status).toBe("PAID");
//     expect(await countPayments()).toBe(1);
//   });

//   it("pay() replays a FAILED result for the same key; a new key can retry", async () => {
//     const failedKey = randomUUID();
//     await createPayment(failedKey);
//     await service.pay({ idempotencyKey: failedKey, success: false });

//     // key cũ: vẫn là kết quả thất bại cũ, kể cả khi lần này truyền success: true
//     const again = await service.pay({
//       idempotencyKey: failedKey,
//       success: true,
//     });
//     expect(again.payment.status).toBe("PAYMENT_FAILED");
//     expect(again.order.status).toBe("PAYMENT_FAILED");

//     // key mới: thử lại được
//     const retryKey = randomUUID();
//     await createPayment(retryKey);
//     const retry = await service.pay({
//       idempotencyKey: retryKey,
//       success: true,
//     });

//     expect(retry.order.status).toBe("PAID");
//     expect(await countPayments()).toBe(2);
//   });

//   it("pay() throws NotFoundException for an unknown idempotency key", async () => {
//     await expect(
//       service.pay({ idempotencyKey: randomUUID(), success: true }),
//     ).rejects.toThrow(NotFoundException);
//   });

//   it("create() with a repeated key returns the same pending payment", async () => {
//     const key = randomUUID();
//     const first = await createPayment(key);
//     const second = await createPayment(key);

//     expect(second.payment.id).toBe(first.payment.id);
//     expect(second.payment.status).toBe("PENDING");
//     expect(await countPayments()).toBe(1);
//   });

//   it("create() with a key that already succeeded replays the PAID result", async () => {
//     const key = randomUUID();
//     await createPayment(key);
//     await service.pay({ idempotencyKey: key, success: true });

//     const again = await createPayment(key);

//     expect(again.payment.status).toBe("PAYMENT_SUCCESS");
//     expect(again.orderId).toBe(orderId);
//     expect((await getOrder()).status).toBe("PAID");
//     expect(await countPayments()).toBe(1);
//   });

//   it("create() rejects a new key on an order that is already PAID", async () => {
//     const key = randomUUID();
//     await createPayment(key);
//     await service.pay({ idempotencyKey: key, success: true });

//     await expect(createPayment(randomUUID())).rejects.toThrow(
//       ConflictException,
//     );
//     expect(await countPayments()).toBe(1);
//   });

//   it("create() throws NotFoundException for a missing order", async () => {
//     await expect(createPayment(randomUUID(), randomUUID())).rejects.toThrow(
//       NotFoundException,
//     );
//   });

//   it("create() rejects a key that belongs to another order", async () => {
//     const key = randomUUID();
//     await createPayment(key);

//     const otherOrder = await prisma.order.create({
//       data: { userId, total: 50000, status: "PENDING" },
//     });
//     try {
//       await expect(createPayment(key, otherOrder.id)).rejects.toThrow(
//         ConflictException,
//       );
//     } finally {
//       await prisma.order.delete({ where: { id: otherOrder.id } });
//     }
//   });

//   it("concurrent create() with the same key creates only one payment (unique constraint)", async () => {
//     const key = randomUUID();
//     const [a, b] = await Promise.all([createPayment(key), createPayment(key)]);

//     expect(a.payment.id).toBe(b.payment.id);
//     expect(await countPayments()).toBe(1);
//   });

//   it("concurrent pay() with the same key: one payment, both get the PAID result", async () => {
//     const idempotencyKey = randomUUID();
//     await createPayment(idempotencyKey);

//     const [a, b] = await Promise.all([
//       service.pay({ idempotencyKey, success: true }),
//       service.pay({ idempotencyKey, success: true }),
//     ]);

//     expect(a.payment.id).toBe(b.payment.id);
//     expect(a.payment.status).toBe("PAYMENT_SUCCESS");
//     expect(b.payment.status).toBe("PAYMENT_SUCCESS");
//     expect(await countPayments()).toBe(1);
//     expect((await getOrder()).status).toBe("PAID");
//   });
// });
