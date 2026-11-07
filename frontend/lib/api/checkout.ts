import type { CartItem } from "../store";
import { createOrder } from "./orders";
import { confirmPayment } from "./payments";

export type CheckoutSession = {
  orderId: string;
  paymentId: string;
  amount: number;
};

export async function createOrderAndPay(input: {
  userId?: string;
  items: CartItem[];
  total: number;
  method: string;
  idempotencyKey: string;
}): Promise<CheckoutSession> {
  const order = await createOrder({
    userId: input.userId,
    items: input.items,
    total: input.total,
    method: input.method,
    idempotencyKey: input.idempotencyKey,
  });

  const payment = order.payments[0];
  if (!payment) throw new Error("Không tạo được thanh toán");

  return {
    orderId: order.id,
    paymentId: payment.id,
    amount: Number(payment.amount),
  };
}

export { confirmPayment };
