import React from 'react';
import type { Product } from '../../types';
import { StockBadge } from './StockBadge';

interface ProductTableProps {
  products: Product[];
}

export const ProductTable: React.FC<ProductTableProps> = ({ products }) => {
  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
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
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((p) => {
            return (
              <tr
                key={p.id}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900">{p.name}</div>
                  {p.sku && (
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      SKU: {p.sku}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                    {p.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-600">
                  {formatCurrency(p.purchase_price)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                  {formatCurrency(p.selling_price)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-800">
                  {parseFloat(String(p.current_stock))}
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
