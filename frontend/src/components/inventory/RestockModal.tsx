import React, { useState } from 'react';
import { X, ArrowUpRight, AlertCircle, Loader2, PackageCheck } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Product } from '../../types';

interface RestockModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: Product) => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState('20');
  const [notes, setNotes] = useState('Supplier restock delivery');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentStockNum = parseFloat(String(product.current_stock)) || 0;
  const addedQty = parseFloat(quantity) || 0;
  const projectedStock = currentStockNum + (addedQty > 0 ? addedQty : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a restock quantity greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await apiService.restockProduct(product.id, {
        quantity: qty,
        note: notes.trim() || undefined,
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to restock product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="apple-card animate-apple-sheet max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 bg-orange-500/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-600">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Restock Product</h2>
              <p className="text-[11px] text-slate-500">Refill physical inventory & log audit trail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-semibold text-slate-900 text-sm block">{product.name}</span>
                <span className="text-[11px] font-mono text-slate-400">SKU: {product.sku || 'N/A'}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200/70 text-slate-700">
                {product.category}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200/50">
              <span className="text-slate-500">Current In Stock:</span>
              <span className={`font-mono font-semibold ${currentStockNum <= 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {currentStockNum} {product.unit}s {currentStockNum <= 0 ? '(Out of Stock)' : ''}
              </span>
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Quantity to Add ({product.unit}s) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="1"
              min="1"
              required
              autoFocus
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 50"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-base text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          {/* Projected Stock Preview */}
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-900 flex items-center justify-between font-medium">
            <span className="text-orange-800">New Total Stock After Restock:</span>
            <span className="font-mono font-bold text-sm text-orange-950">
              {projectedStock} {product.unit}s
            </span>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Audit Note / Reason <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received from wholesaler shipment"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold apple-glass-button-primary rounded-xl active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Stock...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Confirm Restock (+{quantity || 0})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
