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
  ShoppingCart,
} from 'lucide-react';
import { apiService } from '../services/api';
import type { Product, InventorySummary, Sale } from '../types';
import { ProductTable } from '../components/inventory/ProductTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useStore } from '../context/StoreContext';

export const DashboardPage: React.FC = () => {
  const { shopName } = useStore();
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, productsRes, lowStockRes, salesRes] = await Promise.all([
        apiService.getProductSummary(),
        apiService.getProducts({ page: 1, page_size: 5 }),
        apiService.getProducts({ low_stock: true, page_size: 5 }),
        apiService.getSales(1, 5),
      ]);
      setSummary(summaryRes);
      setRecentProducts(productsRes.items);
      setLowStockProducts(lowStockRes.items);
      setRecentSales(salesRes.items);
    } catch (err: any) {
      setError(err.message || 'Unable to load dashboard data from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 display-heading">
            Welcome back, {shopName}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Real-time retail inventory overview, counter billing, and system status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/sales"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold apple-glass-button-primary active:scale-95 rounded-xl transition-all cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>New Counter Bill</span>
          </Link>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 apple-glass-button rounded-xl active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner if API unreachable */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs">
          <span>{error}</span>
          <button
            onClick={loadDashboardData}
            className="underline font-medium hover:text-rose-950 active:scale-95"
          >
            Retry
          </button>
        </div>
      )}

      {/* Prominent AI Assistant Entry Point */}
      <div className="apple-card animate-apple-spring bg-gradient-to-r from-orange-50/70 via-white to-slate-50/50 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                  CounterPilot AI Assistant
                </h3>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-900 border border-orange-500/20">
                  Ready for Queries
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Run your shop through natural conversation. Query live stock:{' '}
                <span className="italic text-slate-800">"Which items are below minimum stock?"</span>,{' '}
                <span className="italic text-slate-800">"What did we bill most today?"</span>, or{' '}
                <span className="italic text-slate-800">"What were our sales yesterday?"</span>.
              </p>
            </div>
          </div>
          <Link
            to="/assistant"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold apple-glass-button text-orange-950 active:scale-95 rounded-xl transition-all shrink-0 self-start md:self-center cursor-pointer"
          >
            <span>Open Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Foundational Metrics Grid (Real Data from SQLite) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Products */}
        <div className="apple-card p-4 animate-apple-spring [animation-delay:60ms]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Products</span>
            <div className="p-2 rounded-lg bg-slate-100/80 text-slate-600">
              <Package className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2 tabular-nums">
            {loading ? '—' : summary?.total_products ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-orange-600" />
            <span>Active in catalog database</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="apple-card p-4 animate-apple-spring [animation-delay:120ms]">
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
        <div className="apple-card p-4 animate-apple-spring [animation-delay:180ms]">
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

      {/* Main Grid: Inventory Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Inventory Overview & Sales Activity */}
        <div className="lg:col-span-2 space-y-6">
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

          {/* Recent Activity: Shows Real Sales If Present */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Recent Sales & Activity
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live counter sales transactions and billing receipts
                </p>
              </div>
              <Link
                to="/sales"
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Counter POS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <LoadingSpinner label="Checking recent sales..." />
            ) : recentSales.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Invoice</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                          {sale.invoice_number}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(sale.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {sale.customer_name || 'Walk-in'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {sale.payment_method}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(sale.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Activity}
                title="No Sales Transactions Recorded Yet"
                description="No counter sales recorded yet. Click 'New Counter Bill' above to record your first sale."
                actionText="Go to Counter POS"
                onAction={() => window.location.assign('/sales')}
              />
            )}
          </div>
        </div>

        {/* Right 1 Col: Low Stock Alerts & Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Low Stock Threshold Alerts
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Items requiring replenishment based on minimum stock threshold.
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

          {/* Store Quick Actions */}
          <div className="apple-card p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-800 tracking-tight">
              Store Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <Link
                to="/sales"
                className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/70 hover:bg-orange-50 border border-orange-200/60 text-orange-950 font-medium transition-all group active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-3.5 h-3.5 text-orange-600" />
                  <span>Start Counter POS Bill</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-orange-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/inventory"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 text-slate-800 font-medium transition-all group active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-slate-600" />
                  <span>Manage Inventory & Restock</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/assistant"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 text-slate-800 font-medium transition-all group active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ask AI Store Assistant</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
