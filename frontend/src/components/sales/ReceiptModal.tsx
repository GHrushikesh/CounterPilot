import React from 'react';
import { Printer, CheckCircle, X } from 'lucide-react';
import type { Sale } from '../../types';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  onClose,
  onNewSale,
}) => {
  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formattedDate = new Date(sale.created_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-emerald-50/70">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Bill Generated Successfully</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div id="thermal-receipt" className="p-5 font-mono text-xs text-slate-800 bg-white">
          <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
            <h2 className="font-bold text-sm tracking-wider uppercase text-slate-900">
              Ujjam Computers
            </h2>
            <p className="text-[10px] text-slate-500">Retail Operating Counter</p>
            <p className="text-[10px] text-slate-400">GSTIN: Unregistered Retailer</p>
          </div>

          <div className="text-[11px] space-y-1 mb-3 text-slate-600">
            <div className="flex justify-between">
              <span>Bill No:</span>
              <span className="font-semibold text-slate-800">{sale.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formattedDate}</span>
            </div>
            {sale.customer_name && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{sale.customer_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <span className="font-semibold text-emerald-700">{sale.payment_method}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-[11px] mb-3 border-t border-b border-dashed border-slate-300 py-1">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="text-left py-1 font-normal">Item</th>
                <th className="text-center py-1 font-normal">Qty</th>
                <th className="text-right py-1 font-normal">Rate</th>
                <th className="text-right py-1 font-normal">Amt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-1.5 text-left max-w-[120px] truncate">{it.product_name}</td>
                  <td className="py-1.5 text-center">{parseFloat(String(it.quantity))}</td>
                  <td className="py-1.5 text-right">{parseFloat(String(it.unit_price)).toFixed(2)}</td>
                  <td className="py-1.5 text-right font-medium">{parseFloat(String(it.total_price)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-1 text-[11px] text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {parseFloat(String(sale.discount_amount)) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span>- {formatCurrency(sale.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-300 text-slate-900">
              <span>Total Payable:</span>
              <span>{formatCurrency(sale.total_amount)}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-4 border-t border-dashed border-slate-300 pt-2">
            *** Thank you! Visit Again! ***
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs"
          >
            <span>Next Sale</span>
          </button>
        </div>
      </div>
    </div>
  );
};
