import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { apiService } from '../services/api';
import type { Product, PaginatedResponse } from '../types';
import { ProductTable } from '../components/inventory/ProductTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const InventoryPage: React.FC = () => {
  const [productsData, setProductsData] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Available categories for filtering
  const [categories, setCategories] = useState<string[]>([]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getProducts({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        category: category || undefined,
        low_stock: lowStockOnly ? true : undefined,
      });
      setProductsData(data);

      // Extract unique categories across items
      if (categories.length === 0 && data.items.length > 0) {
        const uniqueCats = Array.from(new Set(data.items.map((i) => i.category))).sort();
        setCategories(uniqueCats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, category, lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setLowStockOnly(false);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time catalog, stock quantities, and minimum alert thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchProducts()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by name, SKU or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Low Stock Toggle */}
            <button
              type="button"
              onClick={() => {
                setLowStockOnly((prev) => !prev);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border font-medium transition-colors ${
                lowStockOnly
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${lowStockOnly ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>Low Stock Alerts</span>
            </button>

            {(search || category || lowStockOnly) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-slate-800 underline ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchProducts()}
            className="underline font-medium hover:text-rose-950"
          >
            Retry Request
          </button>
        </div>
      )}

      {/* Table & Data Representation */}
      {loading ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-2xs">
          <LoadingSpinner label="Retrieving live product catalog from SQLite database..." />
        </div>
      ) : productsData && productsData.items.length > 0 ? (
        <div className="space-y-4">
          <ProductTable products={productsData.items} />

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
            <div>
              Showing <span className="font-semibold text-slate-900">{productsData.items.length}</span> of{' '}
              <span className="font-semibold text-slate-900">{productsData.total}</span> products
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">
                Page {productsData.page} of {productsData.total_pages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={productsData.page <= 1}
                  className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(productsData.total_pages, p + 1))}
                  disabled={productsData.page >= productsData.total_pages}
                  className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs">
          <EmptyState
            icon={Package}
            title="No Matching Products Found"
            description={
              search || category || lowStockOnly
                ? 'No products matched your active search or filter criteria. Try resetting the filters.'
                : 'No inventory items are registered in the database.'
            }
            actionText={search || category || lowStockOnly ? 'Clear Filters' : undefined}
            onAction={clearFilters}
          />
        </div>
      )}
    </div>
  );
};
