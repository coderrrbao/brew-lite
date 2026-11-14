'use client';

import { useTransition } from 'react';
import { PageShell, btnPrimary } from '@/components/ui';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [isPending, startTransition] = useTransition();

  return (
    <PageShell className="text-center">
      <h1 className="text-3xl font-semibold">Không tải được menu</h1>
      <p className="mt-2 text-muted-foreground">Đã xảy ra lỗi khi kết nối máy chủ.</p>
      <button
        type="button"
        onClick={() => startTransition(reset)}
        disabled={isPending}
        className={`${btnPrimary} mt-6`}
      >
        {isPending ? 'Đang thử lại...' : 'Thử lại'}
      </button>
    </PageShell>
  );
}
