import { useNavigate } from 'react-router-dom';
import { BellRing, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function ReadyOrdersPage() {
  const navigate = useNavigate();
  const { orders, updateStatus } = useOperationalData();

  const readyOrders = orders.filter((o) => o.status === 'Ready');

  const handleMarkServed = (orderId: string) => {
    updateStatus(orderId, 'Served');
  };

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Page Header with unified vertical hierarchy matching Manager */}
      <div className="border-b border-neutral-100 pb-5">
        <button
          onClick={() => navigate('/waiter/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-700 mb-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
              Ready Orders for Service
            </h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Dishes completed by kitchen staff awaiting immediate runner delivery to tables.
            </p>
          </div>
          <div className="self-start sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success-light text-success text-xs font-medium border border-emerald-200">
              <BellRing className="h-3.5 w-3.5" />
              {readyOrders.length} Ready to Deliver
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Area: Empty State or Ready Orders Grid */}
      {readyOrders.length === 0 ? (
        <div className="py-8 flex justify-center">
          <Card
            padding="none"
            className="w-full max-w-lg p-8 sm:p-10 text-center flex flex-col items-center justify-center border border-neutral-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <div className="h-10 w-10 rounded-full bg-success-light/60 flex items-center justify-center mb-3.5 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-neutral-800">
              All Dishes Served!
            </h2>
            <p className="text-sm text-neutral-400 mt-1.5 max-w-xs leading-relaxed">
              No orders are currently waiting for pickup. When the cook completes an order, it will appear here.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/waiter/orders')}
              >
                View Active Orders
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {readyOrders.map((order) => (
            <Card
              key={order.id}
              padding="none"
              className="p-4 flex flex-col justify-between space-y-3 border border-neutral-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-800 font-mono">
                      {order.orderNumber}
                    </span>
                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 font-semibold text-xs rounded-md">
                      Table {order.tableNumber}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-success-light text-success text-xs font-medium rounded-md flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Kitchen Ready
                  </span>
                </div>

                {/* Items to deliver */}
                <div className="py-2.5 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Dishes to Deliver
                  </p>
                  <div className="bg-neutral-50 rounded-lg p-2.5 divide-y divide-neutral-100">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between text-xs font-medium text-neutral-800">
                        <span>
                          {it.quantity}× {it.productName}
                        </span>
                        {it.notes && (
                          <span className="text-[11px] text-warning">
                            ({it.notes})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="p-2 rounded-md bg-neutral-50 border border-neutral-100 text-xs text-neutral-600">
                      <strong>Note:</strong> {order.specialInstructions}
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Ready since {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => handleMarkServed(order.id)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Serve Order
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
