import type { CartItem, Order, OrderItem } from '../store';
import { getAccessToken } from './auth';
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
    headers: { Authorization: ['Bearer', getAccessToken() ?? ''].join(' ') },
    body: JSON.stringify(input),
  });
}

export async function getMyOrders(): Promise<Order[]> {
  const token = getAccessToken();
  const rows = await request<
    Array<Omit<Order, 'createdAt'> & { createdAt: string }>
  >('/orders/me', {
    headers: token ? { Authorization: ['Bearer', token].join(' ') } : undefined,
  });
  return rows.map((order) => ({
    ...order,
    createdAt: new Date(order.createdAt),
  }));
}
