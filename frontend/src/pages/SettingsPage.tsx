import React, { useState, useEffect } from 'react';
import { Database, Store, CheckCircle, Save, Loader2, Sparkles, MapPin, Phone, FileText } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const SettingsPage: React.FC = () => {
  const { settings, updateShopSettings, loading } = useStore();

  const [shopName, setShopName] = useState(settings?.shop_name || 'CounterPilot Store');
  const [tagline, setTagline] = useState(settings?.tagline || '');
  const [address, setAddress] = useState(settings?.address || '');
  const [phone, setPhone] = useState(settings?.phone || '');
  const [gstin, setGstin] = useState(settings?.gstin || '');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setShopName(settings.shop_name || '');
      setTagline(settings.tagline || '');
      setAddress(settings.address || '');
      setPhone(settings.phone || '');
      setGstin(settings.gstin || '');
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setError('Shop name cannot be empty.');
      return;
    }

    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      await updateShopSettings({
        shop_name: shopName.trim(),
        tagline: tagline.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        gstin: gstin.trim() || undefined,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update store settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-3 border-b border-slate-200/60">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 display-heading">
          Shop & System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-normal">
          Customize your shop identity, billing header, contact details, and database persistence.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Shop settings saved successfully! Your custom shop name is updated across the top navigation, thermal receipts, dashboard, and AI assistant.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 text-xs font-medium flex items-center gap-2.5">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Store Identity Form */}
        <div className="lg:col-span-2 apple-card p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Business & Receipt Profile
              </h2>
              <p className="text-[11px] text-slate-500">
                Changes saved here persist in SQLite and survive browser refreshes.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1.5">
                Shop / Store Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sharma Kirana & General Store"
                className="w-full bg-white/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all placeholder:text-slate-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Displayed on the top header, thermal receipt bill header, and used by the retail AI assistant.
              </p>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Tagline / Subtitle</span>
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Fresh Groceries, Spices & Daily Essentials"
                className="w-full bg-white/70 border border-slate-200/90 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-700 font-semibold block mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact Phone</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-white/70 border border-slate-200/90 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>GSTIN / Tax ID</span>
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="e.g. 27AAAAA0000A1Z5 or Unregistered"
                  className="w-full bg-white/70 border border-slate-200/90 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Shop Address</span>
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop No. 12, Main Bazaar, Near Old Post Office, Pune, MH - 411001"
                className="w-full bg-white/70 border border-slate-200/90 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold apple-glass-button-primary rounded-xl active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Shop Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Database & System Info Card */}
        <div className="space-y-6">
          <div className="apple-card p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Storage & Engine
                </h2>
                <p className="text-[11px] text-slate-500">
                  Zero-loss local ACID persistence.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-500 font-medium block mb-1">Database Engine</label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 font-mono text-[11px] text-slate-700">
                  SQLite (counterpilot.db) via SQLAlchemy
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">Decimal Arithmetic</label>
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Strict Decimal(10,2) Precision</span>
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">Primary Currency</label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-800 font-medium">
                  INR (₹) - Indian Rupee
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200/60 text-orange-900 text-[11px] leading-relaxed">
                <span className="font-semibold block mb-0.5">Persistent Progress</span>
                All inventory edits, added products, restock entries, sales bills, and shop profile settings are written directly to the database file. Reloading the page retains 100% of your data.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
