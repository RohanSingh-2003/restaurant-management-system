import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Clock,
  BellRing,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Check,
  Utensils,
} from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { Card } from '../../components/ui/Card';

export function WaiterDashboard() {
  const navigate = useNavigate();
  const {
    tables,
    orders,
    requests,
    updateStatus,
    acknowledgeRequest,
    completeRequest,
    markTableAvailable,
  } = useOperationalData();

  // Operational metrics
  const totalTables = tables.length;
  const occupiedTables = tables.filter((t) => t.status === 'Occupied').length;
  const preparingOrders = orders.filter((o) => o.status === 'Preparing').length;
  const readyOrders = orders.filter((o) => o.status === 'Ready');
  const pendingRequests = requests.filter((r) => r.status === 'Pending');
  const acknowledgedRequests = requests.filter((r) => r.status === 'Acknowledged');
  const activeOrders = orders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled');
  const tablesNeedingReset = tables.filter((t) => t.status === 'Needs Reset');

  const handleMarkServed = (orderId: string) => {
    updateStatus(orderId, 'Served');
  };

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Page Header matching Manager */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Waiter Dashboard</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage tables, service and customer requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/waiter/tables')}
            className="px-3.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-neutral-400" />
            Floor Tables
          </button>
          <button
            onClick={() => navigate('/waiter/requests')}
            className="px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Customer Requests ({pendingRequests.length})
          </button>
        </div>
      </div>

      {/* 2. Customer Requests Alert Banner if any pending */}
      {pendingRequests.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800">
                  {pendingRequests.length} {pendingRequests.length === 1 ? 'Customer Service Request' : 'Customer Service Requests'} Pending!
                </p>
                <p className="text-xs text-neutral-500">
                  Guests have requested assistance (water, bill, cutlery). Please attend promptly.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/waiter/requests')}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg shrink-0 transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
            >
              View Requests <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Ready Orders Alert Banner if any ready */}
      {readyOrders.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <BellRing className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800">
                  {readyOrders.length} {readyOrders.length === 1 ? 'Order is' : 'Orders are'} Ready for Table Delivery!
                </p>
                <p className="text-xs text-neutral-500">
                  Kitchen has finished preparation. Ready to be served to guests.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/waiter/orders/ready')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shrink-0 transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
            >
              View Ready Orders <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Operational Counters (Exact 5 required metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="p-4 border border-neutral-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Tables Assigned</span>
            <LayoutGrid className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-neutral-800">{totalTables}</div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Total dining floor tables</p>
        </Card>

        <Card className="p-4 border border-neutral-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Occupied Tables</span>
            <Utensils className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-800">{occupiedTables}</div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Guests seated & dining</p>
        </Card>

        <Card className="p-4 border border-neutral-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Orders Preparing</span>
            <Clock className="h-4 w-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-800">{preparingOrders}</div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Cooking in the kitchen</p>
        </Card>

        <Card className="p-4 border border-neutral-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Ready for Service</span>
            <BellRing className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-800">{readyOrders.length}</div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Awaiting server delivery</p>
        </Card>

        <Card className="col-span-2 sm:col-span-1 p-4 border border-neutral-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Customer Requests</span>
            <MessageSquare className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-800">
            {pendingRequests.length}
            {acknowledgedRequests.length > 0 && (
              <span className="text-xs font-normal text-neutral-400 ml-1.5">
                (+{acknowledgedRequests.length} in progress)
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Service calls needing attention</p>
        </Card>
      </div>

      {/* 5. Two-Column Operational Panels: Pending Requests & Ready Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Requests Panel */}
        <Card padding="none" className="border border-neutral-200 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-neutral-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Customer Service Requests
              </h2>
            </div>
            <button
              onClick={() => navigate('/waiter/requests')}
              className="text-xs font-semibold text-accent hover:text-accent-light flex items-center gap-1 cursor-pointer"
            >
              All Requests <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="p-4 divide-y divide-neutral-100">
            {requests.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">No customer requests.</p>
            ) : (
              requests.slice(0, 4).map((req) => (
                <div key={req.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-800">Table {req.tableNumber}</span>
                      <span className="text-xs text-neutral-500 font-medium">• {req.type}</span>
                    </div>
                    {req.details && (
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">{req.details}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'Pending' ? (
                      <button
                        onClick={() => acknowledgeRequest(req.id)}
                        className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-medium shadow-xs transition-colors cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    ) : req.status === 'Acknowledged' ? (
                      <button
                        onClick={() => completeRequest(req.id)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium shadow-xs transition-colors cursor-pointer"
                      >
                        Complete
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-neutral-400">Completed</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Ready for Service Panel */}
        <Card padding="none" className="border border-neutral-200 bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-neutral-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Ready for Service ({readyOrders.length})
              </h2>
            </div>
            <button
              onClick={() => navigate('/waiter/orders/ready')}
              className="text-xs font-semibold text-accent hover:text-accent-light flex items-center gap-1 cursor-pointer"
            >
              All Ready <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="p-4 divide-y divide-neutral-100">
            {readyOrders.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">No orders currently waiting for service.</p>
            ) : (
              readyOrders.slice(0, 4).map((order) => (
                <div key={order.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-800">Table {order.tableNumber}</span>
                      <span className="text-[11px] font-mono text-neutral-400">{order.orderNumber}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {order.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleMarkServed(order.id)}
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Serve Order
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 6. Table Turnover Notice if any table needs reset */}
      {tablesNeedingReset.length > 0 && (
        <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-800">
                Table Turnover Required: {tablesNeedingReset.map((t) => `Table ${t.number}`).join(', ')}
              </p>
              <p className="text-[11px] text-neutral-500">
                Bill settled. Clean and reset table to make available for next guests.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {tablesNeedingReset.map((t) => (
              <button
                key={t.id}
                onClick={() => markTableAvailable(t.id)}
                className="px-2.5 py-1 rounded bg-purple-700 hover:bg-purple-800 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                Reset Table {t.number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7. Active Orders Live List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Active Restaurant Orders ({activeOrders.length})
          </h2>
          <button
            onClick={() => navigate('/waiter/orders')}
            className="text-xs font-semibold text-accent hover:text-accent-light transition-colors flex items-center gap-1 cursor-pointer"
          >
            Manage Active Orders <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {activeOrders.length === 0 ? (
          <Card className="p-8 text-center border border-dashed border-neutral-200 bg-white">
            <p className="text-xs text-neutral-400">No active orders right now.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeOrders.slice(0, 6).map((order) => {
              const isReady = order.status === 'Ready';
              return (
                <Card
                  key={order.id}
                  padding="none"
                  className="p-4 flex flex-col justify-between space-y-3 border border-neutral-200 bg-white shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                      <div>
                        <span className="text-xs font-bold text-neutral-800 font-mono">{order.orderNumber}</span>
                        <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                          Table {order.tableNumber}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
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
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      {order.items.map((it) => (
                        <div key={it.id} className="text-xs text-neutral-600 flex justify-between">
                          <span className="truncate pr-2">
                            {it.quantity} × {it.productName}
                          </span>
                          <span className="font-medium shrink-0">
                            £{(it.quantity * it.unitPrice).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.specialInstructions && (
                      <div className="mt-2 text-[11px] text-amber-700 bg-amber-50/70 p-1.5 rounded border border-amber-200/50">
                        <span className="font-semibold">Note:</span> {order.specialInstructions}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-neutral-400">Total</span>
                      <p className="text-sm font-bold text-neutral-900">£{order.totalAmount.toFixed(2)}</p>
                    </div>

                    {isReady ? (
                      <button
                        onClick={() => handleMarkServed(order.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Serve Order
                      </button>
                    ) : order.status === 'Pending' ? (
                      <button
                        onClick={() => updateStatus(order.id, 'Confirmed')}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Confirm Order
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/waiter/orders')}
                        className="text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
                      >
                        View Details →
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
