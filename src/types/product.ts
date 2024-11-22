export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}

export interface ProductFilters {
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface ProductWithQuantity extends Product {
  quantity: number;
}

export interface ProductParams {
  id: string;
}
