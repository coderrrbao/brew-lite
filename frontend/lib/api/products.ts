import { products as localProducts, type Product } from "../data";
import { request } from "./client";

export async function getProducts(): Promise<Product[]> {
  try {
    return await request<Product[]>("/products", {
      method: "GET",
    });
  } catch {
    return localProducts;
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    return await request<Product>(`/products/${id}`);
  } catch {
    return localProducts.find((product) => product.id === id) ?? null;
  }
}
