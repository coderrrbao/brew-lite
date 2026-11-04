import { Injectable, NotFoundException } from "@nestjs/common";
import { mockProducts, Product } from "./products.mock";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll() {
    return await this.prisma.product.findMany();
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }
}
