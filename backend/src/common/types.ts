export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  points: number;
}
