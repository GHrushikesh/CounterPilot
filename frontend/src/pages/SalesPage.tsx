import React from 'react';
import { Receipt, Clock, Sparkles } from 'lucide-react';

export const SalesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Sales & Billing
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Counter sales recording, cash/UPI payment collection, and customer billing.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto mb-4">
          <Receipt className="w-6 h-6" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Scheduled for Phase 2</span>
        </div>
        <h2 className="text-base font-semibold text-slate-900 mb-2">
          Counter Billing & Sales Workflow
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          This module will provide rapid barcode/SKU checkout, conversational bill entry, payment method recording (Cash, UPI, Khata), and instant receipt generation tailored for Indian retail counters.
        </p>

        <div className="text-left bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Planned Capabilities:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
            <li>Instant counter billing with auto-inventory stock deduction</li>
            <li>UPI QR code generation and cash reconciliation</li>
            <li>Printable thermal receipt formats (58mm / 80mm)</li>
            <li>Voice-assisted quick sales logging</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
