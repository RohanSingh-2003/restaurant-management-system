import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  CheckCircle2,
  Clock,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useOperationalData } from '../../hooks/useOperationalData';
import { Card } from '../../components/ui/Card';

export function CustomerBills() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders } = useOperationalData();

  // Customer orders
  const myOrders = orders.filter(
    (o) =>
      o.customerId === user?.id ||
      o.customerName === user?.name ||
      (o.source === 'CUSTOMER' && user?.role === 'customer')
  );

  const activeBills = myOrders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled');
  const pastBills = myOrders.filter((o) => o.status === 'Completed');

  return (
    <div className="w-full space-y-6 pb-12 min-w-0">
      {/* Header */}
      <div className="border-b border-neutral-100 pb-5">
        <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">My Bills & Receipts</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Review current dining tab and historical payment receipts.
        </p>
      </div>

      {/* Current Outstanding Bill */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Current Tab
        </h2>

        {activeBills.length === 0 ? (
          <Card className="p-6 border border-neutral-200 bg-white text-center">
            <Receipt className="h-6 w-6 text-neutral-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-neutral-700">No outstanding bills</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              You do not have any pending orders. Active dining orders will appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeBills.map((ord) => (
              <Card key={ord.id} className="p-5 border-2 border-neutral-200 bg-white shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-900">{ord.orderNumber}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                        Table {ord.tableNumber}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Order placed at{' '}
                      {new Date(ord.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="h-3 w-3" />
                      Payment Pending
                    </span>
                    <button
                      onClick={() => navigate(`/customer/orders/${ord.id}`)}
                      className="text-xs font-semibold text-accent hover:text-accent-light"
                    >
                      Order Details →
                    </button>
                  </div>
                </div>

                <div className="py-3 divide-y divide-neutral-100 text-xs">
                  {ord.items.map((it) => (
                    <div key={it.id} className="py-2 flex justify-between">
                      <span className="text-neutral-700 font-medium">
                        {it.quantity} × {it.productName}
                      </span>
                      <span className="text-neutral-800 font-semibold">
                        £{(it.quantity * it.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline text-xs">
                  <span className="font-medium text-neutral-500">Subtotal: £{ord.subtotal.toFixed(2)}</span>
                  <div className="text-right">
                    <span className="text-xs text-neutral-400 mr-2">Total Due:</span>
                    <span className="text-base font-bold text-accent">£{ord.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-neutral-50 rounded-lg text-xs text-neutral-500 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-neutral-400 shrink-0" />
                  <span>
                    Payment is handled table-side. Please request the final bill from your waiter Alex Morgan when ready.
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Historical Bills / Completed Receipts */}
      <div className="space-y-3 pt-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Previous Receipts ({pastBills.length})
        </h2>

        {pastBills.length === 0 ? (
          <Card className="p-6 border border-neutral-100 bg-white text-center">
            <p className="text-xs text-neutral-400">No settled bills on record.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pastBills.map((ord) => (
              <Card
                key={ord.id}
                className="p-4 border border-neutral-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-neutral-900">{ord.orderNumber}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                      Table {ord.tableNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Paid {ord.payment?.method ? `(${ord.payment.method})` : ''}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {ord.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Date:{' '}
                    {new Date(ord.updatedAt || ord.createdAt).toLocaleDateString()}{' '}
                    {new Date(ord.updatedAt || ord.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-neutral-400">Total Settled</p>
                  <p className="text-sm font-bold text-neutral-900">
                    £{ord.totalAmount.toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
