import type { CartItem, Order } from '../store';
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

    const created = await createOrder({
      userId: input.userId,
      items: input.items,
      total: input.total,
    });


    const paid = await createPayment({
      orderId: created.id,
      method: input.methodLabel,
      idempotencyKey,
    });


    return {
      id: created.id,
      userId: created.userId,
      items: created.items,
      total: input.total,
      discount: input.discount,
      voucherCode: input.voucherCode,
        status: paid.status,   
      payment: paid.payment ?? undefined,
      createdAt: new Date(created.createdAt),
    };
  } catch (error) {
    throw error;
  }
}
