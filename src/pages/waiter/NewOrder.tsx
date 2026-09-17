import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Minus,
  Trash2,
  Send,
  Search,
  AlertCircle,
  Utensils,
  ArrowLeft,
} from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import type { OperationalProduct } from '../../types/operational';

interface SelectedCartItem {
  product: OperationalProduct;
  quantity: number;
  notes: string;
}

export function NewOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tables, products, createOrder } = useOperationalData();
  const { user } = useAuth();

  // Table selection (preselected from query param if available)
  const initialTableId = searchParams.get('table') || '';
  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    if (initialTableId) return initialTableId;
    const firstAvail = tables.find((t) => t.status === 'Available');
    return firstAvail ? firstAvail.id : tables[0]?.id || 'T1';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cartItems, setCartItems] = useState<SelectedCartItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered menu
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const handleAddItem = (prod: OperationalProduct) => {
    if (!prod.available) return;
    setValidationError(null);
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === prod.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product: prod, quantity: 1, notes: '' }];
    });
  };

  const handleUpdateQuantity = (prodId: string, delta: number) => {
    setValidationError(null);
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === prodId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as SelectedCartItem[]
    );
  };

  const handleRemoveItem = (prodId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== prodId));
  };

  const handleUpdateNotes = (prodId: string, notes: string) => {
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === prodId ? { ...item, notes } : item))
    );
  };

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, it) => sum + it.quantity * it.product.price, 0);
  }, [cartItems]);

  const selectedTableObj = tables.find((t) => t.id === selectedTableId);

  const handleSubmitOrder = () => {
    if (cartItems.length === 0) {
      setValidationError('Please add at least one item.');
      return;
    }

    if (!selectedTableObj) {
      setValidationError('Please select a valid table.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    setTimeout(() => {
      try {
        createOrder({
          tableId: selectedTableObj.id,
          tableNumber: selectedTableObj.number,
          waiterId: user?.id || 'usr_002',
          waiterName: user?.name || 'Waiter',
          items: cartItems.map((ci) => ({
            productId: ci.product.id,
            productName: ci.product.name,
            category: ci.product.category,
            quantity: ci.quantity,
            unitPrice: ci.product.price,
            notes: ci.notes.trim() || undefined,
          })),
          specialInstructions: specialInstructions.trim() || undefined,
        });

        navigate('/waiter/orders');
      } catch (err) {
        setValidationError(err instanceof Error ? err.message : 'Failed to send order.');
        setIsSubmitting(false);
      }
    }, 200);
  };

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Header matching Manager */}
      <div className="border-b border-neutral-100 pb-5">
        <button
          onClick={() => navigate('/waiter/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-700 mb-2 cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Create New Order</h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Select dining table, add dishes from menu, and send directly to the kitchen queue.
            </p>
          </div>

          {/* Table Selector */}
          <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg p-1.5 px-3 shadow-xs self-start sm:self-auto">
            <span className="text-xs font-medium text-neutral-500">Table:</span>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-neutral-800 focus:outline-hidden cursor-pointer"
            >
              {tables.map((tbl) => (
                <option key={tbl.id} value={tbl.id}>
                  Table {tbl.number} ({tbl.status} &bull; {tbl.capacity} Seats)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout (Menu & Order Cart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Menu Explorer (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search and Category Filter Tabs */}
          <Card padding="none" className="p-4 space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search dish or beverage name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
            </div>

            {/* Category horizontal pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer text-xs ${
                    selectedCategory === cat
                      ? 'bg-neutral-800 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Card>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map((prod) => {
              const inCartItem = cartItems.find((it) => it.product.id === prod.id);

              return (
                <Card
                  key={prod.id}
                  padding="none"
                  className={`p-3.5 flex flex-col justify-between transition-all ${
                    !prod.available
                      ? 'opacity-60 bg-neutral-50'
                      : 'bg-white hover:border-neutral-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 truncate">
                        {prod.category}
                      </span>
                      {prod.available ? (
                        <span className="text-[10px] font-medium text-success bg-success-light px-1.5 py-0.2 rounded">
                          Available
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-error bg-error-light px-1.5 py-0.2 rounded">
                          Unavailable
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-neutral-800 leading-snug line-clamp-2">
                      {prod.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-800 font-mono">
                      £{prod.price.toFixed(2)}
                    </span>

                    {prod.available ? (
                      inCartItem ? (
                        <div className="flex items-center gap-1.5 bg-accent-bg border border-accent-lighter rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(prod.id, -1)}
                            className="p-1 rounded bg-white text-accent hover:bg-accent-bg font-bold cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-semibold text-accent px-1">
                            {inCartItem.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(prod.id, 1)}
                            className="p-1 rounded bg-accent text-white hover:bg-accent-light font-bold cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddItem(prod)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-accent hover:bg-accent-light text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
                        >
                          <Plus className="h-3 w-3" /> Add
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="px-2.5 py-1 bg-neutral-100 text-neutral-400 text-xs font-medium rounded-lg cursor-not-allowed"
                      >
                        Unavailable
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Order Review & Cart (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <Card padding="none" className="sticky top-20 flex flex-col overflow-hidden">
            {/* Cart Header */}
            <div className="p-4 border-b border-neutral-100 bg-neutral-25/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Current Draft
                </span>
                <h2 className="text-sm font-semibold text-neutral-800">
                  Table {selectedTableObj?.number || '?'} Order
                </h2>
              </div>
              <span className="text-xs font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md">
                {cartItems.reduce((s, i) => s + i.quantity, 0)} Items
              </span>
            </div>

            {/* Validation Notice Box */}
            {validationError && (
              <div
                className="m-4 p-3 rounded-lg border border-error/20 bg-error-light text-xs text-error font-medium flex items-center gap-2"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-error" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Items List */}
            <div className="p-4 flex-1 divide-y divide-neutral-100 max-h-[380px] overflow-y-auto space-y-2">
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  <Utensils className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                  <p className="text-xs font-medium text-neutral-600">Your order is empty</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Click "Add" on any menu item to build order
                  </p>
                </div>
              ) : (
                cartItems.map((ci) => (
                  <div key={ci.product.id} className="pt-2.5 pb-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate flex-1">
                        <p className="font-medium text-neutral-800 truncate">{ci.product.name}</p>
                        <p className="text-[11px] text-neutral-400">
                          £{ci.product.price.toFixed(2)} each
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(ci.product.id, -1)}
                          className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center font-semibold text-neutral-800">
                          {ci.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(ci.product.id, 1)}
                          className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(ci.product.id)}
                          className="p-1 text-neutral-400 hover:text-error ml-1 cursor-pointer transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Special instruction / note per item */}
                    <input
                      type="text"
                      placeholder="Special note (e.g. Less spicy, no onions)..."
                      value={ci.notes}
                      onChange={(e) => handleUpdateNotes(ci.product.id, e.target.value)}
                      className="mt-1.5 w-full px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-[11px] text-neutral-700 placeholder-neutral-400 focus:outline-hidden focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Kitchen Special Instructions */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-25/50 space-y-2">
              <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider block">
                Order Notes for Kitchen
              </label>
              <textarea
                rows={2}
                placeholder="Allergies, table rush, or overall instructions..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none transition-colors"
              />
            </div>

            {/* Subtotal & Send Button */}
            <div className="p-4 border-t border-neutral-100 bg-white space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-600">Subtotal</span>
                <span className="font-mono font-bold text-base text-neutral-900">
                  £{subtotal.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitOrder}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-accent hover:bg-accent-light disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-medium text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? 'Sending to Kitchen...' : 'Send to Kitchen'}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
