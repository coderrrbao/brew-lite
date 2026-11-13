"use client";

import { btnOutline, inputCls } from "./ui";

export default function VoucherRow({
  code,
  loading,
  error,
  appliedCode,
  disabled = false,
  onChange,
  onApply,
  onRemove,
}: {
  code: string;
  loading: boolean;
  error: string | null;
  appliedCode: string | null;
  disabled?: boolean;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
}) {
  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3">
        <p className="text-sm">
          <span className="text-accent">✓</span> Đã áp dụng mã{" "}
          <strong className="font-semibold">{appliedCode}</strong>
        </p>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition hover:text-foreground disabled:opacity-50"
        >
          Gỡ
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onApply();
          }}
          disabled={disabled || loading}
          placeholder="Nhập mã giảm giá"
          aria-label="Mã giảm giá"
          aria-invalid={!!error}
          className={`${inputCls} min-w-0 flex-1 uppercase placeholder:normal-case`}
        />
        <button
          type="button"
          onClick={onApply}
          disabled={disabled || loading || !code.trim()}
          className={`${btnOutline} shrink-0`}
        >
          {loading ? "Đang kiểm tra…" : "Áp dụng"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-[#8a2a20]">
          {error}
        </p>
      )}
    </div>
  );
}
