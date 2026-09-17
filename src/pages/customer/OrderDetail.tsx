import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Utensils,
  Receipt,
  Check,
  AlertCircle,
  BellRing,
} from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import type { OrderStatus, ServiceRequestType } from '../../types/operational';

const STEPS: { status: OrderStatus; label: string; description: string }[] = [
  {
    status: 'Pending',
    label: 'Order Placed',
    description: 'Received & awaiting staff confirmation',
  },
  {
    status: 'Confirmed',
    label: 'Confirmed',
    description: 'Sent to kitchen for preparation',
  },
  {
    status: 'Preparing',
    label: 'Kitchen Preparing',
    description: 'Cook is preparing your dishes',
  },
  {
    status: 'Ready',
    label: 'Ready for Service',
    description: 'Plated & awaiting waiter delivery',
  },
  {
    status: 'Served',
    label: 'Served to Table',
    description: 'Enjoy your meal at the table',
  },
  {
    status: 'Completed',
    label: 'Completed',
    description: 'Meal finished & bill settled',
  },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  Draft: 0,
  Pending: 1,
  Confirmed: 2,
  Preparing: 3,
  Ready: 4,
  Served: 5,
  Completed: 6,
  Cancelled: -1,
};

export function CustomerOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, requests, createRequest } = useOperationalData();
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const order = orders.find((o) => o.id === id || o.orderNumber === id);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <Card className="p-8 border border-neutral-200 bg-white">
          <AlertCircle className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-neutral-800">Order Not Found</h2>
          <p className="text-xs text-neutral-400 mt-1">
            We couldn't locate order "{id}". It may have expired or does not exist.
          </p>
          <button
            onClick={() => navigate('/customer/orders')}
            className="mt-4 px-4 py-2 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
          >
            Back to My Orders
          </button>
        </Card>
      </div>
    );
  }

  const currentStepIndex = STATUS_ORDER[order.status] ?? 1;
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/customer/orders"
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              title="Back to Orders"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
              Order {order.orderNumber}
            </h1>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Table {order.tableNumber} • Placed on{' '}
            {new Date(order.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/customer/bills')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 shadow-xs transition-colors cursor-pointer"
          >
            <Receipt className="h-3.5 w-3.5 text-neutral-500" />
            <span>View Bill</span>
          </button>
          <button
            onClick={() => navigate('/customer/menu')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>Add Items</span>
          </button>
        </div>
      </div>

      {/* Visual Status Progression */}
      <Card className="p-6 border border-neutral-200 bg-white shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-6">
          Order Status Progression
        </h2>

        {isCancelled ? (
          <div className="p-4 rounded-lg bg-error-light/40 border border-error/20 text-xs text-error flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">This order was cancelled.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
            {STEPS.map((step, idx) => {
              const stepNum = idx + 1;
              const isPast = stepNum < currentStepIndex;
              const isCurrent = stepNum === currentStepIndex;

              return (
                <div
                  key={step.status}
                  className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between min-h-[100px]
                    ${
                      isCurrent
                        ? 'border-accent bg-accent-bg/40 shadow-xs'
                        : isPast
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-neutral-100 bg-neutral-50/50 opacity-60'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${
                          isCurrent
                            ? 'bg-accent text-white shadow-xs'
                            : isPast
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-200 text-neutral-500'
                        }
                      `}
                    >
                      {isPast ? <Check className="h-3.5 w-3.5" /> : stepNum}
                    </span>

                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent text-white">
                        Active
                      </span>
                    )}
                  </div>

                  <div>
                    <h3
                      className={`text-xs font-bold leading-tight
                        ${isCurrent ? 'text-accent' : isPast ? 'text-neutral-800' : 'text-neutral-400'}
                      `}
                    >
                      {step.label}
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Order Details & Items Breakdown */}
      <Card className="border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Ordered Items</h3>
            <p className="text-xs text-neutral-400">
              Assigned Table: Table {order.tableNumber}
              {order.waiterName ? ` • Server: ${order.waiterName}` : ''}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-neutral-100 text-neutral-700">
            Source: {order.source}
          </span>
        </div>

        <div className="divide-y divide-neutral-100">
          {order.items.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1 min-w-0">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400">
                  {item.category}
                </span>
                <h4 className="text-xs font-bold text-neutral-800 truncate">
                  {item.productName}
                </h4>
                {item.notes && (
                  <p className="text-[11px] text-neutral-500 italic">
                    Note: "{item.notes}"
                  </p>
                )}
              </div>

              <div className="text-right text-xs">
                <p className="font-semibold text-neutral-800">
                  {item.quantity} × £{item.unitPrice.toFixed(2)}
                </p>
                <p className="text-neutral-400 text-[11px]">
                  £{(item.quantity * item.unitPrice).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {order.specialInstructions && (
          <div className="p-4 bg-neutral-50/70 border-t border-neutral-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
              Special Instructions
            </span>
            <p className="text-xs text-neutral-700">{order.specialInstructions}</p>
          </div>
        )}

        {/* Totals Box */}
        <div className="p-5 bg-neutral-50/50 border-t border-neutral-200 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal:</span>
            <span className="font-semibold text-neutral-800">
              £{order.subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-neutral-200">
            <span className="text-sm font-bold text-neutral-900">Total:</span>
            <span className="text-base font-bold text-accent">
              £{order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* Table Service Assistance Card */}
      {order.status !== 'Completed' && order.status !== 'Cancelled' && (
        <Card className="p-5 border border-neutral-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <BellRing className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-800">
                Need Waiter Assistance at Table {order.tableNumber}?
              </h3>
              <p className="text-xs text-neutral-400">
                Tap an option to notify your server right away.
              </p>
            </div>
          </div>

          {requestSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{requestSuccess}</span>
            </div>
          )}

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
                onClick={() => {
                  createRequest({
                    tableId: order.tableId,
                    tableNumber: order.tableNumber,
                    type,
                    customerId: user?.id,
                    customerName: user?.name,
                  });
                  setRequestSuccess(`"${type}" sent to floor staff for Table ${order.tableNumber}!`);
                  setTimeout(() => setRequestSuccess(null), 4000);
                }}
                className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50/70 hover:bg-neutral-100 hover:border-neutral-300 text-neutral-800 text-xs font-semibold text-center transition-all cursor-pointer"
              >
                {type}
              </button>
            ))}
          </div>

          {/* Table Requests Status */}
          {(() => {
            const tableReqs = requests.filter(
              (r) => r.tableId === order.tableId || r.tableNumber === order.tableNumber
            );
            if (tableReqs.length === 0) return null;
            return (
              <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Requests for Table {order.tableNumber}
                </span>
                <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-100 overflow-hidden">
                  {tableReqs.slice(0, 3).map((r) => (
                    <div key={r.id} className="p-2 bg-neutral-50/50 flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-800">{r.type}</span>
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
            );
          })()}
        </Card>
      )}
    </div>
  );
}
