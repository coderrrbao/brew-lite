import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Order and payment API E2E (PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let baseUrl: string;
  let userId: string;
  let productId: string;
  let orderId: string;
  let staffToken: string;

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is required for E2E tests');
    const databaseName = decodeURIComponent(new URL(databaseUrl).pathname.slice(1));
    if (!/(^|[_-])test$/i.test(databaseName)) {
      throw new Error(
        `Refusing to run E2E tests against non-test database "${databaseName}"`,
      );
    }

    process.env.JWT_SECRET ??= 'e2e-test-secret-not-for-production';
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1');

    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') {
      throw new Error('Could not determine E2E server port');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
    prisma = app.get(PrismaService);
    staffToken = await app.get(JwtService).signAsync({
      sub: 'integration-staff',
      email: 'staff@integration.test',
      role: 'STAFF',
    });
  });

  beforeEach(async () => {
    userId = '';
    productId = '';
    orderId = '';
    const suffix = randomUUID();
    const user = await prisma.user.create({
      data: {
        email: `${suffix}@orders.e2e.test`,
        passwordHash: 'not-used-by-test',
        role: 'STAFF',
      },
    });
    userId = user.id;

    const product = await prisma.product.create({
      data: {
        id: `e2e-${suffix}`,
        name: 'E2E test coffee',
        description: 'Product fixture for the order flow',
        price: 45000,
        imageUrl: 'https://example.com/e2e-coffee.jpg',
        category: 'hot',
        active: true,
      },
    });
    productId = product.id;
  });

  afterEach(async () => {
    if (orderId) {
      await prisma.payment.deleteMany({ where: { orderId } });
      await prisma.order.delete({ where: { id: orderId } });
    }
    if (userId) await prisma.user.delete({ where: { id: userId } });
    if (productId) await prisma.product.delete({ where: { id: productId } });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('browses products, orders, pays, and lets staff advance order status', async () => {
    const menuResponse = await fetch(`${baseUrl}/products`);
    expect(menuResponse.status).toBe(200);
    const menu = (await menuResponse.json()) as Array<{ id: string }>;
    expect(menu.some((product) => product.id === productId)).toBe(true);

    const productResponse = await fetch(`${baseUrl}/products/${productId}`);
    expect(productResponse.status).toBe(200);
    expect(await productResponse.json()).toMatchObject({
      id: productId,
      name: 'E2E test coffee',
      price: 45000,
    });

    const orderResponse = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        total: 90000,
        items: [
          {
            id: randomUUID(),
            productId,
            name: 'E2E test coffee',
            imageUrl: 'https://example.com/e2e-coffee.jpg',
            size: 'M',
            toppings: [],
            qty: 2,
            unitPrice: 45000,
            lineTotal: 90000,
          },
        ],
      }),
    });
    expect(orderResponse.status).toBe(201);
    const createdOrder = (await orderResponse.json()) as {
      id: string;
      status: string;
    };
    orderId = createdOrder.id;
    expect(createdOrder.status).toBe('PENDING');

    const paymentResponse = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        idempotencyKey: randomUUID(),
        success: true,
      }),
    });
    expect(paymentResponse.status).toBe(200);

    const ordersResponse = await fetch(`${baseUrl}/orders/me`);
    expect(ordersResponse.status).toBe(200);
    const orders = (await ordersResponse.json()) as Array<{
      id: string;
      status: string;
      items: Array<{ orderId: string }>;
      payments: Array<{ orderId: string }>;
    }>;
    expect(orders).toContainEqual(
      expect.objectContaining({
        id: orderId,
        status: 'PAID',
        items: [expect.objectContaining({ orderId })],
        payments: [expect.objectContaining({ orderId })],
      }),
    );

    const unauthorizedUpdate = await fetch(
      `${baseUrl}/orders/${orderId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PREPARING' }),
      },
    );
    expect(unauthorizedUpdate.status).toBe(401);

    const staffUpdate = await fetch(`${baseUrl}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${staffToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'PREPARING' }),
    });
    expect(staffUpdate.status).toBe(200);
    expect(await staffUpdate.json()).toMatchObject({
      id: orderId,
      status: 'PREPARING',
    });

    const updatedOrdersResponse = await fetch(`${baseUrl}/orders/me`);
    const updatedOrders = (await updatedOrdersResponse.json()) as Array<{
      id: string;
      status: string;
    }>;
    expect(updatedOrders).toContainEqual(
      expect.objectContaining({ id: orderId, status: 'PREPARING' }),
    );
  });
});
