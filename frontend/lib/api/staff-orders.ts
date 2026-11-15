import type { Order } from "../store";
import { getAccessToken } from "./auth";
import { request } from "./client";

// Kiểu dữ liệu đơn hàng dành cho nhân viên
export type StaffOrder = Order & {
  user?: {
    name: string | null;
    email: string;
  } | null;
};

// Lấy tất cả đơn hàng
export async function getStaffOrders(): Promise<StaffOrder[]> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const rows = await request<
    Array<
      Omit<StaffOrder, "createdAt"> & {
        createdAt: string;
        payments?: Order["payment"][];
      }
    >
  >("/orders/staff", {
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

// Nhân viên chuyển trạng thái đơn hàng
export async function updateStaffOrderStatus(
  orderId: string,
  status: Order["status"],
): Promise<void> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  await request<unknown>(
    `/orders/${encodeURIComponent(orderId)}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    },
  );
}