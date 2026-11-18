"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatPrice } from "@/lib/utils";
import type { Promotions, RedeemedVoucher } from "@/lib/api/promotions";

type VoucherCategory = "MY_VOUCHER" | "PROMOTION" | "REDEEMABLE";

interface DisplayItem {
  promotion: Promotions;
  category: VoucherCategory;
  shortBy: number;
}

const CATEGORY_ORDER: Record<VoucherCategory, number> = {
  MY_VOUCHER: 1, // 1. Mã của bạn (đã đổi)
  PROMOTION: 2,  // 2. Khuyến mãi (pointCost = 0)
  REDEEMABLE: 3, // 3. Mã đổi điểm (pointCost > 0, chưa đổi)
};

const PREVIEW_LIMIT = 2;

function getShortBy(p: Promotions, cartTotal: number) {
  return p.minimumOrderAmount != null && cartTotal < p.minimumOrderAmount
    ? p.minimumOrderAmount - cartTotal
    : 0;
}

function getDiscountText(p: Promotions) {
  if (p.type === "PERCENTAGE") {
    const maxPart = p.maximumDiscountAmount
      ? ` (tối đa ${formatPrice(p.maximumDiscountAmount)})`
      : "";
    return `Giảm ${p.value}%${maxPart}`;
  }
  return `Giảm ${formatPrice(p.value)}`;
}

function TicketIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" />
      <path d="M13 5v2M13 17v2M13 11v2" />
    </svg>
  );
}

function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

type Props = {
  isLoggedIn: boolean;
  loyaltyPoints: number;
  promotions: Promotions[];
  redeemedVouchers?: RedeemedVoucher[];
  cartTotal: number;
  appliedCode: string | null;
  redeemingCode?: string | null;
  disabled?: boolean;
  onPick: (code: string) => void;
  onRedeem: (promotion: Promotions) => void;
};

