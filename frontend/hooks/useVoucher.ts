"use client";

import {
  getPromotions,
  Promotions,
  PromotionValidation,
  RedeemedVoucher,
  redeemPromotion,
  validatePromotion,
} from "@/lib/api/promotions";
import { useStore } from "@/lib/store";
import { useCallback, useEffect, useState } from "react";

const getErrorMessage = (err: any) => {
  const raw = err?.response?.data?.message || err?.message;
  const msg = Array.isArray(raw) ? raw[0] : raw;
  return msg || "Có lỗi xảy ra, vui lòng thử lại";
};

export function useVoucher() {
  const [loading, setLoading] = useState(false);
  const [redeemingCode, setRedeemingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<PromotionValidation>();
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<Promotions[]>([]);
  const [redeemedVouchers, setRedeemedVouchers] = useState<RedeemedVoucher[]>([]);

  const { state } = useStore();
  const user = state.user;
  const userId = user?.id;

  // Đồng bộ điểm tích lũy từ store và cập nhật ngay khi user đổi mã
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(
    user?.loyaltyPoints ?? 0,
  );

  useEffect(() => {
    setLoyaltyPoints(user?.loyaltyPoints ?? 0);
  }, [user?.loyaltyPoints]);

  const getAllPromotions = useCallback(async () => {
    try {
      const res = await getPromotions(userId);
      setPromotions(res.promotions ?? []);
      setRedeemedVouchers(res.redeemedVouchers ?? []);
    } catch (err) {
      console.error(getErrorMessage(err));
      setPromotions([]);
      setRedeemedVouchers([]);
    }
  }, [userId]);

  useEffect(() => {
    void getAllPromotions();
  }, [getAllPromotions]);

  const checkCode = async (subtotal: number, override?: string) => {
    const normalized = (override ?? code).trim().toUpperCase();
    if (!normalized) {
      setError("Vui lòng nhập mã giảm giá");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await validatePromotion(normalized, subtotal, userId);

      setResult(res);
      setAppliedCode(normalized);
      setCode("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const redeemCode = async (promotion: Promotions) => {
    if (!userId) {
      setError("Vui lòng đăng nhập để đổi điểm lấy mã");
      return;
    }

    try {
      setRedeemingCode(promotion.code);
      setError(null);

      await redeemPromotion(promotion.code, userId);

      // Trừ điểm hiển thị ngay lập tức và tải lại danh sách mã
      setLoyaltyPoints((prev) => Math.max(0, prev - promotion.pointCost));
      await getAllPromotions();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRedeemingCode(null);
    }
  };

  const reset = useCallback(() => {
    setResult(undefined);
    setAppliedCode(null);
    setCode("");
    setError(null);
  }, []);

  return {
    user,
    loyaltyPoints,
    promotions,
    redeemedVouchers,
    loading,
    redeemingCode,
    error,
    code,
    result,
    appliedCode,
    setCode,
    checkCode,
    redeemCode,
    reset,
  };
}