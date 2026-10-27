import MenuView from '@/components/MenuView';
import { getProducts } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const products = await getProducts();
  return <MenuView products={products} />;
}
