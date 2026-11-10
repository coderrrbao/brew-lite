/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

describe('OrdersService (PostgreSQL integration)', () => {
  let prisma: PrismaService;
  let service: OrdersService;
  let userId: string;
  let productId: string;
  let orderIds: string[];

  const createFixture = async () => {
    const suffix = randomUUID();
    const user = await prisma.user.create({
      data: {
        email: `${suffix}@orders.integration.test`,
        passwordHash: 'not-used-by-test',
      },
    });
    userId = user.id;

    const product = await prisma.product.create({
      data: {
        id: `test-${suffix}`,
        name: 'Integration test coffee',
        description: 'Product fixture',
        price: 45000,
        imageUrl: 'https://example.com/coffee.jpg',
        category: 'hot',
      },
    });
    productId = product.id;

    const dto: CreateOrderDto = {
      userId,
      total: 90000,
      items: [
        {
          id: randomUUID(),
          productId,
          name: product.name,
          imageUrl: product.imageUrl,
          size: 'M',
          toppings: ['oat milk'],
          qty: 2,
          unitPrice: 45000,
          lineTotal: 90000,
        },
      ],
    };
    return dto;
  };

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
    service = new OrdersService(prisma);
  });

  beforeEach(() => {
    userId = '';
    productId = '';
    orderIds = [];
  });

  afterEach(async () => {
    if (userId) {
      for (const orderId of orderIds) {
        await prisma.payment.deleteMany({ where: { orderId } });
        await prisma.order.delete({ where: { id: orderId } });
      }
      await prisma.user.delete({ where: { id: userId } });
    }
    if (productId) {
      await prisma.product.delete({ where: { id: productId } });
    }
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it.todo('create() persists a PENDING order and its OrderItems');
  /*
  it('create() persists a PENDING order and its OrderItems', async () => {
    const dto = await createFixture();

    const created = await service.create(dto);
    orderIds.push(created.id);
    const fromDatabase = await prisma.order.findUnique({
      where: { id: created.id },
      include: { items: true, payments: true },
    });

    expect(fromDatabase).toMatchObject({
      userId,
      total: 90000,
      status: 'PENDING',
      items: [
        {
          orderId: created.id,
          productId,
          qty: 2,
          unitPrice: 45000,
          lineTotal: 90000,
        },
      ],
      payments: [],
    });
    expect(fromDatabase.status).toBe("PREPARING");
  });
  */

  it.todo('findMine() returns orders read from PostgreSQL');
  /*
  it('findMine() returns orders read from PostgreSQL', async () => {
    const dto = await createFixture();
    const created = await service.create(dto);
    orderIds.push(created.id);

    const results = await service.findMine();

    expect(results.find((order) => order.id === created.id)).toMatchObject({
      id: created.id,
      status: 'PENDING',
      items: [expect.objectContaining({ orderId: created.id })],
    });
  });
  */

  it.todo('updateStatus() changes a paid order to the next staff status');
  /*
  it('updateStatus() changes a paid order to the next staff status', async () => {
    const dto = await createFixture();
    const created = await service.create(dto);
    orderIds.push(created.id);
    await prisma.order.update({
      where: { id: created.id },
      data: { status: 'PAID' },
    });

    await service.updateStatus(created.id, 'PREPARING');

    const fromDatabase = await prisma.order.findUniqueOrThrow({
      where: { id: created.id },
      include: { items: true, payments: true },
    });
    expect(fromDatabase.status).toBe('PREPARING');
  });
  */

  it.todo('updateStatus() rejects invalid status transitions');
  /*
  it('updateStatus() rejects invalid status transitions', async () => {
    const dto = await createFixture();
    const created = await service.create(dto);
    orderIds.push(created.id);

    await expect(
      service.updateStatus(created.id, 'PREPARING'),
    ).rejects.toThrow(ConflictException);
  });
  */

  it.todo('updateStatus() throws when the order does not exist');
  /*
  it('updateStatus() throws when the order does not exist', async () => {
    await expect(
      service.updateStatus(`missing-${randomUUID()}`, 'PAID'),
    ).rejects.toThrow(NotFoundException);
  });
  */
});
