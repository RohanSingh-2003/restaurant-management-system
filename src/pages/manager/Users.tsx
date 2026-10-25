import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  X,
  AlertCircle,
} from 'lucide-react';
import { getStoredUsers, toggleUserStatus, updateUser, subscribeUserUpdates } from '../../services/authService';
import { Card } from '../../components/ui/Card';
import type { User, Role } from '../../types';

function getRoleBadge(role: Role) {
  switch (role) {
    case 'admin':
      return 'bg-neutral-900 text-white';
    case 'manager':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'waiter':
      return 'bg-sky-50 text-sky-700 border border-sky-200';
    case 'cook':
      return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'customer':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

export function ManagerUsers() {
  const [users, setUsers] = useState<User[]>(() => getStoredUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeUserUpdates(() => {
      setUsers(getStoredUsers());
    });
    return unsub;
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === 'All' || u.role.toLowerCase() === roleFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, roleFilter, searchQuery]);

  const handleToggleStatus = (targetUser: User) => {
    setActionError(null);
    try {
      toggleUserStatus(targetUser.id);
      setUsers(getStoredUsers());
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    }
  };

  const handleStartEdit = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditPhone(u.phone || '');
    setActionError(null);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    if (!editName.trim()) {
      setActionError('Name cannot be empty.');
      return;
    }

    try {
      updateUser(editingUser.id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
      });
      setEditingUser(null);
      setUsers(getStoredUsers());
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save changes.');
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">System Users</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Directory of all registered roles, accounts, and system access states.
          </p>
        </div>
        <div className="text-xs text-neutral-500 font-medium">
          Total Users: <strong className="text-neutral-800 font-bold">{users.length}</strong>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-error/20 bg-error-light px-4 py-3 text-xs text-error flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-neutral-400 hover:text-neutral-600">
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
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Admin', 'Waiter', 'Cook', 'Customer', 'Manager'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap
                ${
                  roleFilter === r
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }
              `}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card padding="none" className="overflow-hidden border border-neutral-200 bg-white shadow-xs">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            No users match the search and filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/75 border-b border-neutral-100 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredUsers.map((u) => {
                  const isPrimaryAdmin = u.email === 'admin@restaurant.com';
                  const isActive = u.status !== 'Inactive';

                  return (
                    <tr key={u.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-700 text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 block">{u.name}</span>
                            <span className="text-[10px] text-neutral-400">{u.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-neutral-600">
                        {u.email}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${getRoleBadge(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-neutral-400">
                        {u.joinedAt || '2024-01-01'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {isPrimaryAdmin ? (
                            <span
                              className="p-1.5 text-neutral-300 cursor-not-allowed"
                              title="Primary system administrator cannot be modified"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer
                                ${
                                  isActive
                                    ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }
                              `}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">Edit User Profile</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-400 cursor-not-allowed font-mono"
                />
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Email identifier cannot be changed.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+44 7911 000000"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Role</label>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-neutral-100 text-neutral-800">
                  {editingUser.role}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                onClick={() => setEditingUser(null)}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-600 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
