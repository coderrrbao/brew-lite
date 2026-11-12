import 'dotenv/config';
import { ConflictException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaClient, Prisma } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL_TEST or DATABASE_URL must be configured');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const PRODUCT_ID = 'espresso-test';

describe('ProductsService.reserveStock (integration, DB thật)', () => {
  let service: ProductsService;

  beforeAll(async () => {
    await prisma.$connect();
    service = new ProductsService(prisma as never);
  });

  beforeEach(async () => {
    await prisma.product.deleteMany({ where: { id: PRODUCT_ID } });
    await prisma.product.create({
      data: {
        id: PRODUCT_ID,
        name: 'Espresso',
        description: 'Test espresso',
        price: 35000,
        imageUrl: 'espresso.png',
        category: 'hot',
        stock: 5,
        version: 0,
      },
    });
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { id: PRODUCT_ID } });
    await prisma.$disconnect();
  });


  const placeOrder = async (qty = 1) => {
    try {
      await prisma.$transaction((tx: Prisma.TransactionClient) =>
        service.reserveStock(tx as never, [{ productId: PRODUCT_ID, qty }]),
      );
      return 'ok' as const;
    } catch (e) {
      if (e instanceof ConflictException) return 'conflict' as const;
      throw e;
    }
  };

  it('10 khách đặt cùng lúc, tồn kho 5 → không bán vượt, stock không âm', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => placeOrder(1)),
    );

    const success = results.filter((r) => r === 'ok').length;

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: PRODUCT_ID },
    });

    expect(success).toBeLessThanOrEqual(5);
    expect(product.stock).toBeGreaterThanOrEqual(0);
    expect(product.stock).toBe(5 - success);
    expect(product.version).toBe(success);
  });

  it('từ chối đặt 2 ly khi chỉ còn 1', async () => {
    await prisma.product.update({
      where: { id: PRODUCT_ID },
      data: { stock: 1 },
    });

    await expect(placeOrder(2)).resolves.toBe('conflict');

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: PRODUCT_ID },
    });
    expect(product.stock).toBe(1);
  });
});