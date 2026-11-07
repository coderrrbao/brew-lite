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
    payment: Payment;
  }>("/payments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function confirmPayment(input: { paymentId: string; success: boolean }) {
  return request<{
    order: Order;
  }>("/payments/confirm", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
