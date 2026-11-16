import type { Product } from '../data';
import { ApiError, request } from './client';

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
