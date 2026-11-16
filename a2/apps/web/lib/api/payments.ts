import type { Order, Payment } from "../store";
import { getAccessToken } from "./auth";
import { request } from "./client";

export function createPayment(input: {
  orderId: string;
  method: string;
  idempotencyKey: string;
}) {
  return request<{
    order: {
      id: string;
      status: Order["status"];
    };
    payment: Payment | null;
  }>("/payments", {
    method: "POST",
    headers: {
      Authorization: ["Bearer", getAccessToken() ?? ""].join(" "),
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      orderId: input.orderId,
      method: input.method,
    }),
  });
}

export function confirmPayment(input: {
  orderId: string;
  success: boolean;
  idempotencyKey: string;
}) {
  return request<{
    order: Order;
  }>(`/payments/${input.orderId}/confirm`, {
    method: "POST",
    headers: {
      Authorization: ["Bearer", getAccessToken() ?? ""].join(" "),
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      success: input.success,
    }),
  });
}