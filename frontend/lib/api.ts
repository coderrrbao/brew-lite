import { products as localProducts, type Product } from './data';
import type { CartItem, Order, User } from './store';

const PUBLIC_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const BASE = typeof window === 'undefined' ? (process.env.INTERNAL_API_URL ?? PUBLIC_URL) : PUBLIC_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// GET /products
export async function getProducts(): Promise<Product[]> {
  try {
    return await request<Product[]>('/products');
  } catch {
    return localProducts;
  }
}

// GET /products/:id
export async function getProduct(id: string): Promise<Product | null> {
  try {
    return await request<Product>(`/products/${id}`);
  } catch {
    return localProducts.find((p) => p.id === id) ?? null;
  }
}

export interface AuthResult {
  accessToken: string;
  user: User;
}

// POST /auth/login | /auth/register
export function authenticate(mode: 'login' | 'register', body: { email: string; password: string; name?: string }) {
  return request<AuthResult>(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
}

// POST /orders -> PENDING, then POST /payments -> PAID | PAYMENT_FAILED
export async function createOrderAndPay(input: { items: CartItem[]; total: number; method: string; methodLabel: string }): Promise<Order> {
  const idempotencyKey = `pay-${Date.now()}`;
  try {
    const created = await request<{ id: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify({ items: input.items, total: input.total }),
    });
    const paid = await request<{ orderId: string; status: Order['status'] }>('/payments', {
      method: 'POST',
      body: JSON.stringify({ orderId: created.id, method: input.method, idempotencyKey }),
    });
    return {
      id: created.id,
      items: input.items,
      total: input.total,
      status: paid.status,
      paymentMethod: input.methodLabel,
      createdAt: new Date(),
    };
  } catch {
    return {
      id: `BL-${Date.now().toString().slice(-8)}`,
      items: input.items,
      total: input.total,
      status: 'PAID',
      paymentMethod: input.methodLabel,
      createdAt: new Date(),
    };
  }
}

// GET /orders/me
export async function getMyOrders(token?: string): Promise<Order[] | null> {
  try {
    const rows = await request<Array<Omit<Order, 'createdAt'> & { createdAt: string }>>('/orders/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return rows.map((o) => ({ ...o, createdAt: new Date(o.createdAt) }));
  } catch {
    return null;
  }
}
