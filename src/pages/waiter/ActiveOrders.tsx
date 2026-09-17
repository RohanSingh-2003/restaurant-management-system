import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Eye,
  CheckCircle2,
  Receipt,
  BellRing,
  Edit3,
  Trash2,
  Plus,
  Minus,
  Check,
  Send,
  X,
} from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { Card } from '../../components/ui/Card';
import type { OperationalOrder, OperationalOrderItem } from '../../types/operational';

export function ActiveOrdersPage() {
  const navigate = useNavigate();
  const {
    orders,
    updateStatus,
    modifyOrder,
    confirmOrder,
    sendToKitchen,
  } = useOperationalData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE_ALL');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OperationalOrder | null>(null);

  // Order modification state
  const [editingOrder, setEditingOrder] = useState<OperationalOrder | null>(null);
  const [editItems, setEditItems] = useState<OperationalOrderItem[]>([]);
  const [editInstructions, setEditInstructions] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Status filtering
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Filter tab
      if (selectedStatus === 'ACTIVE_ALL') {
        if (o.status === 'Completed' || o.status === 'Cancelled') return false;
      } else if (selectedStatus !== 'ALL') {
        if (o.status !== selectedStatus) return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = o.orderNumber.toLowerCase().includes(q);
        const matchTbl = `table ${o.tableNumber}`.toLowerCase().includes(q) || String(o.tableNumber) === q;
        const matchCust = (o.customerName || '').toLowerCase().includes(q);
        const matchItem = o.items.some((it) => it.productName.toLowerCase().includes(q));
        return matchNum || matchTbl || matchCust || matchItem;
      }

      return true;
    });
  }, [orders, selectedStatus, searchQuery]);

  const handleStartEdit = (order: OperationalOrder) => {
    setEditingOrder(order);
    setEditItems(JSON.parse(JSON.stringify(order.items)));
    setEditInstructions(order.specialInstructions || '');
    setEditError(null);
  };

  const handleSaveEdit = () => {
    if (!editingOrder) return;
    if (editItems.length === 0) {
      setEditError('An order must have at least one item.');
      return;
    }

    try {
      modifyOrder(editingOrder.id, {
        items: editItems,
        specialInstructions: editInstructions,
      });
      setEditingOrder(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update order.');
    }
  };

  const handleUpdateEditItemQty = (index: number, delta: number) => {
    setEditItems((prev) => {
      const copy = [...prev];
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, idx) => idx !== index);
      }
      copy[index] = { ...copy[index], quantity: newQty };
      return copy;
    });
  };

  const handleRemoveEditItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Active Orders Monitoring</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track kitchen preparation, coordinate with cook, and deliver served food to customer tables.
          </p>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <Card padding="none" className="p-3 border border-neutral-200 bg-white shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by Order #, Table #, Customer or dish name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'ACTIVE_ALL', label: 'All Active' },
              { id: 'Pending', label: 'Pending' },
              { id: 'Confirmed', label: 'Confirmed' },
              { id: 'Preparing', label: 'Preparing' },
              { id: 'Ready', label: 'Ready' },
              { id: 'Served', label: 'Served' },
              { id: 'ALL', label: 'All Orders' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer text-xs ${
                  selectedStatus === st.id
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 3. Orders Table */}
      <Card padding="none" className="border border-neutral-200 bg-white overflow-hidden shadow-xs">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            No orders found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-50/70 border-b border-neutral-200 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Table</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.map((order) => {
                  const isPending = order.status === 'Pending';
                  const isConfirmed = order.status === 'Confirmed';
                  const isReady = order.status === 'Ready';
                  const isServed = order.status === 'Served';
                  const isEditable = isPending || isConfirmed;

                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                      {/* Order Number */}
                      <td className="px-4 py-3.5 font-bold text-neutral-800 font-mono">
                        {order.orderNumber}
                      </td>

                      {/* Table */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800">
                          Table {order.tableNumber}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-neutral-700">
                          {order.customerName || 'Guest'}
                        </span>
                        <div className="text-[10px] text-neutral-400">
                          {order.source === 'CUSTOMER' ? 'Self-Service' : 'Staff'}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5 max-w-xs text-neutral-600">
                        <div className="truncate">
                          {order.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')}
                        </div>
                        {order.specialInstructions && (
                          <div className="text-[11px] text-amber-700 mt-0.5 truncate">
                            Note: {order.specialInstructions}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            order.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : order.status === 'Confirmed'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : order.status === 'Preparing'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : order.status === 'Ready'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.status === 'Served'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                          }`}
                        >
                          {isReady && <BellRing className="h-3 w-3" />}
                          {order.status}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3.5 text-neutral-400 text-[11px]">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Inspect */}
                          <button
                            onClick={() => setSelectedOrderDetail(order)}
                            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Inspect Order"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Modify (only if Pending or Confirmed) */}
                          {isEditable && (
                            <button
                              onClick={() => handleStartEdit(order)}
                              className="px-2 py-1 rounded bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                              title="Modify items or notes"
                            >
                              <Edit3 className="h-3 w-3" />
                              Modify
                            </button>
                          )}

                          {/* Kitchen Coordination: Confirm Order / Send to Kitchen */}
                          {isPending && (
                            <button
                              onClick={() => confirmOrder(order.id)}
                              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-md shadow-xs transition-colors text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="h-3 w-3" />
                              Confirm
                            </button>
                          )}

                          {isConfirmed && (
                            <button
                              onClick={() => sendToKitchen(order.id)}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-md shadow-xs transition-colors text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="h-3 w-3" />
                              Send to Kitchen
                            </button>
                          )}

                          {/* Ready: Serve Order */}
                          {isReady && (
                            <button
                              onClick={() => updateStatus(order.id, 'Served')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-xs transition-colors text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Serve Order
                            </button>
                          )}

                          {/* Served: Go to Bill */}
                          {isServed && (
                            <button
                              onClick={() => navigate('/waiter/bills')}
                              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-md shadow-xs transition-colors text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Receipt className="h-3 w-3" />
                              Bill
                            </button>
                          )}
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

      {/* Inspect Detail Modal */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-neutral-200">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-neutral-800">
                  {selectedOrderDetail.orderNumber} — Table {selectedOrderDetail.tableNumber}
                </h3>
                <p className="text-xs text-neutral-400">
                  Customer: {selectedOrderDetail.customerName || 'Guest'} &bull; Status: {selectedOrderDetail.status}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg p-3">
                {selectedOrderDetail.items.map((it, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between text-xs">
                    <div>
                      <p className="font-semibold text-neutral-800">
                        {it.quantity}× {it.productName}
                      </p>
                      {it.notes && <p className="text-[11px] text-amber-600">Note: {it.notes}</p>}
                    </div>
                    <span className="font-mono text-neutral-900 font-medium">
                      £{(it.quantity * it.unitPrice).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {selectedOrderDetail.specialInstructions && (
                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs text-neutral-700">
                  <strong className="text-amber-800">Special Instructions:</strong> {selectedOrderDetail.specialInstructions}
                </div>
              )}

              <div className="pt-2 flex justify-between items-center text-sm font-bold border-t border-neutral-100">
                <span>Total Amount:</span>
                <span className="font-mono text-accent">£{selectedOrderDetail.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
              {(selectedOrderDetail.status === 'Pending' || selectedOrderDetail.status === 'Confirmed') && (
                <button
                  onClick={() => {
                    const ord = selectedOrderDetail;
                    setSelectedOrderDetail(null);
                    handleStartEdit(ord);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer"
                >
                  Modify Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Modification Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-neutral-200">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-neutral-800">
                  Modify Order — {editingOrder.orderNumber} (Table {editingOrder.tableNumber})
                </h3>
                <p className="text-xs text-neutral-400">
                  Adjust quantities, remove items, or update kitchen notes before cooking starts.
                </p>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {editError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Order Items
                </label>
                <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
                  {editItems.map((item, idx) => (
                    <div key={item.id || idx} className="p-3 flex items-center justify-between gap-3 text-xs bg-white">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-800 truncate">{item.productName}</p>
                        <p className="text-[11px] text-neutral-400">£{item.unitPrice.toFixed(2)} each</p>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-neutral-200 rounded-md bg-white">
                        <button
                          type="button"
                          onClick={() => handleUpdateEditItemQty(idx, -1)}
                          className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-neutral-800 select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateEditItemQty(idx, 1)}
                          className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Line total & remove */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-neutral-900 w-14 text-right">
                          £{(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditItem(idx)}
                          className="p-1 text-neutral-300 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Special Kitchen Instructions
                </label>
                <textarea
                  rows={2}
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  placeholder="e.g. No onions, dressing on side..."
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Recalculated total */}
              <div className="pt-2 flex justify-between items-center text-sm font-bold border-t border-neutral-100">
                <span>Updated Total:</span>
                <span className="font-mono text-accent">
                  £{editItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
