import type { CartItem, Order, OrderItem } from "../store";
import { request } from "./client";

interface Payment {
  id: string;
  orderId: string;
  idempotencyKey: string;
  amount: number;
  method: string;
  status: string;
}

export function createOrder(input: {
  userId?: string;
  items: CartItem[];
  total: number;
  idempotencyKey: string;
}) {
  const { idempotencyKey } = input;
  return request<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export async function getMyOrders(token?: string): Promise<Order[] | null> {
  try {
    const rows = await request<
      Array<Omit<Order, "createdAt"> & { createdAt: string }>
    >("/orders/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return rows.map((order) => ({
      ...order,
      createdAt: new Date(order.createdAt),
    }));
  } catch {
    return null;
  }
}
