'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { formatPrice, getProductImageUrl, sizes, toppings as toppingDefs } from '@/lib/data';
import {
  PageShell,
  StickyBar,
  Eyebrow,
  BagIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  StoreIcon,
  ArrowLeftIcon,
  btnPrimary,
  cardCls,
  inputCls,
} from './ui';

export default function CartPage() {
  const { state, dispatch, cartTotal, cartCount } = useStore();
  const router = useRouter();
  const [note, setNote] = useState('');

  if (state.cart.length === 0) {
    return (
      <PageShell className="flex flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <BagIcon size={32} />
        </span>
        <h1 className="mt-6 text-3xl font-semibold">Giỏ hàng đang trống</h1>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Chọn một ly đồ uống từ thực đơn, chúng mình sẽ pha ngay khi bạn thanh toán.
        </p>
        <Link href="/" className={`${btnPrimary} mt-7`}>
          Xem thực đơn
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeftIcon size={16} /> Chọn thêm đồ uống
      </Link>
      <div className="mt-5 flex items-baseline justify-between">
        <h1 className="text-4xl font-semibold">Giỏ hàng</h1>
        <span className="text-sm text-muted-foreground">{cartCount} món</span>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px] md:gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
        <div>
          <ul className="space-y-3">
            {state.cart.map((item) => {
              const sizeLabel = sizes.find((s) => s.value === item.size)?.label ?? item.size;
              const toppingLabels = item.toppings.map((tid) => toppingDefs.find((t) => t.id === tid)?.label ?? tid);
              return (
                <li key={item.id} className={`${cardCls} flex gap-4 p-4`}>
                  <img
                    src={getProductImageUrl(item.imageId, 200, 200)}
                    alt={item.name}
                    className="h-20 w-20 shrink-0 rounded-lg bg-secondary object-cover sm:h-24 sm:w-24"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold leading-tight">{item.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {sizeLabel}
                          {toppingLabels.length > 0 && ` · ${toppingLabels.join(', ')}`}
                        </p>
                      </div>
                      <button
                        onClick={() => dispatch({ type: 'REMOVE_FROM_CART', id: item.id })}
                        aria-label={`Xoá ${item.name}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      >
                        <TrashIcon size={18} />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="inline-flex items-center gap-3">
                        <button
                          aria-label="Giảm số lượng"
                          onClick={() =>
                            item.qty > 1
                              ? dispatch({ type: 'UPDATE_QTY', id: item.id, qty: item.qty - 1 })
                              : dispatch({ type: 'REMOVE_FROM_CART', id: item.id })
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition hover:bg-secondary"
                        >
                          <MinusIcon size={15} />
                        </button>
                        <span className="tabular w-5 text-center font-semibold">{item.qty}</span>
                        <button
                          aria-label="Tăng số lượng"
                          onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.id, qty: item.qty + 1 })}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition hover:bg-secondary"
                        >
                          <PlusIcon size={15} />
                        </button>
                      </div>
                      <span className="tabular font-semibold">{formatPrice(item.unitPrice * item.qty)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            <label htmlFor="note" className="mb-2 block text-sm font-semibold">
              Ghi chú cho quầy pha chế
            </label>
            <input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: ít đường, không đá"
              className={inputCls}
            />
          </div>
        </div>

        <aside className="md:sticky md:top-24 md:self-start">
          <div className={`${cardCls} p-6`}>
            <Eyebrow>Tóm tắt đơn</Eyebrow>
            <dl className="mt-5 space-y-3 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tạm tính ({cartCount} món)</dt>
                <dd className="tabular">{formatPrice(cartTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <StoreIcon size={16} /> Nhận tại quầy
                </dt>
                <dd className="font-medium text-success">Miễn phí</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-border pt-4">
                <dt className="font-semibold">Tổng cộng</dt>
                <dd className="tabular font-display text-2xl font-semibold">{formatPrice(cartTotal)}</dd>
              </div>
            </dl>
            <div className="mt-6 hidden md:block">
              <button onClick={() => router.push('/checkout')} className={`${btnPrimary} h-14 w-full text-base`}>
                Tiến hành thanh toán
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className="md:hidden">
        <StickyBar>
          <button onClick={() => router.push('/checkout')} className={`${btnPrimary} h-14 w-full justify-between px-7 text-base`}>
            <span>Thanh toán</span>
            <span className="tabular">{formatPrice(cartTotal)}</span>
          </button>
        </StickyBar>
      </div>
    </PageShell>
  );
}
