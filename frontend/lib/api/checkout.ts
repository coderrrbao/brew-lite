import { CheckoutSession } from "@/hooks/useCheckout";
import type { CartItem, Order } from "../store";
import { createOrder } from "./orders";
import { createPayment } from "./payments";

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
      method: input.method || "mock",
      idempotencyKey: input.idempotencyKey,
    });

    return {
      orderId: created.id,
      paymentId: paid.payment?.id,
      amount: paid.payment?.amount,
      idempotencyKey: input.idempotencyKey,
    };
  } catch (error) {
    throw error;
  }
}

// export { confirmPayment };
