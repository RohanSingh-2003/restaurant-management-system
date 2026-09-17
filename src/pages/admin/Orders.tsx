import { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  X,
  AlertCircle,
} from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { Card } from '../../components/ui/Card';
import type { OperationalOrder, OrderStatus } from '../../types/operational';

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'Pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Confirmed':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Preparing':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Ready':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Served':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Completed':
      return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    case 'Cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-neutral-100 text-neutral-600 border-neutral-200';
  }
}

export function AdminOrders() {
  const { orders, updateStatus } = useOperationalData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [inspectOrder, setInspectOrder] = useState<OperationalOrder | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === 'All' || o.status.toLowerCase() === statusFilter.toLowerCase();
      const matchSource = sourceFilter === 'All' || o.source === sourceFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        `table ${o.tableNumber}`.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.waiterName && o.waiterName.toLowerCase().includes(q)) ||
        o.items.some((it) => it.productName.toLowerCase().includes(q));
      return matchStatus && matchSource && matchSearch;
    });
  }, [orders, statusFilter, sourceFilter, searchQuery]);

  const handleAdvanceStatus = (orderId: string, nextStatus: OrderStatus) => {
    setActionError(null);
    try {
      updateStatus(orderId, nextStatus);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Status update failed.');
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Operational Orders</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Master operational ledger of customer and waiter dining orders.
          </p>
        </div>
        <div className="text-xs text-neutral-500 font-medium">
          Total Orders: <strong className="text-neutral-800 font-bold">{orders.length}</strong>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-error/20 bg-error-light px-4 py-3 text-xs text-error flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search order #, table, customer or waiter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-1.5">
          {['All', 'CUSTOMER', 'WAITER'].map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer
                ${
                  sourceFilter === src
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }
              `}
            >
              {src === 'All' ? 'All Sources' : src}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Pending', 'Preparing', 'Ready', 'Served', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap
                ${
                  statusFilter === st
                    ? 'bg-accent text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }
              `}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <Card padding="none" className="overflow-hidden border border-neutral-200 bg-white shadow-xs">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            No operational orders match the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/75 border-b border-neutral-100 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Table</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Handled By</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Workflow / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.map((ord) => {
                  const isCustomer = ord.source === 'CUSTOMER';

                  return (
                    <tr key={ord.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-neutral-900 font-mono block">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {ord.items.length} items
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                          Table {ord.tableNumber}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded
                            ${
                              isCustomer
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-neutral-100 text-neutral-700'
                            }
                          `}
                        >
                          {ord.source}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-700">
                        {isCustomer
                          ? ord.customerName || 'Customer Guest'
                          : ord.waiterName || 'Floor Server'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                            ord.status
                          )}`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold font-mono text-neutral-900">
                        £{ord.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-neutral-400">
                        {new Date(ord.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Valid State Machine Controls */}
                          {ord.status === 'Pending' && (
                            <button
                              onClick={() => handleAdvanceStatus(ord.id, 'Preparing')}
                              className="px-2.5 py-1 rounded text-[11px] font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                              title="Advance to Preparing"
                            >
                              Start Prep
                            </button>
                          )}
                          {ord.status === 'Preparing' && (
                            <button
                              onClick={() => handleAdvanceStatus(ord.id, 'Ready')}
                              className="px-2.5 py-1 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                              title="Mark Food Ready"
                            >
                              Mark Ready
                            </button>
                          )}
                          {ord.status === 'Ready' && (
                            <button
                              onClick={() => handleAdvanceStatus(ord.id, 'Served')}
                              className="px-2.5 py-1 rounded text-[11px] font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                              title="Mark Served to Table"
                            >
                              Mark Served
                            </button>
                          )}
                          {ord.status === 'Served' && (
                            <button
                              onClick={() => handleAdvanceStatus(ord.id, 'Completed')}
                              className="px-2.5 py-1 rounded text-[11px] font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="Mark Completed"
                            >
                              Complete
                            </button>
                          )}

                          <button
                            onClick={() => setInspectOrder(ord)}
                            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Inspect Order Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Inspect Order Modal */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  {inspectOrder.orderNumber} • Table {inspectOrder.tableNumber}
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Source: {inspectOrder.source} • Status: {inspectOrder.status}
                </p>
              </div>
              <button
                onClick={() => setInspectOrder(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="divide-y divide-neutral-100 max-h-56 overflow-y-auto pr-1">
                {inspectOrder.items.map((it) => (
                  <div key={it.id} className="py-2 flex justify-between">
                    <div>
                      <p className="font-semibold text-neutral-800">{it.productName}</p>
                      <p className="text-[10px] text-neutral-400">
                        {it.category} {it.notes ? `• "${it.notes}"` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-900">
                        {it.quantity} × £{it.unitPrice.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        £{(it.quantity * it.unitPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {inspectOrder.specialInstructions && (
                <div className="p-3 bg-neutral-50 rounded-lg text-neutral-600">
                  <span className="font-bold text-[10px] uppercase text-neutral-400 block mb-0.5">
                    Special Instructions:
                  </span>
                  {inspectOrder.specialInstructions}
                </div>
              )}

              <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                <span className="font-bold text-neutral-700">Total Amount:</span>
                <span className="text-base font-bold text-accent">
                  £{inspectOrder.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-100">
              <button
                onClick={() => setInspectOrder(null)}
                className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
