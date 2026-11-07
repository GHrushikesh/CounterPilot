import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  CheckCircle,
} from 'lucide-react';
import { apiService } from '../services/api';
import type { Product, PaginatedResponse } from '../types';
import { ProductTable } from '../components/inventory/ProductTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { AddProductModal } from '../components/inventory/AddProductModal';
import { RestockModal } from '../components/inventory/RestockModal';
import { EditProductModal } from '../components/inventory/EditProductModal';

export const InventoryPage: React.FC = () => {
  const [productsData, setProductsData] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Available categories for filtering
  const [categories, setCategories] = useState<string[]>([]);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

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
      if (data.items.length > 0) {
        setCategories((prev) => {
          const combined = Array.from(new Set([...prev, ...data.items.map((i) => i.category)])).sort();
          return combined;
        });
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

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleProductAdded = (newProduct: Product) => {
    showNotification(`Product "${newProduct.name}" added successfully to catalog.`);
    fetchProducts();
  };

  const handleProductRestocked = (updated: Product) => {
    showNotification(`Restocked "${updated.name}" — current stock is now ${updated.current_stock} ${updated.unit}s.`);
    fetchProducts();
  };

  const handleProductUpdated = (updated: Product) => {
    showNotification(`Product "${updated.name}" updated successfully.`);
    fetchProducts();
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${product.name}" from your catalog?\n\nHistorical transactions will be preserved.`
    );
    if (!confirmed) return;

    try {
      await apiService.deleteProduct(product.id);
      showNotification(`Product "${product.name}" removed from active inventory.`);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to delete product.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 display-heading">
            Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Real-time catalog, stock quantities, instant restocking, and alert thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold apple-glass-button-primary active:scale-95 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
          <button
            onClick={() => fetchProducts()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 apple-glass-button rounded-xl active:scale-95 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="apple-glass-container p-4 rounded-2xl space-y-3">
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
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white/70"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold apple-glass-button-primary active:scale-95 rounded-xl transition-all shadow-2xs cursor-pointer"
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
                className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border font-medium transition-colors cursor-pointer ${
                lowStockOnly
                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
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
                className="text-xs text-slate-500 hover:text-slate-800 underline ml-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchProducts()}
            className="underline font-medium hover:text-rose-950 cursor-pointer"
          >
            Retry Request
          </button>
        </div>
      )}

      {/* Table & Data Representation */}
      {loading ? (
        <div className="apple-card p-8 shadow-2xs">
          <LoadingSpinner label="Retrieving live product catalog from SQLite database..." />
        </div>
      ) : productsData && productsData.items.length > 0 ? (
        <div className="space-y-4">
          <ProductTable
            products={productsData.items}
            onRestock={(product) => setRestockProduct(product)}
            onEdit={(product) => setEditProduct(product)}
            onDelete={handleDeleteProduct}
          />

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80">
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
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(productsData.total_pages, p + 1))}
                  disabled={productsData.page >= productsData.total_pages}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="apple-card p-8 shadow-2xs">
          <EmptyState
            icon={Package}
            title="No Matching Products Found"
            description={
              search || category || lowStockOnly
                ? 'No products matched your active search or filter criteria. Try resetting the filters.'
                : 'No inventory items are registered in the database yet. Click "Add Product" above to create your shop catalog.'
            }
            actionText={search || category || lowStockOnly ? 'Clear Filters' : 'Add First Product'}
            onAction={search || category || lowStockOnly ? clearFilters : () => setIsAddOpen(true)}
          />
        </div>
      )}

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleProductAdded}
        existingCategories={categories}
      />

      {/* Restock Modal */}
      <RestockModal
        product={restockProduct}
        isOpen={Boolean(restockProduct)}
        onClose={() => setRestockProduct(null)}
        onSuccess={handleProductRestocked}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        product={editProduct}
        isOpen={Boolean(editProduct)}
        onClose={() => setEditProduct(null)}
        onSuccess={handleProductUpdated}
      />
    </div>
  );
};
