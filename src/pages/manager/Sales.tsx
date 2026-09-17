import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, KpiCard } from '../../components/ui';
import { useSalesAnalytics } from '../../hooks/useSalesAnalytics';
import { formatCurrency } from '../../services/tarriDataService';
import type { MonthlySalesRecord } from '../../types/dataset';

type MonthlySortKey = 'chronological' | 'revenue' | 'profit' | 'orders' | 'quantity';

export function SalesAnalytics() {
  const { data, isLoading, error, reload } = useSalesAnalytics();
  const [monthlySort, setMonthlySort] = useState<MonthlySortKey>('chronological');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const monthlySales = data?.monthlySales;
  // Sorted monthly table rows
  const sortedMonthlySales = useMemo(() => {
    if (!monthlySales) return [];
    const list = [...monthlySales];

    switch (monthlySort) {
      case 'revenue':
        return list.sort((a, b) => (sortAsc ? a.revenue - b.revenue : b.revenue - a.revenue));
      case 'profit':
        return list.sort((a, b) => (sortAsc ? a.profit - b.profit : b.profit - a.profit));
      case 'orders':
        return list.sort((a, b) => (sortAsc ? a.orders - b.orders : b.orders - a.orders));
      case 'quantity':
        return list.sort((a, b) => (sortAsc ? a.quantity - b.quantity : b.quantity - a.quantity));
      case 'chronological':
      default:
        return list.sort((a, b) => (sortAsc ? b.key.localeCompare(a.key) : a.key.localeCompare(b.key)));
    }
  }, [monthlySales, monthlySort, sortAsc]);

  const toggleSort = (key: MonthlySortKey) => {
    if (monthlySort === key) {
      setSortAsc(!sortAsc);
    } else {
      setMonthlySort(key);
      setSortAsc(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-neutral-500 font-medium">
          Loading sales analytics...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-error-light bg-error-light/20 p-6 text-center">
        <h3 className="text-base font-semibold text-neutral-800">Error Loading Sales Data</h3>
        <p className="mt-1 text-sm text-neutral-500">{error || 'Unable to parse sales data'}</p>
        <button
          onClick={reload}
          className="mt-4 inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    kpis,
    revenueTrend,
    revenueSummary,
    categories,
    orderTypes,
    dayOfWeek,
    timeOfDay,
    profitability,
    topProducts,
    insights,
  } = data;

  return (
    <div className="w-full space-y-8 min-w-0">
      {/* 1. Page Header */}
      <div className="border-b border-neutral-100 pb-5">
        <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
          Sales Analysis
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Detailed analysis of revenue, sales volume and profitability.
        </p>
      </div>

      {/* 2. Primary KPI Section */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard
            label="Total Revenue"
            value={formatCurrency(kpis.totalRevenue, true)}
            icon="pound-sterling"
            subtext={formatCurrency(kpis.totalRevenue)}
          />
          <KpiCard
            label="Total Orders"
            value={kpis.totalOrders.toLocaleString('en-GB')}
            icon="shopping-bag"
            subtext="Unique valid orders"
          />
          <KpiCard
            label="Avg. Order Value"
            value={`£${kpis.averageOrderValue.toFixed(2)}`}
            icon="receipt"
            subtext="Per completed order"
          />
          <KpiCard
            label="Estimated Profit"
            value={formatCurrency(kpis.totalProfit, true)}
            icon="trending-up"
            subtext={formatCurrency(kpis.totalProfit)}
          />
          <KpiCard
            label="Profit Margin"
            value={`${kpis.profitMargin}%`}
            icon="trending-up"
            change={`${kpis.profitMargin}%`}
            changeType="positive"
            subtext="Consistent margin"
          />
          <KpiCard
            label="Quantity Sold"
            value={kpis.totalQuantity.toLocaleString('en-GB')}
            icon="package"
            subtext={`${kpis.averageItemsPerOrder} items / order`}
          />
        </div>
      </section>

      {/* 3. Revenue Trend */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-800">Revenue Trend</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Monthly gross sales from Feb 2023 to Dec 2025 across the entire dataset.
            </p>
          </div>

          <div className="p-5">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#A8A29E' }}
                    axisLine={{ stroke: '#E7E5E4' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#A8A29E' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `£${(v / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1C1917',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(value: any) => [
                      `£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,
                      'Gross Sales',
                    ]}
                    labelStyle={{ color: '#A8A29E', marginBottom: '4px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#B45309"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#B45309', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#B45309', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Summary Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-neutral-100">
              <div className="p-3.5 rounded-lg bg-neutral-50">
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">
                  Highest Revenue Month
                </span>
                <p className="mt-1 text-sm font-semibold text-neutral-800">{revenueSummary.highestMonth.label}</p>
                <p className="text-xs font-semibold text-accent">{formatCurrency(revenueSummary.highestMonth.revenue)}</p>
                <span className="text-[11px] text-neutral-400">{revenueSummary.highestMonth.orders} orders</span>
              </div>
              <div className="p-3.5 rounded-lg bg-neutral-50">
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">
                  Lowest Revenue Month
                </span>
                <p className="mt-1 text-sm font-semibold text-neutral-800">{revenueSummary.lowestMonth.label}</p>
                <p className="text-xs font-medium text-neutral-600">{formatCurrency(revenueSummary.lowestMonth.revenue)}</p>
                <span className="text-[11px] text-neutral-400">{revenueSummary.lowestMonth.orders} orders</span>
              </div>
              <div className="p-3.5 rounded-lg bg-neutral-50">
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">
                  Average Monthly Revenue
                </span>
                <p className="mt-1 text-sm font-semibold text-neutral-800">{formatCurrency(revenueSummary.averageMonthlyRevenue)}</p>
                <p className="text-xs text-neutral-400">Over 36 recorded months</p>
                <span className="text-[11px] text-neutral-400">Total: {formatCurrency(revenueSummary.totalRevenue)}</span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Monthly Sales Performance Table */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-neutral-800">Monthly Sales Performance</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Detailed monthly performance ledger. Click column headers to sort.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Sort by:</span>
              <button
                onClick={() => toggleSort('chronological')}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  monthlySort === 'chronological'
                    ? 'border-accent bg-accent/5 text-accent font-semibold'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                Date {monthlySort === 'chronological' ? (sortAsc ? '↑' : '↓') : ''}
              </button>
              <button
                onClick={() => toggleSort('revenue')}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  monthlySort === 'revenue'
                    ? 'border-accent bg-accent/5 text-accent font-semibold'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                Revenue {monthlySort === 'revenue' ? (sortAsc ? '↑' : '↓') : ''}
              </button>
              <button
                onClick={() => toggleSort('profit')}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  monthlySort === 'profit'
                    ? 'border-accent bg-accent/5 text-accent font-semibold'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                Profit {monthlySort === 'profit' ? (sortAsc ? '↑' : '↓') : ''}
              </button>
              <button
                onClick={() => toggleSort('orders')}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  monthlySort === 'orders'
                    ? 'border-accent bg-accent/5 text-accent font-semibold'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                Orders {monthlySort === 'orders' ? (sortAsc ? '↑' : '↓') : ''}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-50 border-b border-neutral-100 z-10">
                <tr>
                  <th
                    onClick={() => toggleSort('chronological')}
                    className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-neutral-700"
                  >
                    Month
                  </th>
                  <th
                    onClick={() => toggleSort('orders')}
                    className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-neutral-700"
                  >
                    Orders
                  </th>
                  <th
                    onClick={() => toggleSort('quantity')}
                    className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-neutral-700"
                  >
                    Quantity
                  </th>
                  <th
                    onClick={() => toggleSort('revenue')}
                    className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-neutral-700"
                  >
                    Revenue
                  </th>
                  <th
                    onClick={() => toggleSort('profit')}
                    className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-neutral-700"
                  >
                    Est. Profit
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Profit Margin
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Avg. Order Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedMonthlySales.map((m: MonthlySalesRecord) => (
                  <tr key={m.key} className="border-b border-neutral-50 hover:bg-neutral-50/70 transition-colors">
                    <td className="px-5 py-3 font-semibold text-neutral-800">{m.label}</td>
                    <td className="px-5 py-3 text-right font-medium text-neutral-700">{m.orders.toLocaleString('en-GB')}</td>
                    <td className="px-5 py-3 text-right text-neutral-600">{m.quantity.toLocaleString('en-GB')}</td>
                    <td className="px-5 py-3 text-right font-semibold text-neutral-900">{formatCurrency(m.revenue)}</td>
                    <td className="px-5 py-3 text-right text-neutral-700">{formatCurrency(m.profit)}</td>
                    <td className="px-5 py-3 text-right text-emerald-700 font-medium">{m.profitMargin}%</td>
                    <td className="px-5 py-3 text-right font-medium text-neutral-800">£{m.averageOrderValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* 5. Category Sales */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-800">Category Sales</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Revenue distribution and volume across menu categories.
            </p>
          </div>

          <div className="p-5 space-y-6">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categories}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#A8A29E' }}
                    axisLine={{ stroke: '#E7E5E4' }}
                    tickLine={false}
                    tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#57534E' }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1C1917',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(v: any) => [
                      `£${Number(v || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,
                      'Revenue',
                    ]}
                  />
                  <Bar dataKey="grossSales" fill="#B45309" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-25/50">
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Category</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Orders</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Quantity</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Revenue</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Revenue Share</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Est. Profit</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.category} className="border-b border-neutral-50 hover:bg-neutral-50/70 transition-colors">
                      <td className="px-5 py-3 font-semibold text-neutral-800">{c.category}</td>
                      <td className="px-5 py-3 text-right font-medium text-neutral-700">{c.orders.toLocaleString('en-GB')}</td>
                      <td className="px-5 py-3 text-right text-neutral-600">{c.quantity.toLocaleString('en-GB')}</td>
                      <td className="px-5 py-3 text-right font-semibold text-neutral-900">{formatCurrency(c.grossSales)}</td>
                      <td className="px-5 py-3 text-right font-medium text-accent">{c.percentage}%</td>
                      <td className="px-5 py-3 text-right text-neutral-700">{formatCurrency(c.estProfit)}</td>
                      <td className="px-5 py-3 text-right text-emerald-700 font-medium">{c.profitMargin}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </section>

      {/* 6. Sales by Order Type */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-800">Sales by Order Type</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Direct comparison between Delivery and Collection sales performance.
            </p>
          </div>

          <div className="p-5 space-y-6">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderTypes} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                  <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#57534E' }} axisLine={{ stroke: '#E7E5E4' }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#A8A29E' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1C1917',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(v: any) => [
                      `£${Number(v || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,
                      'Revenue',
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#D97706" radius={[4, 4, 0, 0]} barSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-25/50">
                    <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Order Type</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Orders</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Quantity</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Revenue</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Revenue Share</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Avg. Order Value</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Est. Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {orderTypes.map((ot) => (
                    <tr key={ot.type} className="border-b border-neutral-50 hover:bg-neutral-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-neutral-800">{ot.type}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-neutral-700">{ot.uniqueOrders.toLocaleString('en-GB')}</td>
                      <td className="px-5 py-3.5 text-right text-neutral-600">{ot.quantity.toLocaleString('en-GB')}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-neutral-900">{formatCurrency(ot.revenue)}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-accent">{ot.revenueShare}%</td>
                      <td className="px-5 py-3.5 text-right font-medium text-neutral-800">£{ot.averageOrderValue.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right text-neutral-700">{formatCurrency(ot.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </section>

      {/* 7 & 8. Sales by Day & Sales by Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 7. Sales by Day */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-sm font-semibold text-neutral-800">Sales by Day of Week</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Weekday trading volume (Monday through Sunday).
            </p>
          </div>
          <div className="px-2 pb-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeek} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#57534E' }} axisLine={{ stroke: '#E7E5E4' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#A8A29E' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1C1917',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(v: any, _: any, item: any) => [
                    `£${Number(v || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })} (${item?.payload?.orders} orders, AOV £${item?.payload?.averageOrderValue?.toFixed(2)})`,
                    'Revenue',
                  ]}
                />
                <Bar dataKey="revenue" fill="#B45309" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 8. Sales by Time */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-sm font-semibold text-neutral-800">Sales by Time</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Hourly transaction distribution across operating hours (4 PM – 9 PM).
            </p>
          </div>
          <div className="px-2 pb-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeOfDay} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#57534E' }} axisLine={{ stroke: '#E7E5E4' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#A8A29E' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1C1917',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(v: any, _: any, item: any) => [
                    `£${Number(v || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })} (${item?.payload?.orders} orders, ${item?.payload?.revenueShare}%)`,
                    'Revenue',
                  ]}
                />
                <Bar dataKey="revenue" fill="#D97706" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 9. Profitability Over Time */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-neutral-800">Sales & Profitability</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Multi-series revenue, cost, and profit timeline.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 font-semibold self-start">
              Overall Margin: {kpis.profitMargin}%
            </span>
          </div>

          <div className="p-5">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitability} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#A8A29E' }}
                    axisLine={{ stroke: '#E7E5E4' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#A8A29E' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `£${(v / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1C1917',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(value: any, name: any) => [
                      `£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,
                      name === 'grossSales' ? 'Gross Sales' : name === 'estProfit' ? 'Est. Profit' : 'Est. Cost',
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }}
                    formatter={(val) => (val === 'grossSales' ? 'Revenue' : val === 'estProfit' ? 'Profit' : 'Cost')}
                  />
                  <Area
                    type="monotone"
                    dataKey="grossSales"
                    stroke="#B45309"
                    fill="#B45309"
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="estProfit"
                    stroke="#D97706"
                    fill="#D97706"
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="estCost"
                    stroke="#78716C"
                    fill="#78716C"
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </section>

      {/* 10. Top Products by Revenue */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-800">Top Products by Revenue</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Top 10 performing menu items sorted by total gross sales.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-25/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Rank</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Item</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Revenue</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Est. Cost</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Est. Profit</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Margin</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.name} className="border-b border-neutral-50 hover:bg-neutral-50/70 transition-colors">
                    <td className="px-5 py-3 font-semibold text-neutral-400">#{p.rank}</td>
                    <td className="px-5 py-3 font-semibold text-neutral-800">{p.name}</td>
                    <td className="px-5 py-3 text-neutral-500">{p.category}</td>
                    <td className="px-5 py-3 text-right font-medium text-neutral-700">{p.quantity.toLocaleString('en-GB')}</td>
                    <td className="px-5 py-3 text-right font-semibold text-neutral-900">{formatCurrency(p.revenue)}</td>
                    <td className="px-5 py-3 text-right text-neutral-600">{formatCurrency(p.cost)}</td>
                    <td className="px-5 py-3 text-right text-neutral-700">{formatCurrency(p.profit)}</td>
                    <td className="px-5 py-3 text-right font-medium text-emerald-700">{p.profitMargin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* 11. Sales Insights */}
      <section className="space-y-3">
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-800">Sales Insights</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Empirical insights calculated dynamically from real dataset transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-25/50 space-y-1">
                <span className="text-xs font-semibold text-accent">Insight #{idx + 1}</span>
                <p className="text-xs text-neutral-600 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
