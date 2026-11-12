import type { Order, Payment } from '../store';
import { getAccessToken } from './auth';
import { request } from './client';

export function createPayment(input: {
  orderId: string;
  method: string;
  idempotencyKey: string;
}) {
  return request<{
    order: {
      id: string;
      status: Order['status'];
    };
    payment: Payment | null;
  }>('/payments', {
    method: 'POST',
    body: JSON.stringify({
      orderId: input.orderId,
      method: input.method,
      success: true,
      idempotencyKey: input.idempotencyKey,
    }),
  });
}