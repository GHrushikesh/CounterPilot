import React, { useState, useEffect } from 'react';
import { X, Edit3, AlertCircle, Loader2 } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Product, ProductUpdatePayload } from '../../types';

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: Product) => void;
}

const COMMON_UNITS = [
  'piece',
  'packet',
  'kg',
  'gram',
  'litre',
  'ml',
  'box',
  'bottle',
  'bundle',
];

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minimumStock, setMinimumStock] = useState('');
  const [unit, setUnit] = useState('piece');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategory(product.category || 'Groceries');
      setSku(product.sku || '');
      setPurchasePrice(String(product.purchase_price ?? ''));
      setSellingPrice(String(product.selling_price ?? ''));
      setCurrentStock(String(product.current_stock ?? '0'));
      setMinimumStock(String(product.minimum_stock ?? '5'));
      setUnit(product.unit || 'piece');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Product name cannot be empty.');
      return;
    }

    const pPrice = parseFloat(purchasePrice);
    const sPrice = parseFloat(sellingPrice);
    const stock = parseFloat(currentStock);
    const minStock = parseFloat(minimumStock);

    if (isNaN(pPrice) || pPrice < 0) {
      setError('Please provide a valid non-negative purchase price.');
      return;
    }
    if (isNaN(sPrice) || sPrice < 0) {
      setError('Please provide a valid non-negative selling price.');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setError('Please provide a valid non-negative current stock.');
      return;
    }
    if (isNaN(minStock) || minStock < 0) {
      setError('Please provide a valid non-negative minimum stock alert threshold.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: ProductUpdatePayload = {
        name: trimmedName,
        category: category.trim(),
        sku: sku.trim() || undefined,
        purchase_price: pPrice,
        selling_price: sPrice,
        current_stock: stock,
        minimum_stock: minStock,
        unit: unit.trim().toLowerCase() || 'piece',
      };

      const updated = await apiService.updateProduct(product.id, payload);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="apple-card animate-apple-sheet max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 bg-orange-500/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-600">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Edit Product</h2>
              <p className="text-[11px] text-slate-500">Update item details, prices, or threshold</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Groceries"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                SKU / Barcode
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Cost / Purchase Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Selling Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Current Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Min. Alert <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 capitalize focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
