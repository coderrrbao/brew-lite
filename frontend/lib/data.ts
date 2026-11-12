export type Category = 'all' | 'hot' | 'cold' | 'specialty';

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  description: string;
  category: Exclude<Category, 'all'>;
  popular?: boolean;
}

export interface SizeOption {
  label: string;
  value: 'S' | 'M' | 'L';
  priceAdd: number;
}

export interface Topping {
  id: string;
  label: string;
  price: number;
}

export const sizes: SizeOption[] = [
  { label: 'Nhỏ (S)', value: 'S', priceAdd: 0 },
  { label: 'Vừa (M)', value: 'M', priceAdd: 5000 },
  { label: 'Lớn (L)', value: 'L', priceAdd: 10000 },
];

export const toppings: Topping[] = [
  { id: 'extra-shot', label: 'Extra Shot Espresso', price: 8000 },
  { id: 'cream-foam', label: 'Foam Kem Tươi', price: 6000 },
  { id: 'pearl', label: 'Trân Châu Đen', price: 7000 },
  { id: 'coconut-jelly', label: 'Thạch Dừa', price: 5000 },
  { id: 'syrup', label: 'Syrup Caramel', price: 4000 },
];

export function getProductImageUrl(id: string, w = 600, h = 600) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
