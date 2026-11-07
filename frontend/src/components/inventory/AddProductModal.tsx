import React, { useState } from 'react';
import { X, Plus, PackagePlus, AlertCircle, Loader2 } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Product, ProductCreatePayload } from '../../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: Product) => void;
  existingCategories?: string[];
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

const DEFAULT_CATEGORIES = [
  'Groceries',
  'Grains & Staples',
  'Dairy & Eggs',
  'Snacks & Biscuits',
  'Beverages',
  'Personal Care',
  'Spices & Masala',
  'Household',
  'Electronics',
  'General',
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingCategories = [],
}) => {
  const mergedCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...existingCategories.filter(Boolean)])
  );

  const [name, setName] = useState('');
  const [category, setCategory] = useState(mergedCategories[0] || 'Groceries');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [sku, setSku] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [initialStock, setInitialStock] = useState('10');
  const [minimumStock, setMinimumStock] = useState('5');
  const [unit, setUnit] = useState('piece');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Product name is required.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    if (!finalCategory) {
      setError('Category is required.');
      return;
    }

    const pPrice = parseFloat(purchasePrice);
    const sPrice = parseFloat(sellingPrice);
    const stock = parseFloat(initialStock);
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
      setError('Please provide a valid non-negative initial stock.');
      return;
    }
    if (isNaN(minStock) || minStock < 0) {
      setError('Please provide a valid non-negative minimum stock alert threshold.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: ProductCreatePayload = {
        name: trimmedName,
        category: finalCategory,
        sku: sku.trim() || undefined,
        purchase_price: pPrice,
        selling_price: sPrice,
        current_stock: stock,
        minimum_stock: minStock,
        unit: unit.trim().toLowerCase() || 'piece',
      };

      const created = await apiService.createProduct(payload);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create product.');
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
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Add New Product</h2>
              <p className="text-[11px] text-slate-500">Add an item to your retail shop catalog</p>
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
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tata Salt 1kg or Basmati Rice 5kg"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              {!isCustomCategory ? (
                <div className="space-y-1">
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  >
                    {mergedCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__custom__">+ Add Custom Category...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(false)}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                SKU / Barcode <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. GROC-099"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 placeholder:text-slate-400"
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
                placeholder="0.00"
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
                placeholder="0.00"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Initial Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
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
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
