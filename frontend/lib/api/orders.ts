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

type PaymentItemResponse = NonNullable<Order["payment"]> & {
  status?: "PAID" | "FAILED";
};

type OrderApiResponse = Omit<Order, "createdAt" | "payment"> & {
  createdAt: string;
  subTotal?: number;
  discountAmount?: number;
  payments?: PaymentItemResponse[];
};

function mapOrder(row: OrderApiResponse): Order {
  const computedSubTotal =
    row.subTotal ??
    row.items?.reduce((sum, item) => sum + item.lineTotal, 0) ??
    row.total;

  const computedDiscount =
    row.discountAmount ?? Math.max(0, computedSubTotal - row.total);

  // Ưu tiên lấy bản ghi thanh toán PAID nếu có, nếu chưa có thì lấy lần thử gần nhất
  const latestPayment =
    row.payments?.find((p) => p.status === "PAID") ??
    row.payments?.[row.payments.length - 1] ??
    row.payments?.[0];

  return {
    ...row,
    subTotal: computedSubTotal,
    discountAmount: computedDiscount,
    createdAt: new Date(row.createdAt),
    payment: latestPayment,
  };
}
export async function updateOrderStatus(
  id: string,
  status: "PENDING" | "CANCELLED",
): Promise<Order> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

 const row = await request<OrderApiResponse>(`/orders/${id}/user-status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  return mapOrder(row);
}
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const row = await request<OrderApiResponse>("/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  return mapOrder(row);
}

export async function getMyOrders(): Promise<Order[]> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const rows = await request<OrderApiResponse[]>("/orders/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return rows.map(mapOrder);
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

  const rows = await request<OrderApiResponse[]>("/orders", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return rows.map(mapOrder);
}
export async function cancelOrder(id: string): Promise<Order> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const row = await request<OrderApiResponse>(`/orders/${id}/user-status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: "CANCELLED" }),
  });
  return mapOrder(row);
}