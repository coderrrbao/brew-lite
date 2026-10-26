export type PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Promotion {
  code: string;
  description: string;
  type: PromotionType;
  value: number;
  minimumOrderAmount: number;
  maximumDiscountAmount?: number;
  active: boolean;
}

export const mockPromotions: Promotion[] = [
  {
    code: 'BREW10',
    description: 'Giảm 10% cho đơn hàng từ 50.000đ',
    type: 'PERCENTAGE',
    value: 10,
    minimumOrderAmount: 50000,
    maximumDiscountAmount: 20000,
    active: true,
  },
  {
    code: 'WELCOME15',
    description: 'Giảm 15% cho đơn hàng từ 100.000đ',
    type: 'PERCENTAGE',
    value: 15,
    minimumOrderAmount: 100000,
    maximumDiscountAmount: 30000,
    active: true,
  },
  {
    code: 'CAFE5000',
    description: 'Giảm 5.000đ cho đơn hàng từ 30.000đ',
    type: 'FIXED_AMOUNT',
    value: 5000,
    minimumOrderAmount: 30000,
    active: true,
  },
];
