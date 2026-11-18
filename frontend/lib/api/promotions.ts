import { request } from "./client";

export interface PromotionValidation {
  code?: string;
  isValid: boolean;
  discountAmount: number;
  totalAmount: number;
  pointCost?: number;
}

export interface Promotions {
  code: string;
  description?: string;
  descriptions?: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minimumOrderAmount: number;
  maximumDiscountAmount?: number | null;
  pointCost: number;
  active: boolean;
  expiresAt: string | Date | null;
}

export interface RedeemedVoucher extends Promotions {
  redeemedAt: string | Date;
  pointsSpent: number;
}

export interface PromotionsResponse {
  promotions: Promotions[];
  redeemedVouchers: RedeemedVoucher[];
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

export function getPromotions(userId?: string): Promise<PromotionsResponse> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return request<PromotionsResponse>(`/promotions${query}`);
}

export function redeemPromotion(code: string, userId?: string) {
  return request<{ message: string; redeemedVoucher: RedeemedVoucher }>(
    "/promotions/redeem",
    {
      method: "POST",
      body: JSON.stringify({ code, userId }),
    },
  );
}