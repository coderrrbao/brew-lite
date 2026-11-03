import type { CartItem, Order, OrderItem } from '../store';
import { request } from './client';

interface CreatedOrder {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: Order['status'];
  createdAt: string;
}

export function createOrder(input: {
  userId: string;
  items: CartItem[];
  total: number;
}) {
  return request<CreatedOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getMyOrders(token?: string): Promise<Order[] | null> {
  try {
    const rows = await request<
      Array<Omit<Order, 'createdAt'> & { createdAt: string }>
    >('/orders/me', {
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
