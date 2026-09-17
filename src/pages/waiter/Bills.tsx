import { useState, useMemo } from 'react';
import {
  CreditCard,
  Banknote,
  Smartphone,
  X,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { Card } from '../../components/ui/Card';
import type { OperationalOrder, PaymentMethod } from '../../types/operational';

export function WaiterBillsPage() {
  const { orders, tables, payOrder, markTableAvailable } = useOperationalData();

  const [selectedOrderForBill, setSelectedOrderForBill] = useState<OperationalOrder | null>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<OperationalOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'SETTLED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // Active orders with bills (not completed/cancelled)
  const pendingBills = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status !== 'Completed' &&
        o.status !== 'Cancelled' &&
        (!o.payment || o.payment.status !== 'Paid')
    );
  }, [orders]);

  // Settled bills
  const settledBills = useMemo(() => {
    return orders.filter((o) => o.status === 'Completed' || o.payment?.status === 'Paid');
  }, [orders]);

  // Tables currently needing reset
  const tablesNeedingReset = useMemo(() => {
    return tables.filter((t) => t.status === 'Needs Reset');
  }, [tables]);

  const displayedOrders = activeTab === 'PENDING' ? pendingBills : settledBills;

  const filteredOrders = useMemo(() => {
    return displayedOrders.filter((o) => {
      const matchQuery =
        searchQuery === '' ||
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `Table ${o.tableNumber}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchQuery;
    });
  }, [displayedOrders, searchQuery]);

  const handleProcessPayment = () => {
    if (!selectedOrderForPayment) return;
    payOrder(selectedOrderForPayment.id, paymentMethod);
    setSelectedOrderForPayment(null);
  };

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Table Billing & Payment</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage table bills, take payments, and conduct table turnover.
          </p>
        </div>
      </div>

      {/* Table Turnover Attention Banner if any table needs reset */}
      {tablesNeedingReset.length > 0 && (
        <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800">
                  {tablesNeedingReset.length} {tablesNeedingReset.length === 1 ? 'Table Needs' : 'Tables Need'} Reset / Cleaning
                </p>
                <p className="text-xs text-neutral-500">
                  Bill has been settled. Clear and reset table to make available for upcoming guests.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {tablesNeedingReset.map((t) => (
                <button
                  key={t.id}
                  onClick={() => markTableAvailable(t.id)}
                  className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Mark Table {t.number} Available
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-neutral-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Awaiting Payment ({pendingBills.length})
          </button>
          <button
            onClick={() => setActiveTab('SETTLED')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'SETTLED'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Settled History ({settledBills.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search order or table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-md text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Bills Table */}
      <Card padding="none" className="border border-neutral-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-400">
                    No bills found in this view.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPaid = order.payment?.status === 'Paid' || order.status === 'Completed';
                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-neutral-800">
                        Table {order.tableNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-neutral-800">{order.orderNumber}</span>
                        <div className="text-[11px] text-neutral-400">
                          {order.source === 'CUSTOMER' ? 'Customer Self-Order' : 'Staff Order'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="max-w-xs text-neutral-600 truncate">
                          {order.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {order.items.reduce((sum, it) => sum + it.quantity, 0)} total items
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-neutral-600 font-medium">
                        £{order.subtotal.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-neutral-900">
                        £{order.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isPaid ? 'Paid' : 'Pending Payment'}
                        </span>
                        {order.payment?.method && (
                          <span className="ml-1 text-[10px] text-neutral-400">
                            ({order.payment.method})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrderForBill(order)}
                            className="px-2.5 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium shadow-xs transition-colors cursor-pointer"
                          >
                            View Bill
                          </button>

                          {!isPaid && (
                            <button
                              onClick={() => setSelectedOrderForPayment(order)}
                              className="px-3 py-1 rounded bg-accent hover:bg-accent-light text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            >
                              Take Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: View Bill */}
      {selectedOrderForBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-800">
                  Itemized Bill — Table {selectedOrderForBill.tableNumber}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">{selectedOrderForBill.orderNumber}</p>
              </div>
              <button
                onClick={() => setSelectedOrderForBill(null)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto pr-1">
              {selectedOrderForBill.items.map((it) => (
                <div key={it.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-neutral-800">{it.productName}</span>
                    <p className="text-[11px] text-neutral-400">
                      {it.quantity} × £{it.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-bold text-neutral-900">
                    £{(it.quantity * it.unitPrice).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span>£{selectedOrderForBill.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-900 font-bold text-sm pt-1 border-t border-neutral-100">
                <span>Total Due</span>
                <span className="text-accent">£{selectedOrderForBill.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedOrderForBill(null)}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
              {selectedOrderForBill.status !== 'Completed' && (
                <button
                  onClick={() => {
                    const ord = selectedOrderForBill;
                    setSelectedOrderForBill(null);
                    setSelectedOrderForPayment(ord);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-semibold cursor-pointer"
                >
                  Take Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Take Payment */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-800">
                  Settle Bill — Table {selectedOrderForPayment.tableNumber}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">{selectedOrderForPayment.orderNumber}</p>
              </div>
              <button
                onClick={() => setSelectedOrderForPayment(null)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 text-center border border-neutral-200/60">
              <span className="text-xs text-neutral-500">Amount Due</span>
              <div className="text-2xl font-bold text-neutral-900 mt-0.5">
                £{selectedOrderForPayment.totalAmount.toFixed(2)}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                {selectedOrderForPayment.items.length} items ordered
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`p-3 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'Cash'
                      ? 'border-accent bg-accent-bg text-accent font-semibold'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <Banknote className="h-5 w-5" />
                  <span className="text-xs">Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Card')}
                  className={`p-3 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'Card'
                      ? 'border-accent bg-accent-bg text-accent font-semibold'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'UPI'
                      ? 'border-accent bg-accent-bg text-accent font-semibold'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <Smartphone className="h-5 w-5" />
                  <span className="text-xs">UPI</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 text-center">
              Recording payment marks the order as Completed and sets Table {selectedOrderForPayment.tableNumber} for turnover reset.
            </p>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForPayment(null)}
                className="px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Confirm Payment (£{selectedOrderForPayment.totalAmount.toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
