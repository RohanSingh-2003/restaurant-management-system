import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  AlertCircle,
  Edit2,
  X,
  Users,
} from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { Card } from '../../components/ui/Card';
import type { RestaurantTable, TableStatus } from '../../types/operational';

function getStatusBadge(status: TableStatus) {
  switch (status) {
    case 'Available':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Occupied':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Reserved':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

export function AdminTables() {
  const { tables, addTable, updateTable, toggleTableStatus } = useOperationalData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Add form state
  const [newNumber, setNewNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');

  // Edit form state
  const [editCapacity, setEditCapacity] = useState('4');
  const [editStatus, setEditStatus] = useState<TableStatus>('Available');

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const matchStatus = statusFilter === 'All' || t.status.toLowerCase() === statusFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        `table ${t.number}`.includes(q) ||
        t.number.toString() === q ||
        t.status.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [tables, statusFilter, searchQuery]);

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const num = parseInt(newNumber, 10);
    const cap = parseInt(newCapacity, 10);

    if (isNaN(num) || num <= 0) {
      setFormError('Table number must be a positive integer.');
      return;
    }
    if (isNaN(cap) || cap <= 0) {
      setFormError('Seat capacity must be a positive integer.');
      return;
    }

    try {
      addTable({ number: num, capacity: cap });
      setNewNumber('');
      setNewCapacity('4');
      setIsAddModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add table.');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;
    setFormError(null);

    const cap = parseInt(editCapacity, 10);
    if (isNaN(cap) || cap <= 0) {
      setFormError('Capacity must be a positive integer.');
      return;
    }

    try {
      updateTable(editingTable.id, {
        capacity: cap,
        status: editStatus,
      });
      setEditingTable(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update table.');
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Table Management</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Configure dining tables, seating arrangements, and live operational occupancy.
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
          <span>Add Dining Table</span>
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
            placeholder="Search table number or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['All', 'Available', 'Occupied', 'Reserved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer
                ${
                  statusFilter === st
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }
              `}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Table */}
      <Card padding="none" className="overflow-hidden border border-neutral-200 bg-white shadow-xs">
        {filteredTables.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            No tables match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/75 border-b border-neutral-100 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Table</th>
                  <th className="px-5 py-3">Seating Capacity</th>
                  <th className="px-5 py-3">Operational Status</th>
                  <th className="px-5 py-3">Active Order</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredTables.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="h-7 w-7 rounded-md bg-neutral-100 font-bold text-neutral-800 flex items-center justify-center text-xs">
                          {t.number}
                        </span>
                        <span className="font-semibold text-neutral-900">Table {t.number}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-600">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-neutral-400" />
                        {t.capacity} Guests
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {t.currentOrderId ? (
                        <span className="font-mono text-xs font-bold text-accent">
                          {t.currentOrderId}
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingTable(t);
                            setEditCapacity(t.capacity.toString());
                            setEditStatus(t.status);
                            setFormError(null);
                          }}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Edit Table"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => toggleTableStatus(t.id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer
                            ${
                              t.status === 'Available'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }
                          `}
                        >
                          {t.status === 'Available' ? 'Mark Occupied' : 'Mark Available'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">Add Dining Table</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Table Number <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 13"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                />
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Must be unique across the restaurant floor.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Seating Capacity (Guests) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                />
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
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {editingTable && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">Edit Table {editingTable.number}</h3>
              <button
                onClick={() => setEditingTable(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TableStatus)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent bg-white"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Reserved">Reserved</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
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
