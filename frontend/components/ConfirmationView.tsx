"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getOrderById } from "@/lib/api/orders";
import { type Order } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { getAccessToken } from "@/lib/api/auth";
import {
  PageShell,
  Eyebrow,
  CheckIcon,
  WalletIcon,
  btnAccent,
  btnPrimary,
  btnOutline,
  cardCls,
} from "./ui";

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    const token = getAccessToken();

    if (!token) {
      setError("Bạn chưa đăng nhập hoặc token đã hết hạn");
      setLoading(false);
      return;
    }

    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getOrderById(id);
      setOrder(result);
    } catch {
      setError("Không thể tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!id || !order) return;

    if (
      order.status === "COMPLETED" ||
      order.status === "CANCELLED" ||
      order.status === "PAYMENT_FAILED"
    ) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updatedOrder = await getOrderById(id);
        if (updatedOrder) {
          setOrder(updatedOrder);
        }
      } catch {
        // Bỏ qua lỗi mạng tạm thời khi polling
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [id, order?.status]);

  if (loading) {
    return (
      <PageShell className="text-center">
        <h1>Đang tải đơn hàng...</h1>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell className="text-center">
        <p role="alert" className="text-sm font-medium text-[#8a2a20]">
          {error}
        </p>
        <button onClick={() => void loadOrder()} className={`${btnOutline} mt-6`}>
          Thử lại
        </button>
      </PageShell>
    );
  }

  if (!order) {
    return (
      <PageShell className="text-center">
        <h1 className="text-3xl font-semibold">Không tìm thấy đơn hàng</h1>
        <p className="mt-2 text-muted-foreground">
          Mã đơn có thể đã sai hoặc đã hết hạn.
        </p>
        <Link href="/" className={`${btnPrimary} mt-6`}>
          Về trang chủ
        </Link>
      </PageShell>
    );
  }

  const isUnpaid = ["PENDING", "PAYMENT_FAILED"].includes(order.status);
  const isCancelled = order.status === "CANCELLED";
  const discount = order.discountAmount ?? (order as Order & { discount?: number }).discount ?? 0;

  return (
    <PageShell>
      <div className="text-center">
        <span
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white ${
            isUnpaid || isCancelled ? "bg-[#8a2a20]" : "bg-success"
          }`}
        >
          {isUnpaid || isCancelled ? <WalletIcon size={30} /> : <CheckIcon size={30} />}
        </span>
        <h1 className="mt-5 text-4xl font-semibold">
          {isCancelled
            ? "Đơn hàng đã huỷ"
            : isUnpaid
              ? "Đơn hàng chưa thanh toán"
              : "Đặt hàng thành công"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isCancelled
            ? "Đơn hàng này đã bị huỷ."
            : isUnpaid
              ? "Vui lòng hoàn tất thanh toán để quầy bắt đầu pha chế."
              : "Cảm ơn bạn đã chọn BrewLite."}
        </p>
      </div>

      <div className={`${cardCls} mt-8 p-6 text-center`}>
        <Eyebrow>Mã đơn hàng</Eyebrow>
        <p className="tabular mt-2 font-display text-3xl font-semibold text-accent">
          {order.id}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleString("vi-VN", {
            dateStyle: "full",
            timeStyle: "short",
          })}
        </p>
      </div>

      <div className="mt-6 max-w-2xl mx-auto">
        <section className={`${cardCls} p-6`}>
          <Eyebrow>Chi tiết đơn hàng</Eyebrow>
          <ul className="mt-4 divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-12 w-12 rounded-lg bg-secondary object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Size {item.size} × {item.qty}
                  </p>
                </div>
                <span className="tabular text-[15px] font-medium">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
          {discount > 0 && (
            <div className="flex justify-between border-t border-border pt-3 text-sm text-success">
              <span>Mã {order.promotionCode}</span>
              <span className="tabular font-medium">
                -{formatPrice(discount)}
              </span>
            </div>
          )}
          <div className="mt-2 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">
              {order.payment?.method}
            </span>
            <span className="tabular font-display text-2xl font-semibold">
              {formatPrice(order.total)}
            </span>
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {isUnpaid && (
          <Link href={`/checkout?orderId=${order.id}`} className={btnAccent}>
            Tiếp tục thanh toán
          </Link>
        )}
        <Link href="/orders" className={btnOutline}>
          Lịch sử đơn hàng
        </Link>
        <Link href="/" className={btnPrimary}>
          Đặt thêm đồ uống
        </Link>
      </div>
    </PageShell>
  );
}