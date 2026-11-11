import { CheckoutSession } from "@/hooks/useCheckout";
import type { CartItem, Order } from "../store";
import { createOrder } from "./orders";
import { confirmPayment, createPayment } from "./payments";

export async function createOrderAndPay(input: {
  userId?: string;
  items: CartItem[];
  // subtotal: number;
  discount?: number;
  voucherCode?: string;
  total: number;
  method: string;
  idempotencyKey: string;
}): Promise<CheckoutSession> {
  try {
    const created = await createOrder({
      userId: input.userId,
      items: input.items,
      total: input.total,
      idempotencyKey: input.idempotencyKey,
    });
    const paid = await createPayment({
      orderId: created.id,
      method: input.method,
      idempotencyKey: input.idempotencyKey,
    });

    return {
      // id: created.id,
      // userId: created.userId,
      // items: created.items,
      // total: input.total,
      // discount: input.discount,
      // voucherCode: input.voucherCode,
      // status: paid.status,
      // payment: paid.payment,
      // createdAt: new Date(created.createdAt),
      orderId: created.id,
      paymentId: paid.paymentId,
      amount: created.total,
    };
  } catch {
    throw new Error("Tạo đơn hàng thất bại");
  }
}

export { confirmPayment };
