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
  loyaltyPoints: number;
}

export interface MockOrderItem {
  id: string;
  orderId: string;
  productId: string;
  size: string;
  qty: number;
  lineTotal: number;
  name: string;
  imageUrl: string;
  toppings: string[];
}

export interface MockPayment {
  id: string;
  orderId: string;
  idempotencyKey: string;
  amount: number;
  method: string;
}
