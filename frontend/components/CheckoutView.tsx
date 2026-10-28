'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore, type Order } from '@/lib/store';
import { formatPrice, getProductImageUrl } from '@/lib/data';
import { createOrderAndPay } from '@/lib/api';
import {
  PageShell,
  StickyBar,
  Eyebrow,
  ArrowLeftIcon,
  SpinnerIcon,
  StarIcon,
  WalletIcon,
  CardIcon,
  StoreIcon,
  btnAccent,
  cardCls,
} from './ui';

const paymentMethods = [
  { id: 'momo', label: 'Ví MoMo', hint: 'Thanh toán bằng ví điện tử', Icon: WalletIcon },
  { id: 'zalopay', label: 'ZaloPay', hint: 'Thanh toán bằng ví điện tử', Icon: WalletIcon },
  { id: 'card', label: 'Thẻ nội địa', hint: 'ATM / thẻ ghi nợ nội địa', Icon: CardIcon },
  { id: 'visa', label: 'Thẻ quốc tế', hint: 'Visa / Mastercard', Icon: CardIcon },
];

export default function CheckoutPage() {
  const { state, dispatch, cartTotal } = useStore();
  const router = useRouter();
  const [method, setMethod] = useState('momo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (state.cart.length === 0 && !loading) router.replace('/');
  }, [state.cart.length, loading, router]);
  if (state.cart.length === 0 && !loading) return null;

  async function placeOrder() {
    setLoading(true);
    setError('');
    const methodLabel = paymentMethods.find((p) => p.id === method)?.label ?? method;
    const order = await createOrderAndPay({ items: state.cart, total: cartTotal, method, methodLabel });
    if (order.status === 'PAYMENT_FAILED') {
      setError('Thanh toán không thành công. Giỏ hàng được giữ nguyên, vui lòng thử lại.');
      setLoading(false);
      return;
    }
    dispatch({ type: 'PLACE_ORDER', order });
    router.replace(`/confirmation/${order.id}`);
  }

  const points = Math.floor(cartTotal / 1000);

  const payButton = (
    <button onClick={placeOrder} disabled={loading} className={`${btnAccent} h-14 w-full text-base`}>
      {loading ? (
        <>
          <SpinnerIcon size={18} /> Đang xử lý thanh toán…
        </>
      ) : (
        <>Xác nhận thanh toán · {formatPrice(cartTotal)}</>
      )}
    </button>
  );

  return (
    <PageShell>
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeftIcon size={16} /> Quay lại giỏ hàng
      </Link>
      <h1 className="mt-5 text-4xl font-semibold">Thanh toán</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_340px] md:gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
        <div className="space-y-8">
          <section>
            <Eyebrow>Phương thức thanh toán</Eyebrow>
            <div role="radiogroup" aria-label="Phương thức thanh toán" className="mt-4 grid gap-3 sm:grid-cols-2">
              {paymentMethods.map(({ id, label, hint, Icon }) => {
                const on = method === id;
                return (
                  <button
                    key={id}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setMethod(id)}
                    disabled={loading}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                      on ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border bg-card hover:border-foreground/40'
                    }`}
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${on ? 'bg-accent text-accent-foreground' : 'bg-secondary text-foreground'}`}>
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{label}</span>
                      <span className="block text-sm text-muted-foreground">{hint}</span>
                    </span>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-accent' : 'border-border'}`}>
                      {on && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="flex items-start gap-3 rounded-xl bg-secondary p-4">
            <span className="mt-0.5 text-accent">
              <StoreIcon size={20} />
            </span>
            <div>
              <p className="font-semibold">Nhận tại quầy</p>
              <p className="text-sm text-muted-foreground">
                Sau khi thanh toán, bạn nhận mã đơn và theo dõi trạng thái pha chế để ghé quầy lấy đồ uống.
              </p>
            </div>
          </section>

          {error && (
            <p role="alert" className="rounded-lg bg-[#f3d6d2] px-4 py-3 text-sm font-medium text-[#8a2a20]">
              {error}
            </p>
          )}

          {state.user ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <StarIcon size={16} className="text-accent" />
              Bạn sẽ nhận <strong className="font-semibold text-foreground">{points} điểm</strong> tích luỹ cho đơn này.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="font-semibold text-accent underline underline-offset-4">
                Đăng nhập
              </Link>{' '}
              để tích {points} điểm và lưu lịch sử đơn hàng.
            </p>
          )}
        </div>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className={`${cardCls} p-6`}>
            <Eyebrow>Đơn hàng · {state.cart.length} món</Eyebrow>
            <ul className="mt-4 divide-y divide-border">
              {state.cart.map((item) => (
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
              <span className="font-semibold">Tổng cộng</span>
              <span className="tabular font-display text-2xl font-semibold">{formatPrice(cartTotal)}</span>
            </div>
            <div className="mt-6 hidden md:block">{payButton}</div>
          </div>
        </aside>
      </div>

      <div className="md:hidden">
        <StickyBar>{payButton}</StickyBar>
      </div>
    </PageShell>
  );
}
