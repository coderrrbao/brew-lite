import type { Category } from '../utils';
import { ApiError, request } from './client';

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
  value: string;
  label: string;
  priceAdd: number;
}
export interface Topping {
  id: string;
  label: string;
  price: number;
  active?: boolean;
}

export async function getProducts(): Promise<Product[]> {
  return request<Product[]>('/products');
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    return await request<Product>(`/products/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getSizes(): Promise<SizeOption[]> {
  return request<SizeOption[]>('/sizes');
}

export async function getToppings(): Promise<Topping[]> {
  return request<Topping[]>('/toppings');
}