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

<<<<<<< HEAD
export async function getMyOrders(token?: string): Promise<Order[] | null> {
  try {
    const rows = await request<
      Array<Omit<Order, 'createdAt'> & { createdAt: string; payments?: Order['payment'][] }>
    >('/orders/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return rows.map((order) => ({
      ...order,
      createdAt: new Date(order.createdAt),
      payment: order.payments?.[0],
    }));
  } catch {
    return null;
  }
=======
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
>>>>>>> 9226601 (feat: product view dùng api thật, thêm các loading, error view)
}
export async function getOrderById(
  id: string,
  token: string,
): Promise<Order | undefined> {
  const orders = await getMyOrders(token);
  
  if (!orders) return undefined;

  return orders.find((order) => order.id === id);
}
