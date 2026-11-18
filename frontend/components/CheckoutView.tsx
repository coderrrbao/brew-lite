"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";
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
} from "./ui";
import { useCheckout } from "@/hooks/useCheckout";
import VoucherRow from "./VoucherRow";
import { useVoucher } from "@/hooks/useVoucher";
import VoucherList from "./VoucherList";

const paymentMethods = [
  {
    id: "momo",
    label: "Ví MoMo",
    hint: "Thanh toán bằng ví điện tử",
    Icon: WalletIcon,
  },
  {
    id: "zalopay",
    label: "ZaloPay",
    hint: "Thanh toán bằng ví điện tử",
    Icon: WalletIcon,
  },
  {
    id: "card",
    label: "Thẻ nội địa",
    hint: "ATM / thẻ ghi nợ nội địa",
    Icon: CardIcon,
  },
  {
    id: "visa",
    label: "Thẻ quốc tế",
    hint: "Visa / Mastercard",
    Icon: CardIcon,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingOrderId = searchParams.get("orderId") ?? undefined;
  const [method, setMethod] = useState("momo");

  const {
    code,
    loading: voucherLoading,
    redeemingCode,
    error: voucherError,
    result,
    appliedCode,
    loyaltyPoints,
    promotions,
    redeemedVouchers,
    setCode,
    checkCode,
    redeemCode,
    reset: resetVoucher,
  } = useVoucher();

  const {
    cart,
    user,
    existingOrder,
    loadingOrder,
    cartTotal,
    session,
    paymentFailed,
    retryNotice,
    loading,
    cancelling,
    error,
    placeOrder,
    finishPayment,
    retryPayment,
    cancelFailedOrder,
  } = useCheckout(method, appliedCode ?? undefined, result, existingOrderId);

  const isRetryMode = Boolean(existingOrderId || existingOrder);

  useEffect(() => {
    if (existingOrderId) {
      if (!loadingOrder && !existingOrder) {
        router.replace("/orders");
      }
      return;
    }

    if (
      cart.length === 0 &&
      !loading &&
      !cancelling &&
      !session &&
      !existingOrder
    ) {
      router.replace("/");
    }
  }, [
    existingOrderId,
    loadingOrder,
    existingOrder,
    cart.length,
    loading,
    cancelling,
    session,
    router,
  ]);

  useEffect(() => {
    if (!isRetryMode) {
      resetVoucher();
    }
  }, [cartTotal, isRetryMode, resetVoucher]);

  if (existingOrderId && loadingOrder) {
    return (
      <PageShell>
        <div
          className="mt-14 flex justify-center text-muted-foreground"
          role="status"
        >
          <SpinnerIcon size={24} />
        </div>
      </PageShell>
    );
  }

  if (existingOrderId && !existingOrder) return null;
  if (
    !existingOrderId &&
    cart.length === 0 &&
    !loading &&
    !cancelling &&
    !session &&
    !existingOrder
  ) {
    return null;
  }

  const displayItems = existingOrder?.items?.length ? existingOrder.items : cart;

  const subTotal = existingOrder
    ? (existingOrder.subTotal ?? existingOrder.total ?? 0)
    : cartTotal;

  const discount = existingOrder
    ? (existingOrder.discountAmount ?? 0)
    : (result?.discountAmount ?? 0);

  const activePromoCode = existingOrder
    ? existingOrder.promotionCode
    : appliedCode;

  const finalTotal = existingOrder
    ? (existingOrder.total ?? 0)
    : (result?.totalAmount ?? cartTotal);

  const points = Math.floor((session?.amount ?? finalTotal) / 1000);

  const payButton = (
    <button
      onClick={placeOrder}
      disabled={loading || cancelling}
      className={`${btnAccent} h-11 w-full text-sm font-semibold`}
    >
      {loading ? (
        <>
          <SpinnerIcon size={18} /> Đang xử lý thanh toán…
        </>
      ) : (
        <>Xác nhận thanh toán · {formatPrice(finalTotal)}</>
      )}
    </button>
  );

  return (
    <PageShell>
      <Link
        href={existingOrderId ? "/orders" : "/cart"}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeftIcon size={16} />{" "}
        {existingOrderId ? "Quay lại đơn hàng" : "Quay lại giỏ hàng"}
      </Link>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold">
          {isRetryMode ? "Tiếp tục thanh toán" : "Thanh toán"}
        </h1>
        {existingOrder && (
          <p className="text-xs text-muted-foreground">
            Mã đơn:{" "}
            <span className="font-semibold text-foreground">
              {existingOrder.id}
            </span>
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px] lg:gap-8">
        <div className="space-y-5">
          {paymentFailed ? (
            <section
              role="alert"
              className="rounded-xl border border-[#e3b5af] bg-card p-5 text-center shadow-sm"
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#f3d6d2] text-lg font-bold text-[#8a2a20]">
                !
              </span>
              <h2 className="mt-3 font-display text-xl font-semibold text-[#8a2a20]">
                Thanh toán thất bại
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
                Giao dịch cho đơn hàng{" "}
                <strong className="text-foreground">
                  {session?.orderId ?? existingOrder?.id}
                </strong>{" "}
                chưa được hoàn tất. Bạn muốn thử thanh toán lại hay hủy đơn?
              </p>

              <div className="mx-auto mt-5 flex max-w-md flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={retryPayment}
                  disabled={loading || cancelling}
                  className={`${btnAccent} h-11 flex-1 text-sm`}
                >
                  Thanh toán lại
                </button>
                <button
                  type="button"
                  onClick={() => void cancelFailedOrder()}
                  disabled={loading || cancelling}
                  className="h-11 flex-1 rounded-xl border border-border text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
                >
                  {cancelling ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <SpinnerIcon size={16} /> Đang hủy đơn…
                    </span>
                  ) : (
                    "Hủy đơn"
                  )}
                </button>
              </div>
            </section>
          ) : session ? (
            <section className="rounded-xl border border-border bg-card p-5 text-center">
              <Eyebrow>Quét mã để thanh toán</Eyebrow>
              <div className="mx-auto mt-3 flex h-44 w-44 items-center justify-center rounded-lg bg-secondary text-sm text-muted-foreground">
                QR (mock)
              </div>
              <p className="tabular font-display mt-3 text-2xl font-semibold">
                {formatPrice(session?.amount || 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Mã đơn: {session.orderId}
              </p>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => void finishPayment(true)}
                  disabled={loading}
                  className={`${btnAccent} h-10 flex-1 text-sm`}
                >
                  {loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <SpinnerIcon size={16} /> Đang xử lý…
                    </span>
                  ) : (
                    "Giả lập thành công"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void finishPayment(false)}
                  disabled={loading}
                  className="h-10 flex-1 rounded-xl border border-border text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
                >
                  {loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <SpinnerIcon size={16} /> Đang xử lý…
                    </span>
                  ) : (
                    "Giả lập thất bại"
                  )}
                </button>
              </div>
            </section>
          ) : (
            <section className="space-y-3">
              {retryNotice && (
                <div
                  role="status"
                  className="rounded-xl border border-[#e3b5af] bg-[#f3d6d2]/80 px-4 py-2.5 text-xs font-medium text-[#8a2a20]"
                >
                  Thanh toán trước đó không thành công. Vui lòng kiểm tra kết
                  nối mạng hoặc chọn phương thức thanh toán khác để thử lại.
                </div>
              )}

              <Eyebrow>Phương thức thanh toán</Eyebrow>
              <div
                role="radiogroup"
                aria-label="Phương thức thanh toán"
                className="grid gap-3.5 sm:grid-cols-2"
              >
                {paymentMethods.map(({ id, label, hint, Icon }) => {
                  const on = method === id;
                  return (
                    <button
                      key={id}
                      role="radio"
                      aria-checked={on}
                      onClick={() => setMethod(id)}
                      disabled={loading || cancelling}
                      className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                        on
                          ? "border-accent bg-accent/5 ring-1 ring-accent"
                          : "border-border bg-card hover:border-foreground/40"
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                          on
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold">
                          {label}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {hint}
                        </span>
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          on ? "border-accent" : "border-border"
                        }`}
                      >
                        {on && (
                          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="flex items-start gap-2.5 rounded-xl bg-secondary p-3.5">
            <span className="mt-0.5 text-accent">
              <StoreIcon size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold">Nhận tại quầy</p>
              <p className="text-xs text-muted-foreground">
                Sau khi thanh toán, bạn nhận mã đơn và theo dõi trạng thái pha
                chế để ghé quầy lấy đồ uống.
              </p>
            </div>
          </section>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-[#f3d6d2] px-3.5 py-2.5 text-xs font-medium text-[#8a2a20]"
            >
              {error}
            </p>
          )}

          {user ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <StarIcon size={15} className="text-accent" />
              Bạn sẽ nhận{" "}
              <strong className="font-semibold text-foreground">
                {points} điểm
              </strong>{" "}
              tích luỹ cho đơn này.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              <Link
                href="/login"
                className="font-semibold text-accent underline underline-offset-4"
              >
                Đăng nhập
              </Link>{" "}
              để tích {points} điểm và lưu lịch sử đơn hàng.
            </p>
          )}
        </div>

        <aside className="md:sticky md:top-20 md:self-start">
          <div className={`${cardCls} p-4`}>
            <Eyebrow>Đơn hàng · {displayItems.length} món</Eyebrow>
            <ul className="mt-2 divide-y divide-border">
              {displayItems.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5 py-1.5">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-9 w-9 rounded-lg bg-secondary object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Size {item.size} × {item.qty}
                    </p>
                  </div>
                  <span className="tabular text-sm font-medium">
                    {formatPrice(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            {!isRetryMode && (
              <div className="mt-2.5">
                <VoucherRow
                  code={code}
                  loading={voucherLoading}
                  error={voucherError}
                  appliedCode={appliedCode}
                  disabled={loading || cancelling || !!session}
                  onChange={(v) => setCode(v.toUpperCase())}
                  onApply={() => void checkCode(cartTotal)}
                  onRemove={resetVoucher}
                />
                <div className="mt-2">
                  <VoucherList
                    isLoggedIn={Boolean(user)}
                    loyaltyPoints={loyaltyPoints}
                    promotions={promotions}
                    redeemedVouchers={redeemedVouchers}
                    cartTotal={cartTotal}
                    appliedCode={appliedCode}
                    redeemingCode={redeemingCode}
                    disabled={
                      voucherLoading || loading || cancelling || !!session
                    }
                    onPick={(c) => void checkCode(cartTotal, c)}
                    onRedeem={(p) => void redeemCode(p)}
                  />
                </div>
              </div>
            )}

            <div className="mt-2.5 space-y-1 border-t border-border pt-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="tabular font-medium">
                  {formatPrice(subTotal)}
                </span>
              </div>
              {activePromoCode && discount > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Mã {activePromoCode}</span>
                  <span className="tabular font-medium">
                    −{formatPrice(discount)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2.5">
              <span className="text-sm font-semibold">Tổng cộng</span>
              <span className="tabular font-display text-xl font-semibold">
                {formatPrice(finalTotal)}
              </span>
            </div>

            {!session && !paymentFailed && (
              <div className="mt-3 hidden md:block">{payButton}</div>
            )}
          </div>
        </aside>
      </div>

      {!session && !paymentFailed && (
        <div className="md:hidden">
          <StickyBar>{payButton}</StickyBar>
        </div>
      )}
    </PageShell>
  );
}