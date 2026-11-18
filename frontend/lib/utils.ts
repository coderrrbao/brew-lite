export type Category = 'all' | 'hot' | 'cold' | 'specialty';


export function getProductImageUrl(id: string, w = 600, h = 600) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function createIdempotencyKey(orderId?: string): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return orderId ? `pay_${orderId}_${uuid}` : `pay_${uuid}`;
}