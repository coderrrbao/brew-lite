import ProductView from '@/components/ProductView';
import { getProduct } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  return <ProductView product={product} />;
}
