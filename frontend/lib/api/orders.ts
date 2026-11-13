import type { CartItem, Order } from "../store";
import { getAccessToken } from "./auth";
import { request } from "./client";

export function createOrder(input: {
  userId?: string;
  items: CartItem[];
  total: number;
  promotionCode: string | undefined;
  subtotal: number;
  discount?: number;
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

  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const rows = await request<
    Array<
      Omit<Order, "createdAt"> & {
        createdAt: string;
        payments?: Order["payment"][];
      }
    >
  >("/orders/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return rows.map((order) => ({
    ...order,
    createdAt: new Date(order.createdAt),
    payment: order.payments?.[0],
  }));
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const orders = await getMyOrders();

  if (!orders) return undefined;

  return orders.find((order) => order.id === id);
}
