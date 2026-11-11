import type { Order, Payment } from '../store';
import { getAccessToken } from './auth';
import { request } from './client';

export function createPayment(input: {
  orderId: string;
  method: string;
  idempotencyKey: string;
}) {
  return request<{
    orderId: string;
    status: Order['status'];
    payment: Payment;
  }>('/payments', {
    method: 'POST',
    headers: { Authorization: ['Bearer', getAccessToken() ?? ''].join(' ') },
    body: JSON.stringify({ ...input, success: true }),
  });
}
