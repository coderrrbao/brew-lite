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
<<<<<<< HEAD
    body: JSON.stringify({
      orderId: input.orderId,
      success: true,
      idempotencyKey: input.idempotencyKey,
    }),
=======
    headers: { Authorization: ['Bearer', getAccessToken() ?? ''].join(' ') },
    body: JSON.stringify({ ...input, success: true }),
>>>>>>> 9226601 (feat: product view dùng api thật, thêm các loading, error view)
  });
}