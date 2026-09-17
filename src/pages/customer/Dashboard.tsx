import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  ClipboardList,
  Clock,
  Receipt,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Timer,
  BellRing,
  Check,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useOperationalData } from '../../hooks/useOperationalData';
import { useCart } from '../../hooks/useCart';
import { Card } from '../../components/ui/Card';
import type { OrderStatus, ServiceRequestType } from '../../types/operational';

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'Pending':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Pending (Sent to Kitchen)',
        icon: Timer,
      };
    case 'Preparing':
      return {
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        label: 'Preparing in Kitchen',
        icon: Timer,
      };
    case 'Ready':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'Food is Ready',
        icon: CheckCircle2,
      };
    case 'Served':
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        label: 'Served to Table',
        icon: CheckCircle2,
      };
    case 'Completed':
      return {
        bg: 'bg-neutral-50 text-neutral-600 border-neutral-200',
        label: 'Completed',
        icon: CheckCircle2,
      };
    default:
      return {
        bg: 'bg-neutral-50 text-neutral-600 border-neutral-200',
        label: status,
        icon: AlertCircle,
      };
  }
}

export function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orders, requests, createRequest } = useOperationalData();
  const { itemCount, tableNumber, total: cartTotal } = useCart();

  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  // Find active orders belonging to this customer or placed in this session
  const customerOrders = orders.filter(
    (o) =>
      o.customerId === user?.id ||
      o.customerName === user?.name ||
      (o.source === 'CUSTOMER' && user?.role === 'customer')
  );

  const activeOrder = customerOrders.find(
    (o) => o.status !== 'Completed' && o.status !== 'Cancelled'
  );

  const effectiveTableNumber = activeOrder?.tableNumber || tableNumber || 5;

  // Filter requests for this customer / table
  const myRequests = requests.filter(
    (r) =>
      r.customerId === user?.id ||
      r.tableNumber === effectiveTableNumber
  );

  const handleSendRequest = (type: ServiceRequestType) => {
    createRequest({
      tableId: `T${effectiveTableNumber}`,
      tableNumber: effectiveTableNumber,
      type,
      customerId: user?.id || 'usr_004',
      customerName: user?.name || 'Customer',
    });
    setRequestSuccess(`"${type}" sent to floor staff for Table ${effectiveTableNumber}!`);
    setTimeout(() => setRequestSuccess(null), 4000);
  };

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
            Welcome{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Browse the menu and manage your dining experience.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/customer/menu')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Browse Menu
          </button>
          {itemCount > 0 && (
            <button
              onClick={() => navigate('/customer/cart')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 shadow-xs transition-colors cursor-pointer"
            >
              <ClipboardList className="h-3.5 w-3.5 text-accent" />
              <span>Current Order ({itemCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Current Active Order Banner / Card */}
      {activeOrder ? (
        <Card className="p-5 border border-neutral-200 bg-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Current Active Order
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-lg font-bold text-neutral-900">{activeOrder.orderNumber}</h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                  Table {activeOrder.tableNumber}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(() => {
                const badge = getStatusBadge(activeOrder.status);
                const Icon = badge.icon;
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {badge.label}
                  </span>
                );
              })()}

              <button
                onClick={() => navigate(`/customer/orders/${activeOrder.id}`)}
                className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-light transition-colors"
              >
                Track Order <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-neutral-400 font-medium mb-1">Ordered Items</p>
              <p className="text-neutral-800 font-medium">
                {activeOrder.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')}
              </p>
            </div>
            <div>
              <p className="text-neutral-400 font-medium mb-1">Total Bill</p>
              <p className="text-neutral-900 font-bold text-sm">
                £{activeOrder.totalAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-neutral-400 font-medium mb-1">Order Time</p>
              <p className="text-neutral-600">
                {new Date(activeOrder.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 border border-neutral-100 bg-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div>
            <h3 className="text-base font-semibold text-neutral-800">
              Ready to enjoy a delicious meal?
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Select dishes from our menu, add them to your order, and place your order directly.
            </p>
          </div>
          <button
            onClick={() => navigate('/customer/menu')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <UtensilsCrossed className="h-4 w-4" />
            Browse Menu
          </button>
        </Card>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Menu Card */}
        <div
          onClick={() => navigate('/customer/menu')}
          className="p-5 rounded-lg border border-neutral-100 bg-white hover:border-neutral-200 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="h-9 w-9 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3 group-hover:bg-accent-bg group-hover:text-accent transition-colors">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold text-neutral-800 group-hover:text-accent transition-colors">
            Restaurant Menu
          </h4>
          <p className="text-xs text-neutral-400 mt-1">
            Browse appetisers, main courses, soups, extras and drinks.
          </p>
        </div>

        {/* Current Order Card */}
        <div
          onClick={() => navigate('/customer/cart')}
          className="p-5 rounded-lg border border-neutral-100 bg-white hover:border-neutral-200 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="h-9 w-9 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3 group-hover:bg-accent-bg group-hover:text-accent transition-colors">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-neutral-800 group-hover:text-accent transition-colors">
              Current Order
            </h4>
            {itemCount > 0 && (
              <span className="text-[11px] font-bold text-accent bg-accent-bg px-2 py-0.5 rounded-full">
                {itemCount} items
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {itemCount > 0
              ? `${itemCount} dish(es) in order (Order Total: £${cartTotal.toFixed(2)})`
              : tableNumber
              ? `Assigned to Table ${tableNumber}. Add dishes to place order.`
              : 'Add dishes and select your dining table to place order.'}
          </p>
        </div>

        {/* Bills Card */}
        <div
          onClick={() => navigate('/customer/bills')}
          className="p-5 rounded-lg border border-neutral-100 bg-white hover:border-neutral-200 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="h-9 w-9 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center mb-3 group-hover:bg-accent-bg group-hover:text-accent transition-colors">
            <Receipt className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold text-neutral-800 group-hover:text-accent transition-colors">
            Billing & Receipts
          </h4>
          <p className="text-xs text-neutral-400 mt-1">
            View current pending bill and your dining transaction history.
          </p>
        </div>
      </div>

      {/* Table Service & Assistance Panel */}
      <Card className="p-5 border border-neutral-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <BellRing className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-800">
                Table Service & Assistance (Table {effectiveTableNumber})
              </h3>
              <p className="text-xs text-neutral-400">
                Need immediate help from your waiter? One tap notifies our dining floor staff.
              </p>
            </div>
          </div>
        </div>

        {requestSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{requestSuccess}</span>
          </div>
        )}

        {/* Quick Service Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(
            [
              'Request Waiter',
              'Request Water',
              'Request Bill',
              'Extra Cutlery',
              'Extra Napkins',
            ] as ServiceRequestType[]
          ).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleSendRequest(type)}
              className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-100 hover:border-neutral-300 text-neutral-800 text-xs font-semibold text-center transition-all cursor-pointer shadow-2xs"
            >
              {type}
            </button>
          ))}
        </div>

        {/* Active Customer Requests Status */}
        {myRequests.length > 0 && (
          <div className="pt-3 border-t border-neutral-100 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Your Active Service Requests
            </span>
            <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-100 overflow-hidden">
              {myRequests.slice(0, 3).map((r) => (
                <div key={r.id} className="p-2.5 bg-neutral-50/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-neutral-800">{r.type}</span>
                    <span className="text-[11px] text-neutral-400 ml-2">Table {r.tableNumber}</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      r.status === 'Pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : r.status === 'Acknowledged'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}
                  >
                    {r.status === 'Pending'
                      ? 'Waitstaff Notified'
                      : r.status === 'Acknowledged'
                      ? 'Staff On The Way'
                      : 'Fulfilled'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Recent Orders List */}
      {customerOrders.length > 0 && (
        <Card className="p-5 border border-neutral-100 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-400" />
              Recent Orders
            </h3>
            <button
              onClick={() => navigate('/customer/orders')}
              className="text-xs text-accent font-medium hover:text-accent-light transition-colors"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {customerOrders.slice(0, 3).map((ord) => {
              const badge = getStatusBadge(ord.status);
              return (
                <div
                  key={ord.id}
                  onClick={() => navigate(`/customer/orders/${ord.id}`)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-50/60 px-2 rounded-md transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-800">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[11px] text-neutral-400">Table {ord.tableNumber}</span>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-1">
                      {ord.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}
                    >
                      {ord.status}
                    </span>
                    <p className="text-xs font-bold text-neutral-800 mt-1">
                      £{ord.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
