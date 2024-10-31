// Interface principal do produto
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

// Interface para criação de um novo produto
export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
}

// Interface para atualização de produto (todos os campos são opcionais)
export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}

// Interface para filtros de busca de produtos
export interface ProductFilters {
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

// Interface para produto no carrinho ou ordem
export interface ProductWithQuantity extends Product {
  quantity: number;
}
