import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelOrder, createOrder, getOrderById, updateOrderStatus } from "@/lib/api/orders";
import { confirmPayment, createPayment } from "@/lib/api/payments";
import type { PromotionValidation } from "@/lib/api/promotions";
import { useStore, type Order } from "@/lib/store";
import { createIdempotencyKey } from "@/lib/utils";

export interface CheckoutSession {
  orderId: string;
  paymentId?: string;
  idempotencyKey: string;
  amount?: number;
}

export function useCheckout(
  method: string,
  appliedCode: string | undefined,
  result?: PromotionValidation,
  existingOrderId?: string,
) {
  const { state, dispatch, cartTotal } = useStore();
  const router = useRouter();

  const keyRef = useRef<string | null>(null);
  const createdOrderIdRef = useRef<string | undefined>(existingOrderId);

  const [existingOrder, setExistingOrder] = useState<Order | null>(() =>
    existingOrderId
      ? (state.orders.find((o) => o.id === existingOrderId) ?? null)
      : null,
  );
  const [loadingOrder, setLoadingOrder] = useState<boolean>(
    Boolean(existingOrderId),
  );
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [retryNotice, setRetryNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!existingOrderId) {
      setExistingOrder(null);
      setLoadingOrder(false);
      return;
    }

    createdOrderIdRef.current = existingOrderId;
    let cancelled = false;

    async function fetchOrder() {
      setLoadingOrder(true);
      try {
        const order = await getOrderById(existingOrderId!);
        if (cancelled) return;

        if (!order) {
          setExistingOrder(null);
          return;
        }

        if (!["PENDING", "PAYMENT_FAILED"].includes(order.status)) {
          router.replace(`/confirmation/${order.id}`);
          return;
        }

        setExistingOrder(order);
      } catch {
        if (!cancelled) setExistingOrder(null);
      } finally {
        if (!cancelled) setLoadingOrder(false);
      }
    }

    void fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [existingOrderId, router]);

  const placeOrder = async () => {
    if (loading || retrying || cancelling) return;
    setLoading(true);
    setError("");
    setPaymentFailed(false);
    try {
      const targetOrderId = createdOrderIdRef.current;
      keyRef.current ??= createIdempotencyKey(targetOrderId);

      let orderId = targetOrderId;
      let orderTotal =
        existingOrder?.total ?? result?.totalAmount ?? cartTotal;

      if (!orderId) {
        const newOrder = await createOrder({
          promotionCode: appliedCode,
          items: state.cart.map((item) => ({
            productId: item.productId,
            size: item.size,
            toppings: item.toppings,
            qty: item.qty,
          })),
        });
        orderId = newOrder.id;
        orderTotal = newOrder.total;
        createdOrderIdRef.current = orderId;
        setExistingOrder(newOrder);
      }

      setSession({
        orderId: orderId!,
        idempotencyKey: keyRef.current,
        amount: orderTotal,
      });
    } catch (err) {
      keyRef.current = null;
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tạo đơn hàng, vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const finishPayment = async (success: boolean) => {
    if (!session || loading || retrying || cancelling) return;

    setLoading(true);
    setError("");
    setRetryNotice(false);
    try {
      await createPayment({
        orderId: session.orderId,
        method,
        idempotencyKey: session.idempotencyKey,
      });

      const confirmRes = await confirmPayment({
        orderId: session.orderId,
        success,
        idempotencyKey: session.idempotencyKey,
      });

      if (confirmRes.order.status === "PAID") {
        dispatch({ type: "PLACE_ORDER", order: confirmRes.order });

        if (state.user) {
          const earnedPoints = Math.floor(confirmRes.order.total / 1000);
          dispatch({
            type: "SET_USER",
            user: {
              ...state.user,
              loyaltyPoints: (state.user.loyaltyPoints ?? 0) + earnedPoints,
            },
          });
        }

        if (!existingOrderId) {
          dispatch({ type: "CLEAR_CART" });
        }

        router.replace(`/confirmation/${confirmRes.order.id}`);
        return;
      }

      // Thanh toán thất bại: cấp idempotencyKey mới cho cùng orderId và chuyển sang màn hình lựa chọn
      const nextKey = createIdempotencyKey(session.orderId);
      keyRef.current = nextKey;
      setExistingOrder(confirmRes.order);
      setSession((prev) =>
        prev ? { ...prev, idempotencyKey: nextKey } : null,
      );
      setPaymentFailed(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không xử lý được giao dịch thanh toán.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Bấm "Thanh toán lại": Gọi API chuyển status từ PAYMENT_FAILED -> PENDING trước, sau đó quay lại chọn phương thức
  const retryPayment = async () => {
    if (retrying || loading || cancelling) return;
    const targetOrderId = session?.orderId ?? createdOrderIdRef.current;
    if (!targetOrderId) return;

    setRetrying(true);
    setError("");
    try {
      const updatedOrder = await updateOrderStatus(targetOrderId, "PENDING");

      keyRef.current = null; // Reset key để tạo Idempotency-Key mới cho lần thanh toán sau
      setExistingOrder(updatedOrder);
      setPaymentFailed(false);
      setSession(null);
      setRetryNotice(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể khôi phục đơn hàng để thanh toán lại.",
      );
    } finally {
      setRetrying(false);
    }
  };

  // Bấm "Hủy đơn" sau khi thanh toán lỗi (dùng chung trong popup / màn hình lỗi)
  const cancelFailedOrder = async () => {
    if (cancelling || retrying) return;
    const targetOrderId = session?.orderId ?? createdOrderIdRef.current;
    setCancelling(true);
    setError("");
    try {
      if (targetOrderId) {
        await cancelOrder(targetOrderId);
      }
    } catch (err) {
      console.error("Không thể cập nhật trạng thái hủy đơn:", err);
    } finally {
      setPaymentFailed(false);
      setRetryNotice(false);
      setSession(null);
      keyRef.current = null;
      createdOrderIdRef.current = undefined;
      setCancelling(false);
      router.replace("/cart");
    }
  };

  // Hàm hủy đơn chung dành cho user ở màn hình Checkout bất cứ lúc nào (trước hoặc sau khi tạo session)
  const cancelOrderAction = async (targetId?: string) => {
    if (cancelling || retrying) return;
    const idToCancel = targetId ?? session?.orderId ?? createdOrderIdRef.current;
    
    setCancelling(true);
    setError("");
    try {
      if (idToCancel) {
        await cancelOrder(idToCancel);
      }
    } catch (err) {
      console.error("Không thể hủy đơn hàng:", err);
    } finally {
      setPaymentFailed(false);
      setRetryNotice(false);
      setSession(null);
      keyRef.current = null;
      createdOrderIdRef.current = undefined;
      setCancelling(false);
      router.replace("/cart");
    }
  };

  return {
    cart: state.cart,
    user: state.user,
    existingOrder,
    loadingOrder,
    cartTotal,
    session,
    paymentFailed,
    retryNotice,
    loading,
    retrying,
    cancelling,
    error,
    placeOrder,
    finishPayment,
    retryPayment,
    cancelFailedOrder,
    cancelOrderAction, 
  };
}