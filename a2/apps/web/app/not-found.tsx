import Link from 'next/link';
import { PageShell, btnPrimary } from '@/components/ui';

export default function NotFound() {
  return (
    <PageShell className="text-center">
      <h1 className="text-3xl font-semibold">404 - Không tìm thấy trang</h1>
      <p className="mt-2 text-muted-foreground">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link href="/" className={`${btnPrimary} mt-6`}>
        Quay lại thực đơn
      </Link>
    </PageShell>
  );
}
