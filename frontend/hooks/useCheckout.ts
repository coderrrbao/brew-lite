import { createOrderAndPay } from "@/lib/api/checkout";
import { confirmPayment } from "@/lib/api/payments";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export interface CheckoutSession {
  orderId: string;
  paymentId?: string;
  idempotencyKey: string
  amount?: number;
}

export function useCheckout(method: string) {
  const { state, dispatch, cartTotal } = useStore();
  const router = useRouter();

  const keyRef = useRef<string | null>(null);
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const placeOrder = async () => {
    setLoading(true);
    setError("");
    try {
      keyRef.current ??= crypto.randomUUID();

      const s = await createOrderAndPay({
        userId: state.user?.id,
        items: state.cart,
        total: cartTotal,
        method,
        idempotencyKey: keyRef.current,
      });

      setSession(s);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra, vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const finishPayment = async (success: boolean) => {
    if (!session) return;
    
    setLoading(true);
    setError("");
    try {
      const result = await confirmPayment({
        idempotencyKey: session.idempotencyKey,
        success,
      });

      if (result.order.status === "PAID") {
        dispatch({ type: "PLACE_ORDER", order: result.order });
        router.replace(`/confirmation/${result.order.id}`);
        return;
      }

      keyRef.current = null;
      setSession(null);
      setError(
        "Thanh toán không thành công. Giỏ hàng được giữ nguyên, vui lòng thử lại.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Không xác nhận được thanh toán.",
      );
    }
    setLoading(false);
  };

  return {
    cart: state.cart,
    user: state.user,
    cartTotal,
    session,
    loading,
    error,
    placeOrder,
    finishPayment,
  };
}
