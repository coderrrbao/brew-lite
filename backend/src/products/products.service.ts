import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.product.findMany();
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) return null;
    return product;
  }

  async reserveStock(
    transaction: Prisma.TransactionClient,
    items: ReadonlyArray<{ productId: string; qty: number }>,
  ): Promise<void> {
    const quantities = new Map<string, number>();
    for (const item of items) {
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.qty,
      );
    }

    for (const [productId, quantity] of quantities) {
      const product = await transaction.product.findUnique({
        where: { id: productId },
        select: { id: true, stock: true, version: true },
      });
      if (!product) throw new NotFoundException('Product not found');

      const updated = await transaction.product.updateMany({
        where: {
          id: product.id,
          stock: { gte: quantity },
          version: product.version,
        },
        data: {
          stock: { decrement: quantity },
          version: { increment: 1 },
        },
      });
      if (updated.count === 0) {
        throw new ConflictException(
          `Insufficient stock or concurrent update for product ${productId}`,
        );
      }
    }
  }
}
