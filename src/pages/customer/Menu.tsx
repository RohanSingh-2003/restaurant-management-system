import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Utensils, Check, AlertCircle } from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { useCart } from '../../hooks/useCart';
import { Card } from '../../components/ui/Card';

export function CustomerMenu() {
  const navigate = useNavigate();
  const { products } = useOperationalData();
  const { addItem, items: cartItems, itemCount, total: cartTotal } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedFeedback, setAddedFeedback] = useState<Record<string, boolean>>({});

  // Dynamic categories from actual product data
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const getItemQuantity = (productId: string) => quantities[productId] || 1;

  const handleQuantityChange = (productId: string, delta: number) => {
    const cur = getItemQuantity(productId);
    const next = Math.max(1, cur + delta);
    setQuantities((prev) => ({ ...prev, [productId]: next }));
  };

  const handleAddToCart = (product: (typeof products)[0]) => {
    const qty = getItemQuantity(product.id);
    addItem(product, qty);

    // Show temporary visual feedback
    setAddedFeedback((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedFeedback((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  return (
    <div className="w-full space-y-6 pb-16 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Restaurant Menu</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Explore authentic dishes and freshly prepared specialities.
          </p>
        </div>

        {itemCount > 0 && (
          <button
            onClick={() => navigate('/customer/cart')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>View Order ({itemCount} items • £{cartTotal.toFixed(2)})</span>
          </button>
        )}
      </div>

      {/* Controls: Search & Category Filter */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search menu by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap
                  ${
                    isSelected
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                  }
                `}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product List / Cards */}
      {filteredProducts.length === 0 ? (
        <Card className="p-12 text-center border border-neutral-200 bg-white">
          <AlertCircle className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-800">No menu items found</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            Try adjusting your search query or selecting a different category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-4 text-xs font-semibold text-accent hover:text-accent-light"
          >
            Reset Filters
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isAvailable = product.available !== false;
            const currentCartItem = cartItems.find((it) => it.product.id === product.id);
            const inCartQty = currentCartItem?.quantity || 0;
            const isAdded = addedFeedback[product.id];
            const qty = getItemQuantity(product.id);

            return (
              <Card
                key={product.id}
                className={`p-4 border transition-all duration-150 flex flex-col justify-between
                  ${
                    isAvailable
                      ? 'border-neutral-200 bg-white hover:border-neutral-300 shadow-xs'
                      : 'border-neutral-100 bg-neutral-50/70 opacity-70'
                  }
                `}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
                      {product.category}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
                        ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                        }
                      `}
                    >
                      {isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-neutral-800 leading-snug">
                    {product.name}
                  </h3>

                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-neutral-900">
                      £{product.price.toFixed(2)}
                    </span>
                    {inCartQty > 0 && (
                      <span className="text-[11px] text-accent font-medium">
                        ({inCartQty} in order)
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Controls: Quantity & Add Button */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                  {isAvailable ? (
                    <>
                      <div className="flex items-center border border-neutral-200 rounded-md bg-white">
                        <button
                          onClick={() => handleQuantityChange(product.id, -1)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-neutral-800 select-none">
                          {qty}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(product.id, 1)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isAdded}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer
                          ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                          }
                        `}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Added to Order
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Add to Order
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="w-full text-center py-1">
                      <span className="text-xs text-neutral-400 font-medium">
                        Currently Sold Out
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Order Bar for Mobile/Easy navigation */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-neutral-900 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-4 border border-neutral-800">
          <div className="flex items-center gap-2 text-xs">
            <span className="h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center text-[11px] font-bold">
              {itemCount}
            </span>
            <span className="font-medium">Order Total: £{cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={() => navigate('/customer/cart')}
            className="flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-lighter cursor-pointer"
          >
            Review Order →
          </button>
        </div>
      )}
    </div>
  );
}
