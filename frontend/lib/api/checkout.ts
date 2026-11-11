import type { CartItem, Order, OrderItem } from '../store';
import { createOrder } from './orders';
import { createPayment } from './payments';

export async function createOrderAndPay(input: {
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  voucherCode?: string;
  total: number;
  methodLabel: string;
}): Promise<Order> {
  const idempotencyKey = `pay-${Date.now()}`;
  try {
    console.log('Bắt đầu tạo đơn');

    const created = await createOrder({
      userId: input.userId,
      items: input.items,
      total: input.total,
    });

    console.log('Tạo đơn thành công:', created);

    const paid = await createPayment({
      orderId: created.id,
      method: input.methodLabel,
      idempotencyKey,
    });

    console.log('Thanh toán thành công:', paid);

    return {
      id: created.id,
      userId: created.userId,
      items: created.items,
      total: input.total,
      discount: input.discount,
      voucherCode: input.voucherCode,
      status: paid.order.status,
      payment: paid.payment ?? undefined,
      createdAt: new Date(created.createdAt),
    };
  } catch (error) {
    console.error('Lỗi tạo đơn hoặc thanh toán:', error);
    throw error;
  }
}
