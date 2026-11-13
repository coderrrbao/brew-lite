import { request } from "./client";

export interface PromotionValidation {
  isValid: boolean;
  discountAmount: number;
  totalAmount: number;
}
export interface Promotions {
  code: string;
  descriptions: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minimumOrderAmount: number | 0;
  maximumDiscountAmount?: number;
  pointCost: number | 0;
  active: boolean;
  expiresAt: Date;
}

export function validatePromotion(
  code: string,
  subtotal: number,
  userId?: string,
) {
  return request<PromotionValidation>("/promotions/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotal, userId }),
  });
}

export function getPromotions(userId?: string): Promise<Promotions[]> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return request<Promotions[]>(`/promotions${query}`);
}
