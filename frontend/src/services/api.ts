import type {
  HealthResponse,
  PaginatedResponse,
  Product,
  ProductQueryParams,
  InventorySummary,
  Sale,
  SaleCreatePayload,
  TransactionItem,
  AssistantChatRequest,
  AssistantChatResponse,
  ProductCreatePayload,
  ProductUpdatePayload,
  ProductRestockPayload,
  StoreSetting,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      let errorBody: any = null;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiError(
        errorBody?.message || `Request failed with status ${response.status}`,
        response.status,
        errorBody
      );
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Network connection failed. Ensure the CounterPilot backend is running.',
      0
    );
  }
}

export const apiService = {
  getHealth: async (): Promise<HealthResponse> => {
    return request<HealthResponse>('health');
  },

  getProducts: async (params: ProductQueryParams = {}): Promise<PaginatedResponse<Product>> => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set('page', params.page.toString());
    if (params.page_size !== undefined) query.set('page_size', params.page_size.toString());
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.low_stock !== undefined) query.set('low_stock', params.low_stock.toString());

    const qs = query.toString();
    const endpoint = qs ? `products?${qs}` : 'products';
    return request<PaginatedResponse<Product>>(endpoint);
  },

  getProductSummary: async (): Promise<InventorySummary> => {
    return request<InventorySummary>('products/summary');
  },

  createSale: async (payload: SaleCreatePayload): Promise<Sale> => {
    return request<Sale>('sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getSales: async (page = 1, pageSize = 10): Promise<PaginatedResponse<Sale>> => {
    return request<PaginatedResponse<Sale>>(`sales?page=${page}&page_size=${pageSize}`);
  },

  getSale: async (id: number): Promise<Sale> => {
    return request<Sale>(`sales/${id}`);
  },

  getTransactions: async (page = 1, pageSize = 20): Promise<PaginatedResponse<TransactionItem>> => {
    return request<PaginatedResponse<TransactionItem>>(`transactions?page=${page}&page_size=${pageSize}`);
  },

  sendAssistantMessage: async (payload: AssistantChatRequest): Promise<AssistantChatResponse> => {
    return request<AssistantChatResponse>('assistant/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createProduct: async (payload: ProductCreatePayload): Promise<Product> => {
    return request<Product>('products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateProduct: async (id: number, payload: ProductUpdatePayload): Promise<Product> => {
    return request<Product>(`products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  restockProduct: async (id: number, payload: ProductRestockPayload): Promise<Product> => {
    return request<Product>(`products/${id}/restock`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteProduct: async (id: number): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`products/${id}`, {
      method: 'DELETE',
    });
  },

  getStoreSettings: async (): Promise<StoreSetting> => {
    return request<StoreSetting>('settings');
  },

  updateStoreSettings: async (payload: Partial<StoreSetting>): Promise<StoreSetting> => {
    return request<StoreSetting>('settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};
