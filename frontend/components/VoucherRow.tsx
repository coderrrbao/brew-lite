'use client';

import { useState } from 'react';
import { validatePromotion, type PromotionValidation } from '@/lib/api/promotions';
import { useStore } from '@/lib/store';
import { btnOutline, inputCls } from './ui';

export function useVoucher() {
  const { cartTotal } = useStore();
  const [voucher, setVoucher] = useState<{ code: string; discountAmount: number } | null>(null);
  const discount = voucher?.discountAmount ?? 0;

  return { voucher, discount, payable: Math.max(0, cartTotal - discount), setVoucher };
}

export default function VoucherRow({
  disabled = false,
  voucher,
  onApplied,
}: {
  disabled?: boolean;
  voucher: { code: string; discountAmount: number } | null;
  onApplied: (promotion: { code: string; result: PromotionValidation }) => void;
}) {
  const { cartTotal } = useStore();
  const [code, setCode] = useState(voucher?.code ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function applyVoucher() {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setError('Vui lòng nhập mã giảm giá.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await validatePromotion(normalizedCode, cartTotal);
      if (!result.isValid) {
        setError('Mã giảm giá chưa đủ điều kiện áp dụng cho đơn hàng này.');
        return;
      }
      onApplied({ code: normalizedCode, result });
    } catch {
      setError('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            if (error) setError('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void applyVoucher();
          }}
          disabled={disabled || loading}
          placeholder="Nhập mã giảm giá"
          aria-label="Mã giảm giá"
          className={`${inputCls} uppercase`}
        />
        <button
          type="button"
          onClick={() => void applyVoucher()}
          disabled={disabled || loading}
          className={`${btnOutline} shrink-0`}
        >
          {loading ? 'Đang kiểm tra…' : 'Áp dụng'}
        </button>
      </div>
      {voucher && (
        <p className="mt-2 text-sm text-success">
          Đã áp dụng mã <strong>{voucher.code}</strong>.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-[#8a2a20]">
          {error}
        </p>
      )}
    </div>
  );
}
