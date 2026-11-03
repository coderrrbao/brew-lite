import { Injectable, NotFoundException } from '@nestjs/common';
import { mockProducts, Product } from './products.mock';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma : PrismaService){}

  async findAll(){
    return await this.prisma.product.findMany();
  }

  findOne(id: string) {
    const product = mockProducts.find((p) => p.id === id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
