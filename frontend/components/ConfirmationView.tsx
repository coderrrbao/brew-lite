'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useStore, type Order } from '@/lib/store';
import { formatPrice, getProductImageUrl } from '@/lib/data';
import { PageShell, Eyebrow, CheckIcon, BellIcon, CupIcon, WalletIcon, StarIcon, btnPrimary, btnOutline, cardCls } from './ui';

const steps: Array<{ key: Order['status']; label: string; hint: string; Icon: typeof CheckIcon }> = [
  { key: 'PAID', label: 'Đã thanh toán', hint: 'Quầy đã nhận đơn của bạn', Icon: WalletIcon },
  { key: 'PREPARING', label: 'Đang pha chế', hint: 'Barista đang chuẩn bị đồ uống', Icon: CupIcon },
  { key: 'READY', label: 'Sẵn sàng lấy', hint: 'Báo mã đơn tại quầy để nhận ly', Icon: BellIcon },
  { key: 'COMPLETED', label: 'Hoàn thành', hint: 'Chúc bạn ngon miệng', Icon: StarIcon },
];

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useStore();

  const order: Order | undefined = state.orders.find((o) => o.id === id);

  const finalIndex = order ? Math.max(0, steps.findIndex((s) => s.key === order.status)) : 0;
  const isLive = order?.status === 'PAID';
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!order || !isLive) return;
    const timer = setInterval(() => setTick((t) => Math.min(t + 1, steps.length - 1)), 2500);
    return () => clearInterval(timer);
  }, [order, isLive]);

  if (!order) {
    return (
      <PageShell className="text-center">
        <h1 className="text-3xl font-semibold">Không tìm thấy đơn hàng</h1>
        <p className="mt-2 text-muted-foreground">Mã đơn có thể đã sai hoặc đã hết hạn.</p>
        <Link href="/" className={`${btnPrimary} mt-6`}>
          Về trang chủ
        </Link>
      </PageShell>
    );
  }

  const activeStep = isLive ? tick : finalIndex;

  return (
    <PageShell>
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success text-white">
          <CheckIcon size={30} />
        </span>
        <h1 className="mt-5 text-4xl font-semibold">Đặt hàng thành công</h1>
        <p className="mt-2 text-muted-foreground">Cảm ơn bạn đã chọn BrewLite.</p>
      </div>

      <div className={`${cardCls} mt-8 p-6 text-center`}>
        <Eyebrow>Mã đơn hàng</Eyebrow>
        <p className="tabular mt-2 font-display text-3xl font-semibold text-accent">{order.id}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {order.createdAt.toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' })}
        </p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className={`${cardCls} p-6`}>
          <Eyebrow>Trạng thái đơn</Eyebrow>
          <ol className="mt-5">
            {steps.map((s, i) => {
              const done = i <= activeStep;
              const current = i === activeStep && i < steps.length - 1 && isLive;
              const last = i === steps.length - 1;
              return (
                <li key={s.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${
                        done ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'
                      } ${current ? 'ring-4 ring-accent/20' : ''}`}
                    >
                      {done && i < activeStep ? <CheckIcon size={16} /> : <s.Icon size={16} />}
                    </span>
                    {!last && <span className={`my-1 w-0.5 flex-1 min-h-6 ${i < activeStep ? 'bg-accent' : 'bg-border'}`} />}
                  </div>
                  <div className="pb-5">
                    <p className={`font-semibold ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</p>
                    {done && <p className="text-sm text-muted-foreground">{s.hint}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className={`${cardCls} p-6`}>
          <Eyebrow>Chi tiết đơn</Eyebrow>
          <ul className="mt-4 divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <img
                  src={getProductImageUrl(item.imageId, 100, 100)}
                  alt={item.name}
                  className="h-12 w-12 rounded-lg bg-secondary object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Size {item.size} × {item.qty}
                  </p>
                </div>
                <span className="tabular text-[15px] font-medium">{formatPrice(item.unitPrice * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">{order.paymentMethod}</span>
            <span className="tabular font-display text-2xl font-semibold">{formatPrice(order.total)}</span>
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
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
