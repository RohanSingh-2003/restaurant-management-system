import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  UtensilsCrossed,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useOperationalData } from '../../hooks/useOperationalData';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';

export function CustomerCart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, subtotal, total, tableId, setTable } =
    useCart();
  const { tables, createOrder } = useOperationalData();

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available tables or currently assigned table
  const availableTables = useMemo(() => {
    return tables.filter((t) => t.status === 'Available' || t.id === tableId);
  }, [tables, tableId]);

  // Selected table
  const currentTable = useMemo(() => {
    if (tableId) {
      return tables.find((t) => t.id === tableId) || null;
    }
    return availableTables[0] || null;
  }, [tableId, tables, availableTables]);

  const handleTableChange = (newTableId: string) => {
    const selected = tables.find((t) => t.id === newTableId);
    if (selected) {
      setTable(selected.id, selected.number);
      setErrorMsg(null);
    }
  };

  const handlePlaceOrder = async () => {
    setErrorMsg(null);

    if (items.length === 0) {
      setErrorMsg('Your order is empty.');
      return;
    }

    const tableToUse = currentTable || availableTables[0];
    if (!tableToUse) {
      setErrorMsg('No tables are currently available. Please request assistance from restaurant staff.');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = createOrder({
        tableId: tableToUse.id,
        tableNumber: tableToUse.number,
        source: 'CUSTOMER',
        customerId: user?.id || 'usr_004',
        customerName: user?.name || 'Customer',
        items: items.map((it) => ({
          productId: it.product.id,
          productName: it.product.name,
          category: it.product.category,
          quantity: it.quantity,
          unitPrice: it.product.price,
          notes: it.notes,
        })),
        specialInstructions: specialInstructions.trim() || undefined,
      });

      // Clear order items on successful submission
      clearCart();

      // Navigate to order detail page
      navigate(`/customer/orders/${order.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to place order.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Card className="p-10 border border-neutral-200 bg-white">
          <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto mb-4">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-800">Your order is empty</h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            You haven't added any dishes to your order yet. Explore our restaurant menu to make your selection.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate('/customer/menu')}
              className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Browse Menu
            </button>
            <button
              onClick={() => navigate('/customer/orders')}
              className="px-4 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 shadow-xs transition-colors cursor-pointer"
            >
              View My Orders
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/customer/menu"
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              title="Return to Menu"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Current Order</h1>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Review your dishes and select your dining table before placing the order.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customer/menu')}
            className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Continue Ordering
          </button>
          <span className="text-neutral-200">|</span>
          <button
            onClick={clearCart}
            className="text-xs text-neutral-400 hover:text-error transition-colors"
          >
            Clear Order
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          className="rounded-lg border border-error/20 bg-error-light px-4 py-3 text-xs text-error flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Items List */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="none" className="border border-neutral-200 bg-white overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Order Items ({items.length})
              </h3>
              <button
                onClick={() => navigate('/customer/menu')}
                className="text-xs font-semibold text-accent hover:text-accent-light cursor-pointer"
              >
                + Add More Dishes
              </button>
            </div>

            <div className="divide-y divide-neutral-100">
              {items.map((it) => {
                const itemSubtotal = it.quantity * it.product.price;
                return (
                  <div key={it.product.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400">
                        {it.product.category}
                      </span>
                      <h4 className="text-sm font-semibold text-neutral-800 truncate">
                        {it.product.name}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        £{it.product.price.toFixed(2)} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center border border-neutral-200 rounded-md bg-white">
                      <button
                        onClick={() => updateQuantity(it.product.id, -1)}
                        className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
                        aria-label="Decrease"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold text-neutral-800 select-none">
                        {it.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(it.product.id, 1)}
                        className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
                        aria-label="Increase"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Subtotal & Remove */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-neutral-900 w-16 text-right">
                        £{itemSubtotal.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(it.product.id)}
                        className="p-1 text-neutral-300 hover:text-error transition-colors"
                        title="Remove from order"
                        aria-label="Remove from order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Special Instructions */}
          <Card className="p-4 border border-neutral-200 bg-white">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Special Kitchen Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Less spicy, dressing on the side, allergies..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </Card>
        </div>

        {/* Right Col: Table Selector & Order Summary */}
        <div className="space-y-4">
          {/* Table Selection */}
          <Card className="p-5 border border-neutral-200 bg-white shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Select Dining Table
            </h3>

            {availableTables.length === 0 ? (
              <p className="text-xs text-error">
                No tables available at this moment. Please ask restaurant staff.
              </p>
            ) : (
              <div>
                <select
                  value={currentTable?.id || ''}
                  onChange={(e) => handleTableChange(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {availableTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.number} ({t.capacity} seats) — {t.status}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-400 mt-1.5">
                  Only currently available tables are shown.
                </p>
              </div>
            )}
          </Card>

          {/* Order Summary */}
          <Card className="p-5 border border-neutral-200 bg-white shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Order Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Table:</span>
                <span className="font-semibold text-neutral-800">
                  {currentTable ? `Table ${currentTable.number}` : 'Unassigned'}
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-100 space-y-1 text-neutral-600">
                {items.map((it) => (
                  <div key={it.product.id} className="flex justify-between">
                    <span className="truncate pr-2">
                      {it.quantity} × {it.product.name}
                    </span>
                    <span className="font-medium shrink-0">
                      £{(it.quantity * it.product.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-between text-neutral-500">
                <span>Subtotal:</span>
                <span className="font-medium text-neutral-800">£{subtotal.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-neutral-900">Order Total:</span>
                <span className="text-lg font-bold text-accent">£{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || items.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/customer/menu')}
                className="w-full py-2 px-4 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors cursor-pointer text-center"
              >
                Continue Ordering
              </button>
            </div>

            <p className="text-[11px] text-center text-neutral-400">
              Your order is sent directly to the kitchen and floor staff.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
