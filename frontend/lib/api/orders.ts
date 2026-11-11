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
}
export async function getOrderById(
  id: string,
  token: string,
): Promise<Order | undefined> {
  const orders = await getMyOrders(token);
  
  if (!orders) return undefined;

  return orders.find((order) => order.id === id);
}
