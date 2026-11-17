import type { Order } from "../store";
import { getAccessToken } from "./auth";
import { request } from "./client";

export interface CreateOrderItemInput {
  productId: string;
  size: string;
  toppings: string[];
  qty: number;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  promotionCode?: string;
  pointsSpent?: number;
  note?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const row = await request<
    Omit<Order, "createdAt"> & {
      createdAt: string;
      payments?: Order["payment"][];
    }
  >("/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  return {
    ...row,
    createdAt: new Date(row.createdAt),
    payment: row.payments?.[0],
  };
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
  return orders.find((order) => order.id === id);
}

export async function getAllOrders(): Promise<Order[]> {
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
  >("/orders", {
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