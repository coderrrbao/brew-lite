"use client";

import { formatPrice } from "@/lib/data";
import type { Promotions } from "@/lib/api/promotions";

function getShortBy(p: Promotions, cartTotal: number) {
  return p.minimumOrderAmount != null && cartTotal < p.minimumOrderAmount
    ? p.minimumOrderAmount - cartTotal
    : 0;
}

function TicketIcon({ size = 22 }: { size?: number }) {
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

function CheckIcon({ size = 22 }: { size?: number }) {
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

type Props = {
  promotions: Promotions[];
  cartTotal: number;
  appliedCode: string | null;
  disabled?: boolean;
  onPick: (code: string) => void;
};

export default function VoucherList({
  promotions,
  cartTotal,
  appliedCode,
  disabled,
  onPick,
}: Props) {
  if (promotions.length === 0) return null;

  // mã đủ điều kiện lên trước
  const items = promotions
    .map((p) => ({ p, shortBy: getShortBy(p, cartTotal) }))
    .sort((a, b) => Number(a.shortBy > 0) - Number(b.shortBy > 0));

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Mã giảm giá cho bạn
      </p>

      <ul className="space-y-2.5">
        {items.map(({ p, shortBy }) => {
          const eligible = shortBy === 0;
          const applied = appliedCode === p.code;
          const min = p.minimumOrderAmount ?? 0;
          const progress = min > 0 ? Math.min(100, (cartTotal / min) * 100) : 100;

          return (
            <li key={p.code}>
              <button
                type="button"
                onClick={() => onPick(p.code)}
                disabled={!eligible || disabled || applied}
                className={`flex w-full items-stretch overflow-hidden rounded-xl border text-left transition ${
                  !eligible
                    ? "cursor-not-allowed border-border bg-secondary/40 opacity-60 grayscale"
                    : applied
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-accent/50 bg-card hover:border-accent hover:bg-accent/5 hover:shadow-sm"
                }`}
              >
                {/* Cột trái: icon */}
                <span
                  className={`flex w-16 shrink-0 items-center justify-center border-r border-dashed ${
                    eligible
                      ? "border-accent/50 bg-accent text-accent-foreground"
                      : "border-border bg-secondary text-muted-foreground"
                  }`}
                >
                  {applied ? <CheckIcon /> : <TicketIcon />}
                </span>

                {/* Cột phải: nội dung */}
                <span className="block min-w-0 flex-1 px-4 py-3">
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-[15px] font-semibold tracking-wide">
                      {p.code}
                    </span>
                    {eligible && (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          applied
                            ? "bg-accent text-accent-foreground"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        {applied ? "Đang áp dụng" : "Áp dụng"}
                      </span>
                    )}
                  </span>

                  {p.descriptions && (
                    <span className="mt-1 block text-sm text-foreground/80">
                      {p.descriptions}
                    </span>
                  )}

                  {p.minimumOrderAmount != null && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Đơn tối thiểu {formatPrice(p.minimumOrderAmount)}
                    </span>
                  )}

                  {!eligible && (
                    <span className="mt-2 block">
                      <span className="block h-1.5 w-full overflow-hidden rounded-full bg-border">
                        <span
                          className="block h-full rounded-full bg-accent/60 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </span>
                      <span className="mt-1 block text-xs text-[#8a2a20]">
                        Mua thêm {formatPrice(shortBy)} để dùng mã
                      </span>
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}