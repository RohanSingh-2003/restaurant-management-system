import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  getStoredUsers,
  addStaffUser,
  updateUser,
  toggleUserStatus,
  subscribeUserUpdates,
} from '../../services/authService';
import { Card } from '../../components/ui/Card';
import type { User, Role } from '../../types';

const STAFF_ROLES: Role[] = ['manager', 'waiter', 'cook'];

function getRoleBadge(role: Role) {
  switch (role) {
    case 'manager':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'waiter':
      return 'bg-sky-50 text-sky-700 border border-sky-200';
    case 'cook':
      return 'bg-orange-50 text-orange-700 border border-orange-200';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

export function ManagerStaff() {
  const [users, setUsers] = useState<User[]>(() => getStoredUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  // Add staff form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('waiter');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit staff form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<Role>('waiter');

  useEffect(() => {
    const unsub = subscribeUserUpdates(() => {
      setUsers(getStoredUsers());
    });
    return unsub;
  }, []);

  // Filter to employees only (manager, waiter, cook)
  const staffList = useMemo(() => {
    return users
      .filter((u) => STAFF_ROLES.includes(u.role))
      .filter((u) => {
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

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newName.trim()) {
      setFormError('Staff name is required.');
      return;
    }
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setFormError('A valid email address is required.');
      return;
    }

    try {
      addStaffUser({
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        phone: newPhone.trim() || undefined,
        password: newPassword || 'password123',
      });

      // Reset and close
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('password123');
      setIsAddModalOpen(false);
      setUsers(getStoredUsers());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add staff.');
    }
  };

  const handleSaveEdit = () => {
    if (!editingStaff) return;
    if (!editName.trim()) {
      setFormError('Staff name is required.');
      return;
    }

    try {
      updateUser(editingStaff.id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        role: editRole,
      });
      setEditingStaff(null);
      setUsers(getStoredUsers());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update staff.');
    }
  };

  const handleToggleStatus = (u: User) => {
    setFormError(null);
    try {
      toggleUserStatus(u.id);
      setUsers(getStoredUsers());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Staff Management</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage restaurant employees, assign operational roles, and toggle credentials.
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
          <span>Add Staff Member</span>
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
            placeholder="Search staff by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['All', 'Manager', 'Waiter', 'Cook'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer
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

      {/* Staff Table */}
      <Card padding="none" className="overflow-hidden border border-neutral-200 bg-white shadow-xs">
        {staffList.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            No employees match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/75 border-b border-neutral-100 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Staff Member</th>
                  <th className="px-5 py-3">Assigned Role</th>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {staffList.map((st) => {
                  const isActive = st.status !== 'Inactive';

                  return (
                    <tr key={st.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-700 text-xs shrink-0">
                            {st.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 block">{st.name}</span>
                            <span className="text-[10px] text-neutral-400">{st.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${getRoleBadge(
                            st.role
                          )}`}
                        >
                          {st.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-neutral-600">
                        {st.email}
                      </td>
                      <td className="px-5 py-3.5 text-neutral-500">
                        {st.phone || '—'}
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
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingStaff(st);
                              setEditName(st.name);
                              setEditPhone(st.phone || '');
                              setEditRole(st.role);
                              setFormError(null);
                            }}
                            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Edit Staff"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(st)}
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

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">Add New Staff Member</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Email Address <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="sarah@restaurant.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent bg-white"
                >
                  <option value="waiter">Waiter (Floor Staff)</option>
                  <option value="cook">Cook (Kitchen Staff)</option>
                  <option value="manager">Manager (Analytics & Reports)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+44 7911 123456"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">Edit Staff Member</h3>
              <button
                onClick={() => setEditingStaff(null)}
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
                <label className="block font-semibold text-neutral-700 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent bg-white"
                >
                  <option value="waiter">Waiter</option>
                  <option value="cook">Cook</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                onClick={() => setEditingStaff(null)}
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
