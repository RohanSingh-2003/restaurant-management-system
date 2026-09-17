import { useState, useMemo } from 'react';
import { Search, CheckCircle2, Receipt } from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { Card } from '../../components/ui/Card';
import { BillModal } from './BillModal';
import type { OperationalOrder } from '../../types/operational';

export function OrderHistoryPage() {
  const { orders } = useOperationalData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<OperationalOrder | null>(null);

  const completedOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === 'Completed')
      .filter((o) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          `table ${o.tableNumber}`.toLowerCase().includes(q) ||
          o.items.some((it) => it.productName.toLowerCase().includes(q))
        );
      });
  }, [orders, searchQuery]);

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Header matching Manager */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Order History</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Operational ledger of completed and paid dining orders.
          </p>
        </div>
        <div className="text-xs text-neutral-400">
          Total Completed: <strong className="text-neutral-800 font-semibold">{completedOrders.length}</strong>
        </div>
      </div>

      {/* 2. Search */}
      <Card padding="none" className="p-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search completed order #, table, or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
          />
        </div>
      </Card>

      {/* 3. Completed Orders Table */}
      <Card padding="none" className="overflow-hidden">
        {completedOrders.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            No completed orders recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-25/50 border-b border-neutral-100 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Table</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Completed At</th>
                  <th className="px-5 py-3">Payment Status</th>
                  <th className="px-5 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {completedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-neutral-800 font-mono">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                        Table {order.tableNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-sm truncate text-neutral-600">
                      {order.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')}
                    </td>
                    <td className="px-5 py-3.5 font-semibold font-mono text-neutral-900">
                      £{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-400">
                      {new Date(order.updatedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-success-light text-success">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                        {order.payment?.status || 'Paid'} ({order.payment?.method || 'Card'})
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedReceipt(order)}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="View Paid Bill"
                      >
                        <Receipt className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Paid Receipt View Modal */}
      {selectedReceipt && (
        <BillModal
          order={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onPay={() => {}}
        />
      )}
    </div>
  );
}
