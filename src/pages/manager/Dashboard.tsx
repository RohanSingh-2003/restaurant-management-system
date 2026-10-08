import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  LayoutGrid,
  ShoppingBag,
  UtensilsCrossed,
  ArrowRight,
  ShieldCheck,
  Activity,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Flame,
  Calendar,
} from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { useTarriData } from '../../hooks/useTarriData';
import { getStoredUsers, subscribeUserUpdates } from '../../services/authService';
import { getDailySalesAnalysis } from '../../services/managerDailySalesService';
import { Card } from '../../components/ui/Card';

export function ManagerDashboard() {
  const navigate = useNavigate();
  const { tables, orders, products } = useOperationalData();
  const { records: tarriRecords } = useTarriData();
  const [users, setUsers] = useState(() => getStoredUsers());

  // Today's date DD/MM/YYYY
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const todayAnalysis = useMemo(() => {
    if (!tarriRecords || tarriRecords.length === 0) return null;
    return getDailySalesAnalysis(tarriRecords, todayDateStr);
  }, [tarriRecords, todayDateStr]);

  useEffect(() => {
    const unsub = subscribeUserUpdates(() => {
      setUsers(getStoredUsers());
    });
    return unsub;
  }, []);

  // Operational metrics
  const staffMembers = users.filter((u) => u.role === 'manager' || u.role === 'waiter' || u.role === 'cook');
  const activeTables = tables.filter((t) => t.status === 'Occupied');
  const activeOrders = orders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled');
  const totalMenuItems = products.length;

  return (
    <div className="w-full space-y-6 pb-12 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Manager Dashboard</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage restaurant operations and system access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/manager/users')}
            className="px-3.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 shadow-xs transition-colors cursor-pointer"
          >
            Manage Users
          </button>
          <button
            onClick={() => navigate('/manager/menu')}
            className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            Manage Menu
          </button>
        </div>
      </div>

      {/* Operational KPI Counters (Simple SaaS Counters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <Card
          onClick={() => navigate('/manager/staff')}
          className="p-5 border border-neutral-200 bg-white hover:border-neutral-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Total Staff
            </span>
            <div className="h-8 w-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center group-hover:bg-accent-bg group-hover:text-accent transition-colors">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-neutral-900">{staffMembers.length}</span>
            <span className="text-[11px] text-neutral-500 font-medium">Managers, Waiters & Cooks</span>
          </div>
        </Card>

        {/* Active Tables */}
        <Card
          onClick={() => navigate('/manager/tables')}
          className="p-5 border border-neutral-200 bg-white hover:border-neutral-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Active Tables
            </span>
            <div className="h-8 w-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center group-hover:bg-accent-bg group-hover:text-accent transition-colors">
              <LayoutGrid className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-neutral-900">{activeTables.length}</span>
            <span className="text-[11px] text-neutral-500 font-medium">of {tables.length} Total Tables</span>
          </div>
        </Card>

        {/* Active Orders */}
        <Card
          onClick={() => navigate('/manager/orders')}
          className="p-5 border border-neutral-200 bg-white hover:border-neutral-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Active Orders
            </span>
            <div className="h-8 w-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center group-hover:bg-accent-bg group-hover:text-accent transition-colors">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-neutral-900">{activeOrders.length}</span>
            <span className="text-[11px] text-neutral-500 font-medium">Pending / Preparing / Ready</span>
          </div>
        </Card>

        {/* Menu Items */}
        <Card
          onClick={() => navigate('/manager/menu')}
          className="p-5 border border-neutral-200 bg-white hover:border-neutral-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Menu Items
            </span>
            <div className="h-8 w-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center group-hover:bg-accent-bg group-hover:text-accent transition-colors">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-neutral-900">{totalMenuItems}</span>
            <span className="text-[11px] text-neutral-500 font-medium">Active catalog dishes</span>
          </div>
        </Card>
      </div>

      {/* Today's Sales & Performance Executive Brief */}
      {todayAnalysis && (
        <Card className="p-5 border border-neutral-200 bg-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                    Today's Sales & Benchmark Performance
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Sync
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Real-time operational intake compared against historical {todayAnalysis.dayOfWeek} benchmarks.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/manager/daily-sales')}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Calendar className="h-3.5 w-3.5 text-neutral-500" />
              Explore Any Date
              <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
            </button>
          </div>

          {/* 4 Mini Snapshot Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/60">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Today's Sales
              </span>
              <div className="text-lg font-bold text-neutral-900 mt-1">
                £{todayAnalysis.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px]">
                {todayAnalysis.revenueVsDayAvgPct >= 0 ? (
                  <span className="inline-flex items-center font-semibold text-emerald-600">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    +{todayAnalysis.revenueVsDayAvgPct}%
                  </span>
                ) : (
                  <span className="inline-flex items-center font-semibold text-rose-600">
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                    {todayAnalysis.revenueVsDayAvgPct}%
                  </span>
                )}
                <span className="text-neutral-400">vs Thu avg (£{todayAnalysis.dayOfWeekAvgRevenue.toFixed(0)})</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/60">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Orders Today
              </span>
              <div className="text-lg font-bold text-neutral-900 mt-1">
                {todayAnalysis.orderCount} orders
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px]">
                {todayAnalysis.ordersVsDayAvgPct >= 0 ? (
                  <span className="inline-flex items-center font-semibold text-emerald-600">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    +{todayAnalysis.ordersVsDayAvgPct}%
                  </span>
                ) : (
                  <span className="inline-flex items-center font-semibold text-rose-600">
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                    {todayAnalysis.ordersVsDayAvgPct}%
                  </span>
                )}
                <span className="text-neutral-400">vs Thu avg ({todayAnalysis.dayOfWeekAvgOrders})</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/60">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Highest Sold Dish
              </span>
              <div className="text-xs font-bold text-neutral-900 mt-1 truncate">
                {todayAnalysis.topSellersByVolume[0]?.name || 'No sales yet'}
              </div>
              <div className="mt-1 text-[11px] text-neutral-500 font-medium">
                {todayAnalysis.topSellersByVolume[0] ? (
                  <>
                    <span className="font-bold text-neutral-800">
                      {todayAnalysis.topSellersByVolume[0].quantity} portions
                    </span>{' '}
                    (£{todayAnalysis.topSellersByVolume[0].revenue.toFixed(2)})
                  </>
                ) : (
                  'Awaiting orders'
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/60">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Top Category
              </span>
              <div className="text-xs font-bold text-neutral-900 mt-1 truncate">
                {todayAnalysis.categoryBreakdown[0]?.category || 'N/A'}
              </div>
              <div className="mt-1 text-[11px] text-neutral-500 font-medium">
                {todayAnalysis.categoryBreakdown[0] ? (
                  <>
                    <span className="font-bold text-neutral-800">
                      {todayAnalysis.categoryBreakdown[0].percentage}%
                    </span>{' '}
                    of daily gross
                  </>
                ) : (
                  'N/A'
                )}
              </div>
            </div>
          </div>

          {/* Narrative Insight */}
          <div className="mt-4 p-3 rounded-lg bg-neutral-50 border border-neutral-200/60 text-xs text-neutral-700 leading-relaxed flex items-start gap-2.5">
            <span className="p-1 rounded-md bg-white border border-neutral-200 text-neutral-600 shrink-0 mt-0.5">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
            </span>
            <p className="text-neutral-700">
              <span className="font-bold text-neutral-900">Manager Takeaway: </span>
              {todayAnalysis.narrativeSummary}
            </p>
          </div>
        </Card>
      )}

      {/* System Status Banner */}
      <Card className="p-4 border border-neutral-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-800">Operational Database Synchronized</h3>
            <p className="text-[11px] text-neutral-400">
              Shared state active across Admin, Waiter, Cook, Customer, and Manager modules.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-neutral-100 text-neutral-700">
            <Activity className="h-3 w-3 text-emerald-600" />
            All Services Online
          </span>
        </div>
      </Card>

      {/* Operational Modules Directory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          onClick={() => navigate('/manager/users')}
          className="p-5 border border-neutral-200 bg-white hover:border-neutral-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-neutral-900 group-hover:text-accent transition-colors">
              User Accounts
            </h4>
            <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Manage system users across all roles (Admin, Waiter, Cook, Customer, Manager).
          </p>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Total registered:</span>
            <span className="font-semibold text-neutral-800">{users.length}</span>
          </div>
        </Card>

        <Card
          onClick={() => navigate('/manager/staff')}
          className="p-5 border border-neutral-200 bg-white hover:border-neutral-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-neutral-900 group-hover:text-accent transition-colors">
              Staff Management
            </h4>
            <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Register new restaurant employees, assign floor stations, and toggle active status.
          </p>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Active employees:</span>
            <span className="font-semibold text-neutral-800">{staffMembers.length}</span>
          </div>
        </Card>

        <Card
          onClick={() => navigate('/manager/menu')}
          className="p-5 border border-neutral-200 bg-white hover:border-neutral-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-neutral-900 group-hover:text-accent transition-colors">
              Menu & Products
            </h4>
            <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Add new food or drink items, update pricing, and switch real-time availability.
          </p>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Menu items:</span>
            <span className="font-semibold text-neutral-800">{products.length}</span>
          </div>
        </Card>

        <Card
          onClick={() => navigate('/manager/tables')}
          className="p-5 border border-neutral-200 bg-white hover:border-neutral-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-neutral-900 group-hover:text-accent transition-colors">
              Table Configuration
            </h4>
            <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Configure floor tables, seat capacities, and view live occupancy status.
          </p>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Total dining tables:</span>
            <span className="font-semibold text-neutral-800">{tables.length}</span>
          </div>
        </Card>

        <Card
          onClick={() => navigate('/manager/orders')}
          className="p-5 border border-neutral-200 bg-white hover:border-neutral-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-neutral-900 group-hover:text-accent transition-colors">
              Operational Orders
            </h4>
            <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Inspect all customer and waiter order submissions and enforce workflow status rules.
          </p>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Total orders logged:</span>
            <span className="font-semibold text-neutral-800">{orders.length}</span>
          </div>
        </Card>

        <Card
          onClick={() => navigate('/manager/settings')}
          className="p-5 border border-neutral-200 bg-white hover:border-neutral-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-neutral-900 group-hover:text-accent transition-colors">
              System Settings
            </h4>
            <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Configure restaurant identity, currency formats, and operational preferences.
          </p>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Currency:</span>
            <span className="font-semibold text-neutral-800">£ (GBP)</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
