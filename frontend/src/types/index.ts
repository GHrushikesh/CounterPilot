export interface Product {
  id: number;
  name: string;
  category: string;
  sku: string | null;
  selling_price: string | number;
  purchase_price: string | number;
  current_stock: string | number;
  minimum_stock: string | number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_low_stock: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface HealthResponse {
  status: string;
  application: string;
}

export interface InventorySummary {
  total_products: number;
  low_stock_count: number;
  categories_count: number;
}

export interface ProductQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  low_stock?: boolean;
}
