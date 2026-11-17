export type Category = 'all' | 'hot' | 'cold' | 'specialty';


export function getProductImageUrl(id: string, w = 600, h = 600) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
