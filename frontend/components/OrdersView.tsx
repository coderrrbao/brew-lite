"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyOrders } from "@/lib/api/orders";
import { useStore, type Order } from "@/lib/store";
import { formatPrice } from "@/lib/data";
import {
  PageShell,
  ReceiptIcon,
  SpinnerIcon,
  btnPrimary,
  btnOutline,
  cardCls,
} from "./ui";
import { getAccessToken } from "@/lib/api/auth";

const statusConfig: Record<Order["status"], { label: string; cls: string }> = {
  PENDING: { label: "Chờ xử lý", cls: "bg-[#f6e7c1] text-[#6b4a05]" },
  PAID: { label: "Đã thanh toán", cls: "bg-[#dbe7f5] text-[#1d3f6e]" },
  PREPARING: { label: "Đang pha chế", cls: "bg-[#f3dccb] text-[#7a3510]" },
  READY: { label: "Sẵn sàng lấy", cls: "bg-[#d6ead9] text-[#1f5129]" },
  COMPLETED: {
    label: "Hoàn thành",
    cls: "bg-secondary text-secondary-foreground",
  },
  PAYMENT_FAILED: {
    label: "Thanh toán lỗi",
    cls: "bg-[#f3d6d2] text-[#8a2a20]",
  },
  CANCELLED: { label: "Đã huỷ", cls: "bg-[#f3d6d2] text-[#8a2a20]" },
};

export default function OrdersPage() {
  const { state, dispatch } = useStore();
  const [orders, setOrders] = useState<Order[]>(state.orders || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const result = await getMyOrders();

      if (result === null) {
        throw new Error("Không thể tải lịch sử đơn hàng.");
      }

      setOrders(result);

      dispatch({
        type: "SET_ORDERS",
        orders: result,
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không tải được lịch sử đơn hàng.",
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);
    void loadOrders();
  }, []);

  return (
    <PageShell>
      <h1 className="text-4xl font-semibold">Lịch sử đơn hàng</h1>
      <p className="mt-2 text-muted-foreground">
        Theo dõi trạng thái và xem lại các đơn đã đặt.
      </p>

      {isLoggedIn === false ? (
        <div className="mt-14 flex flex-col items-center text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <ReceiptIcon size={32} />
          </span>

          <h2 className="mt-5 text-xl font-semibold">Bạn chưa đăng nhập</h2>

          <p className="mt-2 text-muted-foreground">
            Vui lòng đăng nhập để xem lịch sử đơn hàng của bạn.
          </p>

          <Link href="/login" className={`${btnPrimary} mt-6`}>
            Đăng nhập ngay
          </Link>
        </div>
      ) : loading ? (
        <div
          className="mt-14 flex justify-center text-muted-foreground"
          role="status"
        >
          <SpinnerIcon size={24} />
        </div>
      ) : error ? (
        <div className="mt-14 flex flex-col items-center text-center">
          <p role="alert" className="text-sm font-medium text-[#8a2a20]">
            {error}
          </p>
          <button
            onClick={() => void loadOrders()}
            className={`${btnOutline} mt-6`}
          >
            Thử lại
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-14 flex flex-col items-center text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <ReceiptIcon size={32} />
          </span>
          <p className="mt-5 text-muted-foreground">
            Bạn chưa có đơn hàng nào.
          </p>
          <Link href="/" className={`${btnPrimary} mt-6`}>
            Đặt đồ uống đầu tiên
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </ul>
      )}
    </PageShell>
  );
}

function OrderCard({ order }: { order: Order }) {
  const status = statusConfig[order.status];
  const preview = order.items.slice(0, 3);
  const extra = order.items.length - preview.length;
  const isPending = order.status === "PENDING";

  return (
    <li
      className={`${cardCls} overflow-hidden transition hover:shadow-[0_12px_30px_-14px_rgba(35,21,16,0.25)]`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="tabular font-semibold">{order.id}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("vi-VN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}
        >
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex -space-x-2">
          {preview.map((item) => (
            <img
              key={item.id}
              src={item.imageUrl}
              alt={item.name}
              className="h-11 w-11 rounded-lg border-2 border-card bg-secondary object-cover"
            />
          ))}
          {extra > 0 && (
            <span className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-card bg-secondary text-xs font-semibold text-muted-foreground">
              +{extra}
            </span>
          )}
        </div>
        <p className="min-w-0 flex-1 text-[15px]">
          {order.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-border bg-background/50 px-5 py-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {order.payment?.method}
          </p>
          <p className="tabular font-display text-xl font-semibold">
            {formatPrice(order.total)}
          </p>
        </div>
        <Link
          href={isPending ? "/cart" : `/confirmation/${order.id}`}
          className={
            isPending
              ? "inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
              : "inline-flex h-10 items-center rounded-full border border-border bg-card px-5 text-sm font-semibold transition hover:bg-secondary"
          }
        >
          {isPending ? "Tiếp tục thanh toán" : "Xem chi tiết"}
        </Link>
      </div>
    </li>
  );
}
