import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Eye,
  CheckCircle2,
  AlertCircle,
  BellRing,
  RotateCcw,
  Check,
  Receipt,
  UserPlus,
} from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { Card } from '../../components/ui/Card';
import type { OperationalOrder, RestaurantTable } from '../../types/operational';

export function TablesPage() {
  const navigate = useNavigate();
  const {
    tables,
    orders,
    requests,
    updateStatus,
    updateTable,
    markTableAvailable,
  } = useOperationalData();

  const [selectedTableDetail, setSelectedTableDetail] = useState<{
    table: RestaurantTable;
    order?: OperationalOrder;
  } | null>(null);

  const getTableOrder = (table: RestaurantTable): OperationalOrder | undefined => {
    return orders.find(
      (o) =>
        (o.id === table.currentOrderId || o.tableId === table.id) &&
        o.status !== 'Completed' &&
        o.status !== 'Cancelled'
    );
  };

  const getTablePendingRequest = (table: RestaurantTable) => {
    return requests.find((r) => (r.tableId === table.id || r.tableNumber === table.number) && r.status === 'Pending');
  };

  const handleSeatTable = (tableId: string) => {
    updateTable(tableId, { status: 'Occupied' });
  };

  const handleServeOrder = (orderId: string) => {
    updateStatus(orderId, 'Served');
  };

  // Counters
  const availableCount = tables.filter((t) => t.status === 'Available').length;
  const occupiedCount = tables.filter((t) => t.status === 'Occupied').length;
  const needsResetCount = tables.filter((t) => t.status === 'Needs Reset').length;

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Table Management</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Dining floor tables, live guest occupancy, service states and turnover.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Available ({availableCount})
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            Occupied ({occupiedCount})
          </span>
          {needsResetCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-200">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
              Needs Reset ({needsResetCount})
            </span>
          )}
        </div>
      </div>

      {/* 2. Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => {
          const order = getTableOrder(table);
          const pendingReq = getTablePendingRequest(table);
          const isReadyToServe = order?.status === 'Ready';
          const isNeedsReset = table.status === 'Needs Reset';
          const isOccupied = table.status === 'Occupied' || !!order;

          // Compute badge label and styling
          let badgeText = 'Available';
          let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

          if (isNeedsReset) {
            badgeText = 'Needs Reset';
            badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
          } else if (pendingReq) {
            badgeText = 'Needs Attention';
            badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
          } else if (isReadyToServe) {
            badgeText = 'Ready to Serve';
            badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse';
          } else if (isOccupied) {
            badgeText = 'Occupied';
            badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
          }

          return (
            <Card
              key={table.id}
              padding="none"
              className={`p-4 flex flex-col justify-between transition-all border ${
                isNeedsReset
                  ? 'border-purple-200 bg-purple-50/20'
                  : pendingReq
                  ? 'border-rose-200 bg-rose-50/20'
                  : isReadyToServe
                  ? 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                  : isOccupied
                  ? 'border-amber-200 bg-amber-50/10'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div>
                {/* Table Title and Status Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isNeedsReset
                          ? 'bg-purple-100 text-purple-900'
                          : isReadyToServe
                          ? 'bg-emerald-100 text-emerald-900'
                          : isOccupied
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {table.number}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-800">Table {table.number}</h3>
                      <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <Users className="h-3 w-3" /> {table.capacity} Seats
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>

                {/* Table Dining Info */}
                <div className="py-3 min-h-[84px]">
                  {isNeedsReset ? (
                    <div className="h-full flex flex-col justify-center items-center text-purple-700 py-2 text-center">
                      <RotateCcw className="h-5 w-5 mb-1" />
                      <p className="text-xs font-semibold">Bill Settled</p>
                      <p className="text-[11px] text-purple-500">Table needs cleaning & reset</p>
                    </div>
                  ) : pendingReq ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{pendingReq.type}</span>
                      </div>
                      {pendingReq.details && (
                        <p className="text-[11px] text-neutral-500 truncate">{pendingReq.details}</p>
                      )}
                      <button
                        onClick={() => navigate('/waiter/requests')}
                        className="text-[11px] text-accent hover:underline font-medium mt-1 block"
                      >
                        Respond to request →
                      </button>
                    </div>
                  ) : isOccupied && order ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-neutral-500">
                        <span>
                          Order: <strong className="text-neutral-800 font-mono">{order.orderNumber}</strong>
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full border ${
                            order.status === 'Ready'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.status === 'Preparing'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-neutral-600 truncate">
                        {order.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
                      </p>
                      <div className="pt-1 flex justify-between items-center font-semibold text-neutral-800">
                        <span>Total:</span>
                        <span className="font-mono text-neutral-900">£{order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center text-neutral-400 py-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600/70 mb-1" />
                      <p className="text-xs">Ready for guests</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Table Action Buttons */}
              <div className="pt-3 border-t border-neutral-100">
                {isNeedsReset ? (
                  <button
                    onClick={() => markTableAvailable(table.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark Table Ready
                  </button>
                ) : isReadyToServe && order ? (
                  <button
                    onClick={() => handleServeOrder(order.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    Serve Order
                  </button>
                ) : isOccupied ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (order) setSelectedTableDetail({ table, order });
                      }}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Table
                    </button>
                    <button
                      onClick={() => navigate('/waiter/bills')}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      Bill
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSeatTable(table.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Seat / Open Table
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* View Table Order Details Modal */}
      {selectedTableDetail?.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-neutral-200">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-neutral-800">
                  Table {selectedTableDetail.table.number} — Order Details
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  {selectedTableDetail.order.orderNumber} &bull; Status: {selectedTableDetail.order.status}
                </p>
              </div>
              <button
                onClick={() => setSelectedTableDetail(null)}
                className="text-xs font-medium text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg p-3">
                {selectedTableDetail.order.items.map((it, idx) => (
                  <div key={idx} className="py-2 flex justify-between text-xs">
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

              {selectedTableDetail.order.specialInstructions && (
                <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/60 text-xs text-neutral-700">
                  <strong className="text-amber-800">Special Instructions:</strong> {selectedTableDetail.order.specialInstructions}
                </div>
              )}

              <div className="pt-2 flex justify-between items-center text-sm font-bold border-t border-neutral-100">
                <span>Total Amount:</span>
                <span className="font-mono text-accent">£{selectedTableDetail.order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTableDetail(null)}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedTableDetail(null);
                  navigate('/waiter/bills');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-semibold cursor-pointer"
              >
                Manage Bill & Payment →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
