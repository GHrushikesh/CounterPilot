import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  Layers,
  ArrowRight,
  Bot,
  Activity,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { apiService } from '../services/api';
import type { Product, InventorySummary } from '../types';
import { ProductTable } from '../components/inventory/ProductTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, productsRes, lowStockRes] = await Promise.all([
        apiService.getProductSummary(),
        apiService.getProducts({ page: 1, page_size: 5 }),
        apiService.getProducts({ low_stock: true, page_size: 5 }),
      ]);
      setSummary(summaryRes);
      setRecentProducts(productsRes.items);
      setLowStockProducts(lowStockRes.items);
    } catch (err: any) {
      setError(err.message || 'Unable to load dashboard data from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, Ujjam Computers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time retail inventory overview and technical foundation status.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Banner if API unreachable */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadDashboardData}
            className="underline font-medium hover:text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Prominent AI Assistant Entry Point */}
      <div className="rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  CounterPilot AI Assistant
                </h3>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Phase 2 Feature
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Run your shop through natural conversation. Soon you will be able to ask questions like:
                <span className="italic text-slate-800"> "Which items are below minimum stock?"</span>,{' '}
                <span className="italic text-slate-800">"What did we order most last week?"</span>, or{' '}
                <span className="italic text-slate-800">"Record sale of 2 Maggi packets"</span>.
              </p>
            </div>
          </div>
          <Link
            to="/assistant"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors shrink-0 self-start md:self-center"
          >
            <span>Preview Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Foundational Metrics Grid (Real Data from SQLite) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Products</span>
            <div className="p-2 rounded bg-slate-100 text-slate-600">
              <Package className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
            {loading ? '—' : summary?.total_products ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Active in catalog database</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Low Stock Warnings</span>
            <div className="p-2 rounded bg-amber-50 text-amber-700">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
            {loading ? '—' : summary?.low_stock_count ?? 0}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            Items at or below minimum threshold
          </div>
        </div>

        {/* Active Categories */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Categories</span>
            <div className="p-2 rounded bg-slate-100 text-slate-600">
              <Layers className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
            {loading ? '—' : summary?.categories_count ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Retail merchandise classifications
          </div>
        </div>
      </div>

      {/* Main Grid: Inventory Overview & Low Stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Quick Inventory Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Inventory Overview
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest products synchronized from SQLite database
                </p>
              </div>
              <Link
                to="/inventory"
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>View all products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <LoadingSpinner label="Fetching live products from backend..." />
            ) : recentProducts.length > 0 ? (
              <ProductTable products={recentProducts} />
            ) : (
              <EmptyState
                icon={Package}
                title="No Products Found"
                description="Database does not contain any product records yet."
              />
            )}
          </div>

          {/* Recent Activity: Authentic Empty State */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent Sales & Activity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of counter sales and billing receipts
              </p>
            </div>
            <EmptyState
              icon={Activity}
              title="No Sales Transactions Recorded"
              description="No counter sales or transactions have been recorded yet. Live transaction history will appear here once the sales module is enabled in Phase 2."
            />
          </div>
        </div>

        {/* Right 1 Col: Urgent Low Stock Restock Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Low Stock Threshold Alerts
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              These items require replenishment based on defined minimum stock thresholds.
            </p>

            {loading ? (
              <LoadingSpinner label="Checking threshold warnings..." />
            ) : lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-md border border-amber-200/80 bg-amber-50/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Category: {item.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-amber-800">
                        {parseFloat(String(item.current_stock))} {item.unit}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Min: {parseFloat(String(item.minimum_stock))} {item.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                All inventory items are currently above their minimum stock thresholds.
              </div>
            )}
          </div>

          {/* Architecture Status Card */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-semibold text-slate-800 mb-2">
              System Health & Architecture
            </h3>
            <ul className="space-y-1.5 text-[11px] text-slate-600">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>FastAPI backend with Pydantic validation</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>SQLite relational storage with Decimal accuracy</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Foreign key delete-restriction on audit records</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Repeatable idempotent sample retail dataset</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
