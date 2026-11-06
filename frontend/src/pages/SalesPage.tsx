import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
} from 'lucide-react';
import { apiService } from '../services/api';
import type { Product, Sale } from '../types';
import { ReceiptModal } from '../components/sales/ReceiptModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

interface CartItem {
  product: Product;
  quantity: number;
}

export const SalesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'billing' | 'history'>('billing');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'KHATA'>('CASH');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Completed Sale for Receipt
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Sales History
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchCatalog = async () => {
    setLoadingProducts(true);
    try {
      const res = await apiService.getProducts({ page_size: 50 });
      setProducts(res.items);
    } catch {
      setErrorMsg('Failed to load product catalog.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await apiService.getSales(1, 20);
      setSalesHistory(res.items);
    } catch {
      // Ignored for now
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const categories = Array.from(new Set(products.map((p) => p.category))).sort();

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === '' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setErrorMsg(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount('0');
    setCustomerName('');
    setCustomerPhone('');
    setErrorMsg(null);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => {
    const price = typeof item.product.selling_price === 'number'
      ? item.product.selling_price
      : parseFloat(item.product.selling_price);
    return sum + price * item.quantity;
  }, 0);

  const discountNum = Math.max(0, parseFloat(discount) || 0);
  const totalPayable = Math.max(0, subtotal - discountNum);

  // Validation: Check if any item exceeds available stock
  const stockExceededItem = cart.find(
    (item) => item.quantity > parseFloat(String(item.product.current_stock))
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (stockExceededItem) {
      setErrorMsg(
        `Quantity for ${stockExceededItem.product.name} exceeds available stock (${stockExceededItem.product.current_stock} ${stockExceededItem.product.unit}).`
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
        discount_amount: discountNum,
        payment_method: paymentMethod,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
      };

      const sale = await apiService.createSale(payload);
      setCompletedSale(sale);
      clearCart();
      fetchCatalog(); // Refresh available stock levels in catalog
    } catch (err: any) {
      setErrorMsg(err.message || 'Checkout failed. Please review stock and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Counter Sales & Billing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Instant counter billing, stock deduction, and thermal invoice generation.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'billing'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Counter POS
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'history'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past Bills
          </button>
        </div>
      </div>

      {/* POS Billing Mode */}
      {activeTab === 'billing' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Product Catalog & Quick Add (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Quick search product or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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

            {/* Catalog Grid */}
            {loadingProducts ? (
              <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-2xs">
                <LoadingSpinner label="Loading retail catalog..." />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const stock = parseFloat(String(p.current_stock));
                  const outOfStock = stock <= 0;

                  return (
                    <div
                      key={p.id}
                      onClick={() => !outOfStock && addToCart(p)}
                      className={`p-3.5 rounded-lg border transition-all text-left flex flex-col justify-between ${
                        outOfStock
                          ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-2xs cursor-pointer group'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                            {p.name}
                          </h4>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {p.sku || p.category}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {formatCurrency(p.selling_price)}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            outOfStock
                              ? 'bg-rose-50 text-rose-700'
                              : p.is_low_stock
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {outOfStock ? 'Out of Stock' : `${stock} ${p.unit} left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs">
                <EmptyState
                  icon={Receipt}
                  title="No Products Found"
                  description="Try adjusting your search or category filter."
                />
              </div>
            )}
          </div>

          {/* Right Column: Active Cart & Checkout (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Current Bill</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                  <Receipt className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-500 font-medium">Cart is empty</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click on products from the left to start billing.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const maxStock = parseFloat(String(item.product.current_stock));
                  const isExceeded = item.quantity > maxStock;
                  const itemPrice = typeof item.product.selling_price === 'number'
                    ? item.product.selling_price
                    : parseFloat(item.product.selling_price);

                  return (
                    <div
                      key={item.product.id}
                      className={`p-2.5 rounded-md border flex items-center justify-between gap-2 ${
                        isExceeded ? 'bg-rose-50/50 border-rose-300' : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formatCurrency(itemPrice)} × {item.quantity} ={' '}
                          <span className="font-mono font-medium text-slate-800">
                            {formatCurrency(itemPrice * item.quantity)}
                          </span>
                        </div>
                        {isExceeded && (
                          <div className="text-[10px] text-rose-600 font-medium">
                            Max stock available: {maxStock}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-mono text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bill Summary & Payment Form */}
            {cart.length > 0 && (
              <div className="space-y-4 pt-3 border-t border-slate-200">
                {/* Customer Details Optional */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Customer Name (optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Phone (optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                    Payment Method:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {[
                      { key: 'CASH', label: 'Cash', icon: Banknote },
                      { key: 'UPI', label: 'UPI / QR', icon: QrCode },
                      { key: 'CARD', label: 'Card', icon: CreditCard },
                      { key: 'KHATA', label: 'Khata', icon: BookOpen },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const selected = paymentMethod === mode.key;
                      return (
                        <button
                          key={mode.key}
                          type="button"
                          onClick={() => setPaymentMethod(mode.key as any)}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded border text-xs font-medium transition-all ${
                            selected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-1" />
                          <span className="text-[10px]">{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Financial breakdown */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Discount (₹):</span>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-20 px-2 py-0.5 text-right font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="text-emerald-700 font-mono">
                      {formatCurrency(totalPayable)}
                    </span>
                  </div>
                </div>

                {/* Checkout Submit */}
                <button
                  onClick={handleCheckout}
                  disabled={submitting || !!stockExceededItem}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Generating Bill...' : `Complete Sale (${formatCurrency(totalPayable)})`}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Mode */
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Invoices</h2>
              <p className="text-xs text-slate-500">Record of counter bills issued to customers</p>
            </div>
            <button
              onClick={fetchHistory}
              className="text-xs text-emerald-700 font-medium hover:underline"
            >
              Refresh
            </button>
          </div>

          {loadingHistory ? (
            <LoadingSpinner label="Loading bills..." />
          ) : salesHistory.length > 0 ? (
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Invoice No</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3 text-right">Items</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesHistory.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                        {s.invoice_number}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(s.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {s.customer_name || 'Walk-in'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {s.payment_method}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {s.items?.length || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(s.total_amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setCompletedSale(s)}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-medium"
                        >
                          <Printer className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No Sales Recorded Yet"
              description="Complete your first sale in the Counter POS tab."
            />
          )}
        </div>
      )}

      {/* Thermal Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
          onNewSale={() => {
            setCompletedSale(null);
            setActiveTab('billing');
          }}
        />
      )}
    </div>
  );
};
