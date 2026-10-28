'use client';

import Link from 'next/link';
import { useStore, type Order } from '@/lib/store';
import { formatPrice, getProductImageUrl } from '@/lib/data';
import { PageShell, ReceiptIcon, btnPrimary, cardCls } from './ui';

const statusConfig: Record<Order['status'], { label: string; cls: string }> = {
  PENDING: { label: 'Chờ xử lý', cls: 'bg-[#f6e7c1] text-[#6b4a05]' },
  PAID: { label: 'Đã thanh toán', cls: 'bg-[#dbe7f5] text-[#1d3f6e]' },
  PREPARING: { label: 'Đang pha chế', cls: 'bg-[#f3dccb] text-[#7a3510]' },
  READY: { label: 'Sẵn sàng lấy', cls: 'bg-[#d6ead9] text-[#1f5129]' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-secondary text-secondary-foreground' },
  PAYMENT_FAILED: { label: 'Thanh toán lỗi', cls: 'bg-[#f3d6d2] text-[#8a2a20]' },
  CANCELLED: { label: 'Đã huỷ', cls: 'bg-[#f3d6d2] text-[#8a2a20]' },
};

export default function OrdersPage() {
  const { state } = useStore();

  return (
    <PageShell>
      <h1 className="text-4xl font-semibold">Lịch sử đơn hàng</h1>
      <p className="mt-2 text-muted-foreground">Theo dõi trạng thái và xem lại các đơn đã đặt.</p>

      {state.orders.length === 0 ? (
        <div className="mt-14 flex flex-col items-center text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <ReceiptIcon size={32} />
          </span>
          <p className="mt-5 text-muted-foreground">Bạn chưa có đơn hàng nào.</p>
          <Link href="/" className={`${btnPrimary} mt-6`}>
            Đặt đồ uống đầu tiên
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {state.orders.map((o) => (
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

  return (
    <li className={`${cardCls} overflow-hidden transition hover:shadow-[0_12px_30px_-14px_rgba(35,21,16,0.25)]`}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="tabular font-semibold">{order.id}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {order.createdAt.toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}>{status.label}</span>
      </div>

      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex -space-x-2">
          {preview.map((item) => (
            <img
              key={item.id}
              src={getProductImageUrl(item.imageId, 100, 100)}
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
        <p className="min-w-0 flex-1 text-[15px]">{order.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</p>
      </div>

      <div className="flex items-center justify-between border-t border-border bg-background/50 px-5 py-4">
        <div>
          <p className="text-sm text-muted-foreground">{order.paymentMethod}</p>
          <p className="tabular font-display text-xl font-semibold">{formatPrice(order.total)}</p>
        </div>
        <Link
          href={`/confirmation/${order.id}`}
          className="inline-flex h-10 items-center rounded-full border border-border bg-card px-5 text-sm font-semibold transition hover:bg-secondary"
        >
          Xem chi tiết
        </Link>
      </div>
    </li>
  );
}
