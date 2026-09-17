import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  Search,
  Check,
} from 'lucide-react';
import { useOperationalData } from '../../hooks/useOperationalData';
import { Card } from '../../components/ui/Card';
import type { OperationalOrder } from '../../types/operational';

export function CookDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('filter') || 'ALL';

  const { orders, updateStatus } = useOperationalData();
  const [searchQuery, setSearchQuery] = useState('');
  const [nowTime, setNowTime] = useState<number>(() => Date.now());

  const setActiveTab = (tab: string) => {
    if (tab === 'ALL') {
      searchParams.delete('filter');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ filter: tab }, { replace: true });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);


  // Relevant kitchen orders (Confirmed, Pending, Preparing, Ready)
  const kitchenOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === 'Confirmed' ||
        o.status === 'Pending' ||
        o.status === 'Preparing' ||
        o.status === 'Ready'
    );
  }, [orders]);

  // Operational counters
  const newOrders = useMemo(
    () => kitchenOrders.filter((o) => o.status === 'Confirmed' || o.status === 'Pending'),
    [kitchenOrders]
  );
  const preparingOrders = useMemo(
    () => kitchenOrders.filter((o) => o.status === 'Preparing'),
    [kitchenOrders]
  );
  const readyOrders = useMemo(
    () => kitchenOrders.filter((o) => o.status === 'Ready'),
    [kitchenOrders]
  );

  // Search filter helper
  const filterBySearch = (list: OperationalOrder[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        `table ${o.tableNumber}`.toLowerCase().includes(q) ||
        o.items.some((i) => i.productName.toLowerCase().includes(q))
    );
  };

  const filteredNew = filterBySearch(newOrders);
  const filteredPreparing = filterBySearch(preparingOrders);
  const filteredReady = filterBySearch(readyOrders);

  const handleStartPreparing = (orderId: string) => {
    updateStatus(orderId, 'Preparing');
  };

  const handleMarkReady = (orderId: string) => {
    updateStatus(orderId, 'Ready');
  };

  const handleHandOver = (orderId: string) => {
    updateStatus(orderId, 'Served');
  };

  // Helper to compute elapsed minutes
  const getElapsedMinutes = (dateStr: string): string => {
    const diffMs = nowTime - new Date(dateStr).getTime();
    const mins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    return `${mins}m ago`;
  };

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Page Header matching Manager */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
            Kitchen Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Manage incoming orders and kitchen preparation in real time.
          </p>
        </div>

        {/* Operational Counters (Restrained subtle badges) */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning-light text-warning font-medium border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            {newOrders.length} New Orders
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-info-light text-info font-medium border border-blue-200">
            <Clock className="h-3 w-3" />
            {preparingOrders.length} Preparing
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success-light text-success font-medium border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            {readyOrders.length} Ready
          </span>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <Card padding="none" className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search kitchen orders by #, table, or dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'Pending', label: `New (${newOrders.length})` },
              { id: 'Preparing', label: `Preparing (${preparingOrders.length})` },
              { id: 'Ready', label: `Ready (${readyOrders.length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveTab(f.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-xs ${
                  activeTab === f.id
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 3. Three-Column Kitchen Order Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* COLUMN 1: NEW (Pending) */}
        {(activeTab === 'ALL' || activeTab === 'Pending') && (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1 pb-2 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                  New Orders ({filteredNew.length})
                </h3>
              </div>
              <span className="text-[11px] text-neutral-400">Incoming</span>
            </div>

            <div className="space-y-3">
              {filteredNew.length === 0 ? (
                <div className="p-8 rounded-lg border border-dashed border-neutral-200 text-center text-neutral-400 text-xs bg-white">
                  No new orders waiting
                </div>
              ) : (
                filteredNew.map((order) => (
                  <Card key={order.id} padding="none" className="p-4 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-800 font-mono">
                            {order.orderNumber}
                          </span>
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 font-semibold text-xs rounded-md">
                            Table {order.tableNumber}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getElapsedMinutes(order.createdAt)}
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="py-3 space-y-2">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="text-xs">
                            <div className="flex items-baseline justify-between text-neutral-700">
                              <span className="font-semibold text-accent">{it.quantity}×</span>
                              <span className="flex-1 ml-2 font-medium text-neutral-800">
                                {it.productName}
                              </span>
                            </div>
                            {it.notes && (
                              <p className="mt-0.5 ml-5 text-[11px] text-warning bg-warning-light/50 border border-amber-200 px-2 py-0.5 rounded">
                                Note: {it.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {order.specialInstructions && (
                        <div className="p-2 rounded-md bg-neutral-50 border border-neutral-100 text-xs text-neutral-600 mb-2">
                          <strong className="text-neutral-700">Instructions:</strong> {order.specialInstructions}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 border-t border-neutral-100">
                      <button
                        onClick={() => handleStartPreparing(order.id)}
                        className="w-full py-2 bg-accent hover:bg-accent-light text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Start Preparing
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* COLUMN 2: PREPARING */}
        {(activeTab === 'ALL' || activeTab === 'Preparing') && (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1 pb-2 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-info" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                  Preparing ({filteredPreparing.length})
                </h3>
              </div>
              <span className="text-[11px] text-neutral-400">In Progress</span>
            </div>

            <div className="space-y-3">
              {filteredPreparing.length === 0 ? (
                <div className="p-8 rounded-lg border border-dashed border-neutral-200 text-center text-neutral-400 text-xs bg-white">
                  Nothing currently preparing
                </div>
              ) : (
                filteredPreparing.map((order) => (
                  <Card key={order.id} padding="none" className="p-4 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-800 font-mono">
                            {order.orderNumber}
                          </span>
                          <span className="px-2 py-0.5 bg-info-light text-info font-semibold text-xs rounded-md">
                            Table {order.tableNumber}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getElapsedMinutes(order.updatedAt)}
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="py-3 space-y-2">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="text-xs">
                            <div className="flex items-baseline justify-between text-neutral-700">
                              <span className="font-semibold text-info">{it.quantity}×</span>
                              <span className="flex-1 ml-2 font-medium text-neutral-800">
                                {it.productName}
                              </span>
                            </div>
                            {it.notes && (
                              <p className="mt-0.5 ml-5 text-[11px] text-warning bg-warning-light/50 border border-amber-200 px-2 py-0.5 rounded">
                                Note: {it.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {order.specialInstructions && (
                        <div className="p-2 rounded-md bg-neutral-50 border border-neutral-100 text-xs text-neutral-600 mb-2">
                          <strong className="text-neutral-700">Instructions:</strong> {order.specialInstructions}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 border-t border-neutral-100">
                      <button
                        onClick={() => handleMarkReady(order.id)}
                        className="w-full py-2 bg-accent hover:bg-accent-light text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark Ready
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* COLUMN 3: READY */}
        {(activeTab === 'ALL' || activeTab === 'Ready') && (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1 pb-2 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                  Ready ({filteredReady.length})
                </h3>
              </div>
              <span className="text-[11px] text-neutral-400">Pickup Waiting</span>
            </div>

            <div className="space-y-3">
              {filteredReady.length === 0 ? (
                <div className="p-8 rounded-lg border border-dashed border-neutral-200 text-center text-neutral-400 text-xs bg-white">
                  No orders waiting for pickup
                </div>
              ) : (
                filteredReady.map((order) => (
                  <Card key={order.id} padding="none" className="p-4 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-800 font-mono">
                            {order.orderNumber}
                          </span>
                          <span className="px-2 py-0.5 bg-success-light text-success font-semibold text-xs rounded-md">
                            Table {order.tableNumber}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-success flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Ready
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="py-3 space-y-1.5 text-xs text-neutral-700">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between font-medium">
                            <span>
                              {it.quantity}× {it.productName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 border-t border-neutral-100">
                      <button
                        onClick={() => handleHandOver(order.id)}
                        className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Hand Over to Server
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
