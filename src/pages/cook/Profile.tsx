import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { ChefHat, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function CookProfile() {
  const { user, isAuthenticated } = useAuth();

  const displayName = user?.name || 'Chef Gordon';
  const displayEmail = user?.email || 'cook@restaurant.com';
  const displayRole = 'Cook / Kitchen Staff';
  const stationAssignment = 'Main Kitchen (Hot Line & Grill)';
  const responsibilities = 'Order Preparation & Quality Hand-off';
  const portalName = 'Restaurant Management System';
  const authStatus = isAuthenticated ? 'Session Verified' : 'Verified';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Cook Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Kitchen team credentials and station assignment.
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
                {portalName}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Station Details Section */}
      <Card className="border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <ChefHat className="h-4 w-4 text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-800">Station & Responsibilities</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              Staff Member
            </span>
            <span className="text-sm font-semibold text-neutral-800">{displayName}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              Email Account
            </span>
            <span className="text-sm font-semibold text-neutral-800 break-all">{displayEmail}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              Primary Station
            </span>
            <span className="text-sm font-semibold text-neutral-800">{stationAssignment}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-100 sm:col-span-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              Kitchen Duties
            </span>
            <span className="text-sm font-semibold text-neutral-800">{responsibilities}</span>
          </div>
        </div>
      </Card>

      {/* Access & Scope Section */}
      <Card className="border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <ShieldCheck className="h-4 w-4 text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-800">Operational Scope</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              Access Role
            </span>
            <span className="text-sm font-semibold text-neutral-800">{displayRole}</span>
          </div>
          <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
              Queue Privileges
            </span>
            <span className="text-sm font-semibold text-neutral-800">
              Kitchen Queue, Order Preparation, Readiness Hand-over
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
