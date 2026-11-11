import type { Order, Payment } from "../store";
import { request } from "./client";

export function createPayment(input: {
  orderId: string;
  method: string;
  idempotencyKey: string;
}) {
  return request<{
    orderId: string;
    status: Order["status"];
    paymentId: string;
    amount: number;
  }>("/payments", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "idempotency-key": input.idempotencyKey },
  });
}

export function confirmPayment(input: {
  paymentId?: string;
  success: boolean;
}) {
  return request<{
    order: Order;
  }>(`/payments/${input.paymentId}/confirm`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
