import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowRight,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useOperationalData } from '../../hooks/useOperationalData';
import { Card } from '../../components/ui/Card';
import type { OrderStatus } from '../../types/operational';

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'Pending':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Pending',
      };
    case 'Preparing':
      return {
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        label: 'Preparing',
      };
    case 'Ready':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'Ready',
      };
    case 'Served':
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        label: 'Served',
      };
    case 'Completed':
      return {
        bg: 'bg-neutral-100 text-neutral-600 border-neutral-200',
        label: 'Completed',
      };
    default:
      return {
        bg: 'bg-neutral-100 text-neutral-600 border-neutral-200',
        label: status,
      };
  }
}

export function CustomerOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders } = useOperationalData();

  // Filter orders for this customer (or guest customer orders)
  const myOrders = orders.filter(
    (o) =>
      o.customerId === user?.id ||
      o.customerName === user?.name ||
      (o.source === 'CUSTOMER' && user?.role === 'customer')
  );

  const activeOrder = myOrders.find(
    (o) => o.status !== 'Completed' && o.status !== 'Cancelled'
  );

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">My Orders</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track active dining orders and review your past orders.
          </p>
        </div>
        <button
          onClick={() => navigate('/customer/menu')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UtensilsCrossed className="h-3.5 w-3.5" />
          Order More Food
        </button>
      </div>

      {/* Active Order Spotlight */}
      {activeOrder && (
        <Card className="p-5 border-2 border-accent/30 bg-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
                  Live Order in Progress
                </span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                {activeOrder.orderNumber} • Table {activeOrder.tableNumber}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {(() => {
                const badge = getStatusBadge(activeOrder.status);
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                  >
                    {badge.label}
                  </span>
                );
              })()}
              <button
                onClick={() => navigate(`/customer/orders/${activeOrder.id}`)}
                className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-light"
              >
                View Tracker <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-neutral-400 font-medium mb-0.5">Dishes</p>
              <p className="text-neutral-800 font-semibold">
                {activeOrder.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
              </p>
            </div>
            <div>
              <p className="text-neutral-400 font-medium mb-0.5">Total Amount</p>
              <p className="text-neutral-900 font-bold text-sm">
                £{activeOrder.totalAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-neutral-400 font-medium mb-0.5">Order Time</p>
              <p className="text-neutral-600">
                {new Date(activeOrder.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Orders History / All Orders */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          All Customer Orders ({myOrders.length})
        </h2>

        {myOrders.length === 0 ? (
          <Card className="p-10 text-center border border-neutral-200 bg-white">
            <Clock className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-800">No orders placed yet</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
              Your orders will appear here once you place an order from the menu.
            </p>
            <button
              onClick={() => navigate('/customer/menu')}
              className="mt-4 px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Browse Menu
            </button>
          </Card>
        ) : (
          <div className="space-y-3">
            {myOrders.map((ord) => {
              const badge = getStatusBadge(ord.status);
              return (
                <Card
                  key={ord.id}
                  onClick={() => navigate(`/customer/orders/${ord.id}`)}
                  className="p-4 border border-neutral-200 bg-white hover:border-neutral-300 shadow-xs transition-all cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-neutral-900">
                          {ord.orderNumber}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                          Table {ord.tableNumber}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}
                        >
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600">
                        {ord.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5">
                      <div className="text-right">
                        <p className="text-xs font-bold text-neutral-900">
                          £{ord.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {new Date(ord.createdAt).toLocaleDateString()}{' '}
                          {new Date(ord.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-neutral-400 shrink-0" />
                    </div>
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
