import { useState } from 'react';
import { X, Receipt, CreditCard, Banknote, Smartphone, CheckCircle2 } from 'lucide-react';
import type { OperationalOrder, PaymentMethod } from '../../types/operational';

interface BillModalProps {
  order: OperationalOrder;
  onClose: () => void;
  onPay: (method: PaymentMethod) => void;
}

export function BillModal({ order, onClose, onPay }: BillModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Card');
  const [isProcessing, setIsProcessing] = useState(false);
  const isAlreadyPaid = order.payment?.status === 'Paid';

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onPay(selectedMethod);
      setIsProcessing(false);
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-neutral-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-25/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-neutral-100 text-neutral-700">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">Table {order.tableNumber} Bill</h3>
              <p className="text-[11px] text-neutral-400 font-mono">{order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Bill Receipt Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Order Details */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Order Items</p>
            <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-lg p-2 bg-neutral-25/50">
              {order.items.map((it, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <p className="font-medium text-neutral-800 truncate">
                      {it.quantity}× {it.productName}
                    </p>
                    <p className="text-[10px] text-neutral-400">£{it.unitPrice.toFixed(2)} each</p>
                  </div>
                  <span className="font-mono font-medium text-neutral-800">
                    £{(it.quantity * it.unitPrice).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Subtotal & Total */}
          <div className="border-t border-neutral-100 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span className="font-mono text-neutral-700">£{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-neutral-800 pt-1 border-t border-dashed border-neutral-200">
              <span>Total Amount</span>
              <span className="font-mono text-base font-bold text-neutral-900">£{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          {!isAlreadyPaid ? (
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <p className="text-xs font-semibold text-neutral-700">Select Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('Cash')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    selectedMethod === 'Cash'
                      ? 'border-neutral-800 bg-neutral-800 text-white shadow-xs'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <Banknote className="h-4 w-4 mb-1" />
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('Card')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    selectedMethod === 'Card'
                      ? 'border-neutral-800 bg-neutral-800 text-white shadow-xs'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <CreditCard className="h-4 w-4 mb-1" />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('UPI')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    selectedMethod === 'UPI'
                      ? 'border-neutral-800 bg-neutral-800 text-white shadow-xs'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <Smartphone className="h-4 w-4 mb-1" />
                  UPI
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-success-light border border-emerald-200 p-3 text-success text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>
                Paid in full via <strong>{order.payment?.method}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-25/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
          {!isAlreadyPaid && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmPayment}
              className="px-4 py-2 bg-accent hover:bg-accent-light text-white text-xs font-medium rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isProcessing ? 'Processing...' : `Pay £${order.totalAmount.toFixed(2)} & Release Table`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
