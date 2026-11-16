'use client';

import { PageShell, btnPrimary } from '@/components/ui';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageShell className="text-center">
      <h1 className="text-3xl font-semibold">Lỗi tải sản phẩm</h1>
      <p className="mt-2 text-muted-foreground">Không thể tải thông tin sản phẩm.</p>
      <button onClick={reset} className={`${btnPrimary} mt-6`}>Thử lại</button>
    </PageShell>
  );
}
