import { request } from './client';

export interface PromotionValidation {
  isValid: boolean;
  discountAmount: number;
  totalAmount: number;
}

export function validatePromotion(code: string, subtotal: number) {
  return request<PromotionValidation>('/promotions/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  });
}
