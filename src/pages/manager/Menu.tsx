import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
  AlertCircle,
} from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { Card } from '../../components/ui/Card';
import type { OperationalProduct } from '../../types/operational';

export function ManagerMenu() {
  const { products, addProduct, updateProduct, toggleProductAvailability } = useOperationalData();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<OperationalProduct | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Add product form
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('MAIN COURSES');
  const [newPrice, setNewPrice] = useState('10.00');
  const [newAvailable, setNewAvailable] = useState(true);

  // Edit product form
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = categoryFilter === 'All' || p.category.toLowerCase() === categoryFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, categoryFilter, searchQuery]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = newName.trim();
    const trimmedCategory = newCategory.trim().toUpperCase();
    const parsedPrice = parseFloat(newPrice);

    if (!trimmedName) {
      setFormError('Product name is required.');
      return;
    }
    if (!trimmedCategory) {
      setFormError('Category is required.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Price must be a valid numeric value greater than or equal to 0.');
      return;
    }

    try {
      addProduct({
        name: trimmedName,
        category: trimmedCategory,
        price: Math.round(parsedPrice * 100) / 100,
        available: newAvailable,
      });

      setNewName('');
      setNewCategory('MAIN COURSES');
      setNewPrice('10.00');
      setNewAvailable(true);
      setIsAddModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create product.');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setFormError(null);

    const trimmedName = editName.trim();
    const trimmedCategory = editCategory.trim().toUpperCase();
    const parsedPrice = parseFloat(editPrice);

    if (!trimmedName) {
      setFormError('Product name is required.');
      return;
    }
    if (!trimmedCategory) {
      setFormError('Category is required.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Price must be a valid numeric value >= 0.');
      return;
    }

    try {
      updateProduct(editingProduct.id, {
        name: trimmedName,
        category: trimmedCategory,
        price: Math.round(parsedPrice * 100) / 100,
        available: editAvailable,
      });
      setEditingProduct(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update product.');
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Menu & Product Catalog</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage restaurant dishes, pricing, and live availability across Customer and Waiter interfaces.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Product</span>
        </button>
      </div>

      {formError && (
        <div className="rounded-lg border border-error/20 bg-error-light px-4 py-3 text-xs text-error flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
          <button onClick={() => setFormError(null)} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search menu item or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap
                ${
                  categoryFilter === c
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }
              `}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <Card padding="none" className="overflow-hidden border border-neutral-200 bg-white shadow-xs">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            No menu products match the search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/75 border-b border-neutral-100 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Unit Price</th>
                  <th className="px-5 py-3">Availability</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.map((p) => {
                  const isAvailable = p.available !== false;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-neutral-900 block">{p.name}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{p.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold font-mono text-neutral-900">
                        £{p.price.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => toggleProductAvailability(p.id)}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer
                            ${
                              isAvailable
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
                            }
                          `}
                          title="Click to toggle availability"
                        >
                          {isAvailable ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Available
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-neutral-400" />
                              Unavailable
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setEditName(p.name);
                              setEditCategory(p.category);
                              setEditPrice(p.price.toString());
                              setEditAvailable(p.available !== false);
                              setFormError(null);
                            }}
                            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">Add New Product</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Product Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suya Glazed Salmon"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Category <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MAIN COURSES, APETISERS, SOUPS, DRINKS"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Price (£ GBP) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newAvailableCheck"
                  checked={newAvailable}
                  onChange={(e) => setNewAvailable(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-accent accent-accent cursor-pointer"
                />
                <label htmlFor="newAvailableCheck" className="text-xs font-medium text-neutral-700 cursor-pointer">
                  Product is currently available for ordering
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">Edit Product</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Price (£ GBP)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editAvailableCheck"
                  checked={editAvailable}
                  onChange={(e) => setEditAvailable(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-accent accent-accent cursor-pointer"
                />
                <label htmlFor="editAvailableCheck" className="text-xs font-medium text-neutral-700 cursor-pointer">
                  Product is currently available for ordering
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
