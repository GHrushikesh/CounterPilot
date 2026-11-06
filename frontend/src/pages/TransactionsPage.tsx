import React from 'react';
import { ArrowLeftRight, Clock, ShieldCheck } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Stock Transactions & Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical record of inventory movements, purchases, restocks, and adjustments.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto mb-4">
          <ArrowLeftRight className="w-6 h-6" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Scheduled for Subsequent Phases</span>
        </div>
        <h2 className="text-base font-semibold text-slate-900 mb-2">
          Immutable Inventory Movement Log
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          The database schema and foreign key constraints for <code className="font-mono text-emerald-800">InventoryTransaction</code> are fully established in the backend. The UI log viewer and manual adjustment forms will be unlocked alongside supplier invoice processing.
        </p>

        <div className="text-left bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Underlying Data Safety:</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            All inventory transactions are linked via database foreign keys with <span className="font-mono text-slate-800">RESTRICT</span> behavior to ensure historical movement data is never accidentally deleted or corrupted.
          </p>
        </div>
      </div>
    </div>
  );
};
