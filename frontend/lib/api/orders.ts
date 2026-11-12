import type { CartItem, Order } from "../store";
import { getAccessToken } from "./auth";
import { request } from "./client";

export function createOrder(input: {
  userId?: string;
  items: CartItem[];
  total: number;
  idempotencyKey: string;
}) {
  return request<Order>("/orders", {
    method: "POST",
    headers: {
      Authorization: ["Bearer", getAccessToken() ?? ""].join(" "),
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify(input),
  });
}

export async function getMyOrders(): Promise<Order[]> {
  const token = getAccessToken();
  const rows = await request<
    Array<Omit<Order, "createdAt"> & { createdAt: string }>
  >("/orders/me", {
    headers: token ? { Authorization: ["Bearer", token].join(" ") } : undefined,
  });
  return rows.map((order) => ({
    ...order,
    createdAt: new Date(order.createdAt),
  }));
}
