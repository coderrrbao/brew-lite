import {
  getPromotions,
  Promotions,
  PromotionValidation,
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
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<PromotionValidation>();
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<Promotions[]>([]);
  const { state } = useStore();
  const userId = state.user?.id;

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

  const getAllPromotions = useCallback(async () => {
    try {
      const res = await getPromotions(userId);
      setPromotions(res);
    } catch (err) {
      console.error(getErrorMessage(err));
      setPromotions([]);
    }
  }, [userId]);

  useEffect(() => {
    void getAllPromotions();
  }, [getAllPromotions]);

  const reset = useCallback(() => {
    setResult(undefined);
    setAppliedCode(null);
    setCode("");
    setError(null);
  }, []);

  return {
    promotions,
    loading,
    error,
    code,
    result,
    appliedCode,
    setCode,
    checkCode,
    reset,
  };
}
