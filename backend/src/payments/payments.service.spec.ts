/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService (PostgreSQL integration)', () => {
  let prisma: PrismaService;
  let service: PaymentsService;
  let userId: string;
  let orderId: string;

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is required for DB tests');
    const databaseName = decodeURIComponent(new URL(databaseUrl).pathname.slice(1));
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
    userId = '';
    orderId = '';
    const user = await prisma.user.create({
      data: {
        email: `${randomUUID()}@payments.integration.test`,
        passwordHash: 'not-used-by-test',
      },
    });
    userId = user.id;

    const order = await prisma.order.create({
      data: { userId, total: 90000 },
    });
    orderId = order.id;
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

  it.todo('pay() saves the payment and changes a PENDING order to PAID');
  /*
  it('pay() saves the payment and changes a PENDING order to PAID', async () => {
    const idempotencyKey = randomUUID();

    const result = await service.pay({
      orderId,
      idempotencyKey,
      success: true,
    });

    const fromDatabase = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { payments: true },
    });
    expect(result.order.status).toBe('PAID');
    expect(fromDatabase.status).toBe('PAID');
    expect(fromDatabase.payments).toHaveLength(1);
    expect(fromDatabase.payments[0]).toMatchObject({
      orderId,
      idempotencyKey,
      amount: 90000,
      method: 'mock',
    });
  });
  */

  it.todo('pay() changes the order to PAYMENT_FAILED when payment fails');
  /*
  it('pay() changes the order to PAYMENT_FAILED when payment fails', async () => {
    const result = await service.pay({
      orderId,
      idempotencyKey: randomUUID(),
      success: false,
    });

    const fromDatabase = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
    });
    expect(result.order.status).toBe('PAYMENT_FAILED');
    expect(fromDatabase.status).toBe('PAYMENT_FAILED');
  });
  */

  it.todo('pay() rejects a repeated idempotency key');
  /*
  it('pay() rejects a repeated idempotency key', async () => {
    const request = {
      orderId,
      idempotencyKey: randomUUID(),
      success: true,
    };
    await service.pay(request);

    await expect(service.pay(request)).rejects.toThrow(ConflictException);
    expect(
      await prisma.payment.count({ where: { orderId } }),
    ).toBe(1);
  });
  */
});
