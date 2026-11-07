import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { apiService } from '../services/api';
import type { TransactionItem, PaginatedResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const TransactionsPage: React.FC = () => {
  const [data, setData] = useState<PaginatedResponse<TransactionItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const pageSize = 20;

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await apiService.getTransactions(page, pageSize);
      setData(res);
    } catch {
      // Handled cleanly
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const filteredItems = data?.items.filter((item) => {
    if (!typeFilter) return true;
    return item.transaction_type === typeFilter;
  }) || [];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SALE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <TrendingDown className="w-3 h-3" />
            <span>SALE</span>
          </span>
        );
      case 'INITIAL_STOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-800 border border-orange-200/80">
            <Layers className="w-3 h-3" />
            <span>INITIAL STOCK</span>
          </span>
        );
      case 'RESTOCK':
      case 'PURCHASE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <TrendingUp className="w-3 h-3" />
            <span>RESTOCK</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span>{type}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Inventory Movement & Audit Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable audit record of all counter sales, restocks, and stock calibrations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-md px-2 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none text-xs"
            >
              <option value="">All Movements</option>
              <option value="SALE">Sales Only</option>
              <option value="INITIAL_STOCK">Initial Stock</option>
              <option value="RESTOCK">Restock / Purchases</option>
            </select>
          </div>

          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 apple-glass-button rounded-xl shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-2xs">
          <LoadingSpinner label="Retrieving immutable audit ledger from SQLite..." />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Stock Level Change</th>
                  <th className="py-3 px-4">Audit Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((tx) => {
                  const qty = parseFloat(String(tx.quantity));
                  const prev = parseFloat(String(tx.previous_stock));
                  const next = parseFloat(String(tx.new_stock));

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {tx.product_name}
                      </td>
                      <td className="py-3 px-4">
                        {getTypeBadge(tx.transaction_type)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {tx.transaction_type === 'SALE' ? `-${qty}` : `+${qty}`} {tx.product_unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px]">
                        <span className="text-slate-400">{prev}</span>
                        <span className="mx-1.5 text-slate-300">→</span>
                        <span className="font-semibold text-slate-800">{next}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                        {tx.note || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
              <div>
                Showing page <span className="font-semibold text-slate-900">{data.page}</span> of{' '}
                <span className="font-semibold text-slate-900">{data.total_pages}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.page <= 1}
                  className="p-1.5 rounded border border-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  disabled={data.page >= data.total_pages}
                  className="p-1.5 rounded border border-slate-300 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs">
          <EmptyState
            icon={ArrowLeftRight}
            title="No Movements Recorded"
            description="Stock movements will automatically log here as products are sold or replenished."
          />
        </div>
      )}
    </div>
  );
};
