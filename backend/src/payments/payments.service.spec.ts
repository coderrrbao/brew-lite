import "dotenv/config";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { Client } from "pg";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentsService } from "./payments.service";
import { UsersService } from "../users/users.service";
import { ProductsService } from "../products/products.service";
import { PromotionsService } from "../promotions/promotions.service";

async function ensureTestDatabase(databaseUrl: string, databaseName: string) {
  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";
  adminUrl.search = "";

  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName],
    );
    if (!rowCount) {
      await admin.query(
        `CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`,
      );
    }
  } finally {
    await admin.end();
  }

  if (!process.env.CI) {
    execSync("pnpm prisma migrate deploy", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
  }
}

describe("PaymentsService (PostgreSQL integration)", () => {
  let prisma: PrismaService;
  let usersService: UsersService;
  let productsService: ProductsService;
  let promotionsService: PromotionsService;
  let service: PaymentsService;
  let userId: string;
  let orderId: string;
  let productIds: string[] = [];
  let promotionCodes: string[] = [];

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required for DB tests");
    const databaseName = decodeURIComponent(
      new URL(databaseUrl).pathname.slice(1),
    );
    // if (!/(^|[_-])test$/i.test(databaseName)) {
    //   throw new Error(
    //     `Refusing to run DB tests against non-test database "${databaseName}"`,
    //   );
    // }

    await ensureTestDatabase(databaseUrl, databaseName);

    prisma = new PrismaService();
    await prisma.$connect();
    usersService = new UsersService(prisma);
    productsService = new ProductsService(prisma);
    promotionsService = new PromotionsService(prisma);
    // Thứ tự constructor: (prisma, productsService, usersService)
    service = new PaymentsService(
      prisma,
      productsService,
      usersService,
      promotionsService,
    );
  }, 60_000);

  beforeEach(async () => {
    productIds = [];
    promotionCodes = [];

    const user = await prisma.user.create({
      data: {
        email: `${randomUUID()}@payments.integration.test`,
        passwordHash: "not-used-by-test",
      },
    });
    userId = user.id;

    const order = await prisma.order.create({
      data: { userId, total: 90000, status: "PENDING", subTotal: 90000 },
    });
    orderId = order.id;
  });

  afterEach(async () => {
    if (!prisma || !orderId) return;
    await prisma.payment.deleteMany({ where: { orderId } });
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });
    if (productIds.length) {
      await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    }
    if (promotionCodes.length) {
      await prisma.promotion.deleteMany({
        where: { code: { in: promotionCodes } },
      });
    }
    await prisma.user.delete({ where: { id: userId } });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  // ---------- helpers ----------
  const createPayment = (
    key = randomUUID(),
    targetOrderId = orderId,
    method = "mock",
  ) =>
    service.create({
      orderId: targetOrderId,
      method,
      idempotencyKey: key,
    });

  const getOrder = () =>
    prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { payments: true },
    });

  const getUser = () =>
    prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const getProduct = (id: string) =>
    prisma.product.findUniqueOrThrow({ where: { id } });

  const countPayments = () => prisma.payment.count({ where: { orderId } });

  const createProduct = async (stock: number) => {
    const product = await prisma.product.create({
      data: {
        id: randomUUID(),
        name: `test-${randomUUID()}`,
        description: "test product",
        imageUrl: "https://example.com/test.png",
        category: "hot",
        price: 30000,
        stock,
      },
    });
    productIds.push(product.id);
    return product;
  };

  const addItem = (productId: string | null, qty: number) =>
    prisma.orderItem.create({
      data: {
        orderId,
        productId,
        name: "test item",
        imageUrl: "https://example.com/test.png",
        size: "M",
        qty,
        unitPrice: 30000,
        lineTotal: 30000 * qty,
      },
    });

  const applyPromotion = async (pointCost: number) => {
    const code = `TEST-${randomUUID()}`;
    await prisma.promotion.create({
      data: {
        code,
        description: "test promotion",
        type: "FIXED_AMOUNT",
        value: 10000,
        pointCost,
      },
    });
    promotionCodes.push(code);
    await prisma.order.update({
      where: { id: orderId },
      data: { promotionCode: code },
    });
  };

  // 1. LUỒNG THANH TOÁN CƠ BẢN
  it("create() lưu bản ghi giao dịch và pay() chuyển trạng thái đơn hàng sang PAID", async () => {
    const idempotencyKey = randomUUID();
    await createPayment(idempotencyKey);

    const pending = await getOrder();
    expect(pending.status).toBe("PENDING");
    expect(pending.payments).toHaveLength(1);

    const result = await service.pay({ idempotencyKey, success: true });

    const fromDatabase = await getOrder();
    expect(result.order.status).toBe("PAID");
    expect(result.payment.status).toBe("PAID");
    expect(fromDatabase.status).toBe("PAID");
    expect(fromDatabase.payments).toHaveLength(1);
    expect(fromDatabase.payments[0]).toMatchObject({
      orderId,
      idempotencyKey,
      amount: 90000,
      method: "mock",
      status: "PAID",
    });
  });

  it("pay() chuyển trạng thái đơn hàng sang PAYMENT_FAILED và payment sang FAILED khi thanh toán thất bại", async () => {
    const idempotencyKey = randomUUID();
    await createPayment(idempotencyKey);

    const result = await service.pay({ idempotencyKey, success: false });

    const fromDatabase = await getOrder();
    expect(result.order.status).toBe("PAYMENT_FAILED");
    expect(result.payment.status).toBe("FAILED");
    expect(fromDatabase.status).toBe("PAYMENT_FAILED");
    expect(fromDatabase.payments).toHaveLength(1);
    expect(fromDatabase.payments[0].status).toBe("FAILED");
  });

  // 2. KHO HÀNG & ĐIỂM THƯỞNG
  it("pay() thành công trừ kho, tăng version sản phẩm và cộng điểm tích lũy cho user", async () => {
    const product = await createProduct(10);
    await addItem(product.id, 3);
    const idempotencyKey = randomUUID();
    await createPayment(idempotencyKey);

    const pointsBefore = (await getUser()).loyaltyPoints;
    await service.pay({ idempotencyKey, success: true });

    const after = await getProduct(product.id);
    expect(after.stock).toBe(7);
    expect(after.version).toBe(product.version + 1);

    const pointsAfter = (await getUser()).loyaltyPoints;
    expect(pointsAfter - pointsBefore).toBe(
      usersService.calculatePoints(90000),
    );
  });

  it("pay() gộp nhiều dòng cùng sản phẩm khi trừ kho", async () => {
    const product = await createProduct(10);
    await addItem(product.id, 2);
    await addItem(product.id, 3);
    const idempotencyKey = randomUUID();
    await createPayment(idempotencyKey);

    await service.pay({ idempotencyKey, success: true });

    expect((await getProduct(product.id)).stock).toBe(5);
  });

  it("pay() thành công bỏ qua dòng hàng không còn productId (sản phẩm đã bị xóa)", async () => {
    await addItem(null, 5);
    const idempotencyKey = randomUUID();
    await createPayment(idempotencyKey);

    const result = await service.pay({ idempotencyKey, success: true });

    expect(result.order.status).toBe("PAID");
  });

  it("pay() thất bại (success: false) không trừ kho và không cộng điểm", async () => {
    const product = await createProduct(10);
    await addItem(product.id, 3);
    const idempotencyKey = randomUUID();
    await createPayment(idempotencyKey);

    const pointsBefore = (await getUser()).loyaltyPoints;
    await service.pay({ idempotencyKey, success: false });

    expect((await getProduct(product.id)).stock).toBe(10);
    expect((await getUser()).loyaltyPoints).toBe(pointsBefore);
  });

  it("pay() ném ConflictException khi không đủ hàng và rollback toàn bộ (đơn vẫn PENDING, không cộng điểm)", async () => {
    const product = await createProduct(2);
    await addItem(product.id, 5);
    const idempotencyKey = randomUUID();
    await createPayment(idempotencyKey);

    const pointsBefore = (await getUser()).loyaltyPoints;
    await expect(
      service.pay({ idempotencyKey, success: true }),
    ).rejects.toThrow(ConflictException);

    const order = await getOrder();
    expect(order.status).toBe("PENDING");
    expect(order.payments[0].status).not.toBe("PAID");
    expect((await getProduct(product.id)).stock).toBe(2);
    expect((await getUser()).loyaltyPoints).toBe(pointsBefore);
  });

  it("reserveStock() ném NotFoundException khi sản phẩm không tồn tại", async () => {
    await expect(
      prisma.$transaction((tx) =>
        productsService.reserveStock(tx, [{ productId: randomUUID(), qty: 1 }]),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it("pay() trừ điểm đổi khuyến mãi, cộng điểm tích lũy và ghi pointsSpent vào đơn", async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { loyaltyPoints: 500 },
    });
    await applyPromotion(100);
    const idempotencyKey = randomUUID();
    await createPayment(idempotencyKey);

    const result = await service.pay({ idempotencyKey, success: true });

    expect(result.order.pointsSpent).toBe(100);
    expect((await getUser()).loyaltyPoints).toBe(
      500 + usersService.calculatePoints(90000) - 100,
    );
  });

  it("pay() ném ConflictException khi user không đủ điểm và rollback cả kho", async () => {
    const product = await createProduct(10);
    await addItem(product.id, 3);
    await prisma.user.update({
      where: { id: userId },
      data: { loyaltyPoints: 50 },
    });
    await applyPromotion(100);
    const idempotencyKey = randomUUID();
    await createPayment(idempotencyKey);

    await expect(
      service.pay({ idempotencyKey, success: true }),
    ).rejects.toThrow(ConflictException);

    expect((await getOrder()).status).toBe("PENDING");
    expect((await getUser()).loyaltyPoints).toBe(50);
    expect((await getProduct(product.id)).stock).toBe(10);
  });

  // 3. TÍNH BẤT BIẾN (IDEMPOTENCY) & RETRY
  it("pay() trả lại kết quả PAID khi gọi lại cùng một idempotencyKey (không trừ kho/điểm lần 2)", async () => {
    const product = await createProduct(10);
    await addItem(product.id, 3);
    const idempotencyKey = randomUUID();
    await createPayment(idempotencyKey);
    const first = await service.pay({ idempotencyKey, success: true });
    const pointsAfterFirst = (await getUser()).loyaltyPoints;

    const second = await service.pay({ idempotencyKey, success: true });

    expect(second.payment.id).toBe(first.payment.id);
    expect(second.order.status).toBe("PAID");
    expect(second.message).toBe("Đơn hàng đã thanh toán");
    expect(await countPayments()).toBe(1);
    expect((await getProduct(product.id)).stock).toBe(7);
    expect((await getUser()).loyaltyPoints).toBe(pointsAfterFirst);
  });

  it("cho phép tạo idempotencyKey mới để thử lại (retry) sau khi đơn hàng PAYMENT_FAILED", async () => {
    const failedKey = randomUUID();
    await createPayment(failedKey);
    const failed = await service.pay({
      idempotencyKey: failedKey,
      success: false,
    });
    expect(failed.order.status).toBe("PAYMENT_FAILED");
    expect(failed.payment.status).toBe("FAILED");

    // Key mới: thử lại thanh toán cho đơn PAYMENT_FAILED
    const retryKey = randomUUID();
    await createPayment(retryKey);
    const retry = await service.pay({
      idempotencyKey: retryKey,
      success: true,
    });

    expect(retry.order.status).toBe("PAID");
    expect(retry.payment.status).toBe("PAID");
    expect(await countPayments()).toBe(2);
  });

  it("pay() ném lỗi NotFoundException khi không tìm thấy idempotencyKey", async () => {
    await expect(
      service.pay({ idempotencyKey: randomUUID(), success: true }),
    ).rejects.toThrow(NotFoundException);
  });

  it("create() với idempotencyKey bị trùng trả về cùng bản ghi giao dịch", async () => {
    const key = randomUUID();
    const first = await createPayment(key);
    const second = await createPayment(key);

    expect(second.payment.id).toBe(first.payment.id);
    expect((await getOrder()).status).toBe("PENDING");
    expect(await countPayments()).toBe(1);
  });

  it("create() từ chối (ConflictException) nếu đơn hàng đã ở trạng thái PAID", async () => {
    const key = randomUUID();
    await createPayment(key);
    await service.pay({ idempotencyKey: key, success: true });

    await expect(createPayment(randomUUID())).rejects.toThrow(
      ConflictException,
    );
    expect(await countPayments()).toBe(1);
  });

  it("create() ném lỗi NotFoundException khi không tìm thấy đơn hàng", async () => {
    await expect(createPayment(randomUUID(), randomUUID())).rejects.toThrow(
      NotFoundException,
    );
  });

  it("create() từ chối (ConflictException) idempotencyKey thuộc về đơn hàng khác", async () => {
    const key = randomUUID();
    await createPayment(key);

    const otherOrder = await prisma.order.create({
      data: { userId, total: 50000, status: "PENDING", subTotal: 50000 },
    });
    try {
      await expect(createPayment(key, otherOrder.id)).rejects.toThrow(
        ConflictException,
      );
    } finally {
      await prisma.order.delete({ where: { id: otherOrder.id } });
    }
  });

  // 4. XỬ LÝ ĐỒNG THỜI (CONCURRENCY)
  it("gọi đồng thời create() với cùng idempotencyKey chỉ tạo duy nhất 1 payment (unique constraint)", async () => {
    const key = randomUUID();
    const [a, b] = await Promise.all([createPayment(key), createPayment(key)]);

    expect(a.payment.id).toBe(b.payment.id);
    expect(await countPayments()).toBe(1);
  });

  it("gọi đồng thời pay() với cùng idempotencyKey: chỉ xử lý 1 lần, request thua race nhận Conflict hoặc PAID, kho và điểm chỉ đổi 1 lần", async () => {
    const product = await createProduct(10);
    await addItem(product.id, 3);
    const idempotencyKey = randomUUID();
    await createPayment(idempotencyKey);
    const pointsBefore = (await getUser()).loyaltyPoints;

    const results = await Promise.allSettled([
      service.pay({ idempotencyKey, success: true }),
      service.pay({ idempotencyKey, success: true }),
    ]);

    const fulfilled = results.filter(
      (
        r,
      ): r is PromiseFulfilledResult<Awaited<ReturnType<typeof service.pay>>> =>
        r.status === "fulfilled",
    );
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );

    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    for (const r of rejected) {
      expect(r.reason).toBeInstanceOf(ConflictException);
    }
    for (const r of fulfilled) {
      expect(r.value.order.status).toBe("PAID");
    }

    expect(await countPayments()).toBe(1);
    expect((await getOrder()).status).toBe("PAID");
    expect((await getProduct(product.id)).stock).toBe(7);
    expect((await getUser()).loyaltyPoints - pointsBefore).toBe(
      usersService.calculatePoints(90000),
    );
  });
});
