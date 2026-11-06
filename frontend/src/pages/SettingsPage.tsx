import React from 'react';
import { Database, Store } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Shop & System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure business details, taxation rules, currency, and data backups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Shop Profile Placeholder */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-semibold text-slate-900">
              Workspace Profile
            </h2>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 block mb-1">Shop Name</label>
              <input
                type="text"
                disabled
                value="Ujjam Computers"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Primary Currency</label>
              <input
                type="text"
                disabled
                value="INR (₹) - Indian Rupee"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-slate-700 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Workspace profile customization will be configurable in subsequent releases.
            </p>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-semibold text-slate-900">
              Database Configuration
            </h2>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 block mb-1">Database Engine</label>
              <input
                type="text"
                disabled
                value="SQLite (counterpilot.db) via SQLAlchemy"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-slate-700 font-mono text-[11px] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Decimal Arithmetic</label>
              <input
                type="text"
                disabled
                value="Enabled (Strict Decimal-compatible storage)"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-slate-700 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Zero-setup, local, self-contained single-file database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
