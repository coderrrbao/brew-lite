import { Injectable, NotFoundException } from '@nestjs/common';
import { mockProducts, Product } from './products.mock';

@Injectable()
export class ProductsService {
  findAll(): Product[] {
    return mockProducts;
  }

  findOne(id: string): Product {
    const product = mockProducts.find((p) => p.id === id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
