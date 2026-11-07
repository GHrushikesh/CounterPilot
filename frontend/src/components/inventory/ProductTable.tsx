import React from 'react';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';
import type { Product } from '../../types';
import { StockBadge } from './StockBadge';

interface ProductTableProps {
  products: Product[];
  onRestock?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onRestock,
  onEdit,
  onDelete,
}) => {
  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const hasActions = Boolean(onRestock || onEdit || onDelete);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-medium">
            <th className="py-3 px-4">Product Name & SKU</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4 text-right">Purchase Price</th>
            <th className="py-3 px-4 text-right">Selling Price</th>
            <th className="py-3 px-4 text-right">Current Stock</th>
            <th className="py-3 px-4 text-center">Unit</th>
            <th className="py-3 px-4 text-center">Status</th>
            {hasActions && <th className="py-3 px-4 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((p) => {
            const stockNum = parseFloat(String(p.current_stock)) || 0;
            const minStockNum = parseFloat(String(p.minimum_stock)) || 0;
            const isNeedRestock = stockNum <= minStockNum;

            return (
              <tr
                key={p.id}
                className="hover:bg-slate-50/60 transition-colors group"
              >
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  {p.sku && (
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      SKU: {p.sku}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700">
                    {p.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-600">
                  {formatCurrency(p.purchase_price)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                  {formatCurrency(p.selling_price)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                  {stockNum}
                </td>
                <td className="py-3 px-4 text-center text-slate-500 capitalize">
                  {p.unit}
                </td>
                <td className="py-3 px-4 text-center">
                  <StockBadge
                    currentStock={p.current_stock}
                    minimumStock={p.minimum_stock}
                    unit={p.unit}
                    isLowStock={p.is_low_stock}
                  />
                </td>
                {hasActions && (
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {onRestock && (
                        <button
                          onClick={() => onRestock(p)}
                          title="Restock / Refill stock"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95 cursor-pointer ${
                            isNeedRestock
                              ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-2xs'
                              : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                          }`}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Restock</span>
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(p)}
                          title="Edit Product Details"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg active:scale-95 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(p)}
                          title="Delete / Deactivate Product"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg active:scale-95 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
