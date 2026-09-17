import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { User, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

export function CustomerProfile() {
  const { user, isAuthenticated } = useAuth();
  const { tableNumber } = useCart();

  const displayName = user?.name || 'John Doe';
  const displayEmail = user?.email || 'customer@restaurant.com';
  const displayPhone = user?.phone || '+44 7911 777888';
  const displayRole = 'Customer / Restaurant Guest';
  const assignedTable = tableNumber ? `Table ${tableNumber}` : 'Dining Floor (Unassigned)';
  const authStatus = isAuthenticated ? 'Session Active' : 'Guest';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Customer Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Guest dining credentials and session information.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xl font-bold text-neutral-700 shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-bold text-neutral-900">{displayName}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                {authStatus}
              </span>
            </div>
            <p className="text-sm text-neutral-500">{displayEmail}</p>
            <div className="pt-1 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium">
                {displayRole}
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                Restaurant Management System
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Dining Details Section */}
      <Card className="border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <User className="h-4 w-4 text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-800">Account & Dining Details</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              Full Name
            </span>
            <span className="text-sm font-semibold text-neutral-800">{displayName}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              Email Address
            </span>
            <span className="text-sm font-semibold text-neutral-800 break-all">{displayEmail}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              Contact Phone
            </span>
            <span className="text-sm font-semibold text-neutral-800">{displayPhone}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-100 sm:col-span-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              Current Dining Table
            </span>
            <span className="text-sm font-semibold text-neutral-800">{assignedTable}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
