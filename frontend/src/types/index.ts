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

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  unit_price: string | number;
  quantity: string | number;
  total_price: string | number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  subtotal: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  payment_method: 'CASH' | 'UPI' | 'CARD' | 'KHATA' | string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  created_at: string;
  items: SaleItem[];
}

export interface SaleCreatePayload {
  items: {
    product_id: number;
    quantity: number;
  }[];
  discount_amount?: number;
  payment_method: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface TransactionItem {
  id: number;
  product_id: number;
  product_name: string;
  product_unit: string;
  transaction_type: string;
  quantity: string | number;
  previous_stock: string | number;
  new_stock: string | number;
  note: string | null;
  created_at: string;
}
