describe('ProductsService', () => {
  it.todo('từ chối đặt vượt quá tồn kho khi phiên bản sản phẩm đã thay đổi');
  /*
  import { ConflictException } from '@nestjs/common';
  import { ProductsService } from './products.service';

  it('từ chối đặt vượt quá tồn kho khi phiên bản sản phẩm đã thay đổi', async () => {
    const transaction = {
      product: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'espresso',
          stock: 1,
          version: 3,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const service = new ProductsService({} as never);

    await expect(
      service.reserveStock(transaction as never, [
        { productId: 'espresso', qty: 2 },
      ]),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'espresso',
        stock: { gte: 2 },
        version: 3,
      },
      data: {
        stock: { decrement: 2 },
        version: { increment: 1 },
      },
    });
  });
  */
});