export default function VoucherList({
  isLoggedIn,
  loyaltyPoints,
  promotions,
  redeemedVouchers = [],
  cartTotal,
  appliedCode,
  redeemingCode,
  disabled,
  onPick,
  onRedeem,
}: Props) {
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (!openModal) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openModal]);

  const redeemedCodeSet = new Set(redeemedVouchers.map((r) => r.code));

  const rawItems: DisplayItem[] = [
    ...redeemedVouchers.map((r) => ({
      promotion: r,
      category: "MY_VOUCHER" as const,
      shortBy: getShortBy(r, cartTotal),
    })),
    ...promotions
      .filter((p) => (p.pointCost ?? 0) === 0 && !redeemedCodeSet.has(p.code))
      .map((p) => ({
        promotion: p,
        category: "PROMOTION" as const,
        shortBy: getShortBy(p, cartTotal),
      })),
    ...promotions
      .filter((p) => (p.pointCost ?? 0) > 0 && !redeemedCodeSet.has(p.code))
      .map((p) => ({
        promotion: p,
        category: "REDEEMABLE" as const,
        shortBy: getShortBy(p, cartTotal),
      })),
  ];

  if (rawItems.length === 0) return null;

  const items = [...rawItems].sort((a, b) => {
    const aNeedMore = a.shortBy > 0 ? 1 : 0;
    const bNeedMore = b.shortBy > 0 ? 1 : 0;
    if (aNeedMore !== bNeedMore) return aNeedMore - bNeedMore;
    return CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
  });

  const previewItems = (() => {
    if (!appliedCode) return items.slice(0, PREVIEW_LIMIT);
    const appliedItem = items.find((i) => i.promotion.code === appliedCode);
    const others = items.filter((i) => i.promotion.code !== appliedCode);
    return appliedItem
      ? [appliedItem, ...others].slice(0, PREVIEW_LIMIT)
      : items.slice(0, PREVIEW_LIMIT);
  })();

  const hasMore = items.length > PREVIEW_LIMIT;

  const renderVoucherCard = (
    { promotion: p, category, shortBy }: DisplayItem,
    options: { compact?: boolean; closeAfterPick?: boolean } = {},
  ) => {
    const { compact = false, closeAfterPick = false } = options;
    const eligible = shortBy === 0;
    const applied = appliedCode === p.code;
    const isRedeemable = category === "REDEEMABLE";
    const enoughPoints = loyaltyPoints >= (p.pointCost ?? 0);
    const isRedeeming = redeemingCode === p.code;

    const min = p.minimumOrderAmount ?? 0;
    const progress = min > 0 ? Math.min(100, (cartTotal / min) * 100) : 100;
    const desc = p.description || p.descriptions;
    const canClickCard = !isRedeemable && eligible && !disabled && !applied;

    const handleSelect = () => {
      if (!canClickCard) return;
      onPick(p.code);
      if (closeAfterPick) setOpenModal(false);
    };

    return (
      <li key={p.code}>
        <div
          role={canClickCard ? "button" : undefined}
          tabIndex={canClickCard ? 0 : undefined}
          onClick={handleSelect}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && canClickCard) {
              e.preventDefault();
              handleSelect();
            }
          }}
          className={`flex w-full items-stretch overflow-hidden border text-left transition ${
            compact ? "rounded-lg" : "rounded-xl"
          } ${
            !eligible
              ? "border-border bg-secondary/40 opacity-65"
              : applied
                ? "border-accent bg-accent/10 ring-1 ring-accent"
                : isRedeemable
                  ? "border-border bg-card"
                  : "cursor-pointer border-accent/50 bg-card hover:border-accent hover:bg-accent/5 hover:shadow-sm"
          }`}
        >
          {/* Cột trái: icon */}
          <span
            className={`flex shrink-0 items-center justify-center border-r border-dashed ${
              compact ? "w-11" : "w-14 sm:w-16"
            } ${
              !eligible
                ? "border-border bg-secondary text-muted-foreground"
                : "border-accent/50 bg-accent text-accent-foreground"
            }`}
          >
            {applied ? (
              <CheckIcon size={compact ? 18 : 22} />
            ) : (
              <TicketIcon size={compact ? 18 : 22} />
            )}
          </span>

          {/* Cột phải: nội dung */}
          <div
            className={`min-w-0 flex-1 ${
              compact ? "px-3 py-2" : "px-4 py-3"
            }`}
          >
            {/* Dòng 1: Mã + Nhãn loại + Nút */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className={`truncate font-semibold tracking-wide ${
                    compact ? "text-sm" : "text-[15px]"
                  }`}
                >
                  {p.code}
                </span>

                {category === "MY_VOUCHER" && (
                  <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                    Mã của bạn
                  </span>
                )}
                {category === "PROMOTION" && (
                  <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Khuyến mãi
                  </span>
                )}
                {category === "REDEEMABLE" && (
                  <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {p.pointCost} điểm
                  </span>
                )}
              </div>

              {eligible && !isRedeemable && (
                <span
                  className={`shrink-0 rounded-full font-semibold ${
                    compact
                      ? "px-2 py-0.5 text-[11px]"
                      : "px-2.5 py-0.5 text-xs"
                  } ${
                    applied
                      ? "bg-accent text-accent-foreground"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {applied ? "Đang dùng" : "Áp dụng"}
                </span>
              )}

              {eligible && isRedeemable && (
                <button
                  type="button"
                  disabled={
                    disabled || !isLoggedIn || !enoughPoints || isRedeeming
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onRedeem(p);
                  }}
                  className={`shrink-0 rounded-full font-semibold transition ${
                    compact
                      ? "px-2.5 py-0.5 text-[11px]"
                      : "px-3 py-1 text-xs"
                  } ${
                    isLoggedIn && enoughPoints
                      ? "bg-accent text-accent-foreground hover:opacity-90"
                      : "cursor-not-allowed bg-secondary text-muted-foreground"
                  }`}
                >
                  {isRedeeming
                    ? "Đang đổi..."
                    : !isLoggedIn
                      ? "Đăng nhập"
                      : enoughPoints
                        ? `Đổi ${p.pointCost}đ`
                        : `Thiếu ${p.pointCost - loyaltyPoints}đ`}
                </button>
              )}
            </div>

            {/* Chế độ thu gọn ở Checkout: gộp mức giảm + điều kiện trên 1 dòng */}
            {compact ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                <span className="font-medium text-foreground/90">
                  {getDiscountText(p)}
                </span>
                {!eligible ? (
                  <span className="text-[#8a2a20]">
                    {" "}
                    · Mua thêm {formatPrice(shortBy)}
                  </span>
                ) : (
                  p.minimumOrderAmount > 0 && (
                    <span> · Đơn từ {formatPrice(p.minimumOrderAmount)}</span>
                  )
                )}
              </p>
            ) : (
              /* Chế độ đầy đủ trong Popup */
              <>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {getDiscountText(p)}
                </p>

                {desc && (
                  <p className="mt-0.5 text-xs text-foreground/75">{desc}</p>
                )}

                {p.minimumOrderAmount > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Đơn tối thiểu {formatPrice(p.minimumOrderAmount)}
                  </p>
                )}

                {!eligible && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-accent/60 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[#8a2a20]">
                      Mua thêm {formatPrice(shortBy)} để dùng mã
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </li>
    );
  };

  const modalContent =
    openModal && typeof document !== "undefined"
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
            onClick={() => setOpenModal(false)}
          >
            <div
              className="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <div>
                  <h2
                    id="voucher-modal-title"
                    className="text-base font-semibold text-foreground"
                  >
                    Chọn mã giảm giá
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Tạm tính:{" "}
                    <strong className="font-semibold text-foreground">
                      {formatPrice(cartTotal)}
                    </strong>
                    {isLoggedIn && (
                      <>
                        {" · "}Điểm tích lũy:{" "}
                        <strong className="font-semibold text-accent">
                          {loyaltyPoints.toLocaleString("vi-VN")} điểm
                        </strong>
                      </>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  aria-label="Đóng"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-5 py-3.5">
                <ul className="space-y-2.5">
                  {items.map((item) =>
                    renderVoucherCard(item, {
                      compact: false,
                      closeAfterPick: true,
                    }),
                  )}
                </ul>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-border bg-secondary/30 px-5 py-2.5 text-right">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="rounded-xl border border-border bg-card px-4 py-1.5 text-sm font-medium transition hover:bg-secondary"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div>
      {/* Header + Điểm tích lũy */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Mã giảm giá cho bạn
        </p>

        {isLoggedIn && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
            {loyaltyPoints.toLocaleString("vi-VN")} điểm
          </span>
        )}
      </div>

      {/* Hiển thị tối đa 2 mã dạng thu gọn */}
      <ul className="space-y-1.5">
        {previewItems.map((item) =>
          renderVoucherCard(item, { compact: true, closeAfterPick: false }),
        )}
      </ul>

      {/* Nút mở Popup xem tất cả */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-accent/50 bg-accent/5 py-1.5 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/10"
        >
          <span>Xem thêm ({items.length - PREVIEW_LIMIT} mã khác)</span>
          <span aria-hidden>→</span>
        </button>
      )}

      {modalContent}
    </div>
  );
}