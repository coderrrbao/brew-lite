import type { CheckoutSession } from "@/hooks/useCheckout";
import { createOrder, type CreateOrderInput } from "./orders";
import { createPayment } from "./payments";

export interface CreateOrderAndPayInput extends CreateOrderInput {
  method: string;
  idempotencyKey: string;
}

export async function createOrderAndPay(
  input: CreateOrderAndPayInput,
): Promise<CheckoutSession> {
  const created = await createOrder({
    items: input.items,
    promotionCode: input.promotionCode,
  });

  const paid = await createPayment({
    orderId: created.id,
    method: input.method || "mock",
    idempotencyKey: input.idempotencyKey,
  });

  return {
    orderId: created.id,
    paymentId: paid.payment?.id,
    amount: paid.payment?.amount ?? created.total,
    idempotencyKey: input.idempotencyKey,
  };
}