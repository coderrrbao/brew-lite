import { Suspense } from 'react';
import CheckoutView from '@/components/CheckoutView';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CheckoutView />
    </Suspense>
  );
}