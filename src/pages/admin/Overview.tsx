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
import { useOverviewAnalytics } from '../../hooks/useOverviewAnalytics';
import { formatCurrency } from '../../services/tarriDataService';

export function AnalyticsOverview() {
  const { data, isLoading, error, reload } = useOverviewAnalytics();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-neutral-500 font-medium">
          Loading detailed restaurant analytics...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-error-light bg-error-light/20 p-6 text-center">
        <h3 className="text-base font-semibold text-neutral-800">Error Loading Analytics</h3>
        <p className="mt-1 text-sm text-neutral-500">{error || 'Unable to parse analytics data'}</p>
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
    monthlyRevenue,
    revenueSummary,
    profitabilityTrend,
    orderMetrics,
    orderTypes,
    dayOfWeek,
    hourlyActivity,
    categoryPerformance,
    cancellation,
    yearlyTrends,
    insights,
    dataQuality,
  } = data;

  return (
    <div className="w-full space-y-8 min-w-0">
      {/* 1. Page Header */}
      <div className="border-b border-neutral-100 pb-5">
        <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
          Overview
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          A detailed view of restaurant performance, trends and business activity.
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
            label="Avg. Order Value"
            value={`£${kpis.averageOrderValue.toFixed(2)}`}
            icon="receipt"
            subtext="Per completed order"
          />
          <KpiCard
            label="Quantity Sold"
            value={kpis.totalQuantity.toLocaleString('en-GB')}
            icon="package"
            subtext={`${kpis.averageItemsPerOrder} items / order`}
          />
        </div>
      </section>

      {/* 3. Revenue Analysis */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-800">Revenue Analysis</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Monthly gross sales across the complete 36-month historical dataset (Jan 2023 – Dec 2025).
            </p>
          </div>

          <div className="p-5">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                    formatter={(value: any) => [`£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, 'Gross Revenue']}
                    labelStyle={{ color: '#A8A29E', marginBottom: '4px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="grossSales"
                    stroke="#B45309"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#B45309', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#B45309', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Summary Stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-100">
              <div className="p-3 rounded-lg bg-neutral-50">
                <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Highest Month</p>
                <p className="mt-1 text-sm font-semibold text-neutral-800">{revenueSummary.highestMonth.label}</p>
                <p className="text-xs font-semibold text-accent">{formatCurrency(revenueSummary.highestMonth.grossSales)}</p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50">
                <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Lowest Month</p>
                <p className="mt-1 text-sm font-semibold text-neutral-800">{revenueSummary.lowestMonth.label}</p>
                <p className="text-xs font-medium text-neutral-600">{formatCurrency(revenueSummary.lowestMonth.grossSales)}</p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50">
                <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Avg. Monthly Revenue</p>
                <p className="mt-1 text-sm font-semibold text-neutral-800">{formatCurrency(revenueSummary.averageMonthlyRevenue)}</p>
                <p className="text-xs text-neutral-400">Across 36 months</p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50">
                <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Total Gross Revenue</p>
                <p className="mt-1 text-sm font-semibold text-neutral-800">{formatCurrency(revenueSummary.totalRevenue)}</p>
                <p className="text-xs text-neutral-400">Full dataset period</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Profitability Analysis */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-neutral-800">Profitability</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Comparison of Revenue, Cost, and Profit over time.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 font-semibold self-start">
              Overall Margin: {kpis.profitMargin}%
            </span>
          </div>

          <div className="p-5">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitabilityTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                      name === 'grossSales' ? 'Gross Revenue' : name === 'estProfit' ? 'Est. Profit' : 'Est. Cost',
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

            {/* Profitability KPI Summary */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-100 text-center sm:text-left">
              <div className="p-3 rounded-lg bg-neutral-50">
                <span className="text-xs text-neutral-400">Total Gross Sales</span>
                <p className="text-base font-semibold text-neutral-900 mt-0.5">{formatCurrency(kpis.totalRevenue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50">
                <span className="text-xs text-neutral-400">Total Est. Cost</span>
                <p className="text-base font-semibold text-neutral-700 mt-0.5">{formatCurrency(kpis.totalCost)}</p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50">
                <span className="text-xs text-neutral-400">Total Est. Profit</span>
                <p className="text-base font-semibold text-accent mt-0.5">{formatCurrency(kpis.totalProfit)}</p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50">
                <span className="text-xs text-neutral-400">Net Profit Margin</span>
                <p className="text-base font-semibold text-emerald-700 mt-0.5">{kpis.profitMargin}%</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 5. Order Activity Analysis */}
      <section className="space-y-3">
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-800">Order Activity</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Core transactional volume, basket sizing, and fulfillment metrics.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50">
              <span className="text-xs text-neutral-400">Unique Valid Orders</span>
              <p className="text-lg font-semibold text-neutral-800 mt-1">{orderMetrics.uniqueOrders.toLocaleString('en-GB')}</p>
              <span className="text-[11px] text-neutral-400">Non-cancelled</span>
            </div>
            <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50">
              <span className="text-xs text-neutral-400">Avg. Items / Order</span>
              <p className="text-lg font-semibold text-neutral-800 mt-1">{orderMetrics.averageItemsPerOrder}</p>
              <span className="text-[11px] text-neutral-400">Items per basket</span>
            </div>
            <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50">
              <span className="text-xs text-neutral-400">Avg. Order Value</span>
              <p className="text-lg font-semibold text-neutral-800 mt-1">£{orderMetrics.averageOrderValue.toFixed(2)}</p>
              <span className="text-[11px] text-neutral-400">Gross per order</span>
            </div>
            <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50">
              <span className="text-xs text-neutral-400">Cancelled Orders</span>
              <p className="text-lg font-semibold text-neutral-800 mt-1">{orderMetrics.cancelledOrders}</p>
              <span className="text-[11px] text-neutral-400">Unique orders</span>
            </div>
            <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50 col-span-2 sm:col-span-1">
              <span className="text-xs text-neutral-400">Cancellation Rate</span>
              <p className="text-lg font-semibold text-error mt-1">{orderMetrics.cancellationRate}%</p>
              <span className="text-[11px] text-neutral-400">Of total orders</span>
            </div>
          </div>
        </Card>
      </section>

      {/* 6. Order Type Performance */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-800">Order Type Performance</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Comprehensive comparison between Delivery and Collection orders.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-25/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Order Type</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Orders</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Order Share</th>
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
                    <td className="px-5 py-3.5 text-right text-neutral-500">{ot.orderShare}%</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-neutral-900">{formatCurrency(ot.revenue)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-accent">{ot.revenueShare}%</td>
                    <td className="px-5 py-3.5 text-right font-medium text-neutral-800">£{ot.averageOrderValue.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right text-neutral-700">{formatCurrency(ot.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* 7 & 8. Day of Week & Time Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 7. Performance by Day */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-sm font-semibold text-neutral-800">Performance by Day</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Revenue and order volume in natural weekday sequence.
            </p>
          </div>
          <div className="px-2 pb-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeek} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#57534E' }} axisLine={{ stroke: '#E7E5E4' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#A8A29E' }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    background: '#1C1917',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(v: any, _: any, item: any) => [
                    `£${Number(v || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })} (${item?.payload?.uniqueOrders} orders)`,
                    'Revenue',
                  ]}
                />
                <Bar dataKey="grossSales" fill="#D97706" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 8. Order Activity by Time */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-sm font-semibold text-neutral-800">Order Activity by Time</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Service concentration across operating hours (4 PM – 9 PM).
            </p>
          </div>
          <div className="px-2 pb-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyActivity} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#57534E' }} axisLine={{ stroke: '#E7E5E4' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#A8A29E' }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
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
                <Bar dataKey="grossSales" fill="#B45309" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 9 & 10. Category Performance & Sales Distribution */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-800">Category Performance</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Detailed category ranking by revenue, order frequency, and volume.
              </p>
            </div>
            <span className="text-xs text-neutral-400 font-medium">
              Ranked by Revenue
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-25/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Orders Included</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Quantity Sold</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Revenue</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Rev Share</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Est. Profit</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Margin</th>
                </tr>
              </thead>
              <tbody>
                {categoryPerformance.map((c) => (
                  <tr key={c.category} className="border-b border-neutral-50 hover:bg-neutral-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-neutral-800">{c.category}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-neutral-700">{c.orders.toLocaleString('en-GB')}</td>
                    <td className="px-5 py-3.5 text-right text-neutral-600">{c.quantity.toLocaleString('en-GB')}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-neutral-900">{formatCurrency(c.grossSales)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-accent">{c.percentage}%</td>
                    <td className="px-5 py-3.5 text-right text-neutral-700">{formatCurrency(c.estProfit)}</td>
                    <td className="px-5 py-3.5 text-right text-emerald-700 font-medium">{c.profitMargin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* 11 & 12. Cancellation Analysis & Business Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 11. Cancellation Overview */}
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-800">Cancellation Overview</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Fulfillment reliability and order cancellation audit.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-50">
              <span className="text-xs text-neutral-500">Total Unique Orders</span>
              <span className="text-sm font-semibold text-neutral-800">{cancellation.totalUniqueOrders.toLocaleString('en-GB')}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-50">
              <span className="text-xs text-neutral-500">Completed Valid Orders</span>
              <span className="text-sm font-semibold text-neutral-800">{cancellation.validUniqueOrders.toLocaleString('en-GB')}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-50">
              <span className="text-xs text-neutral-500">Cancelled Unique Orders</span>
              <span className="text-sm font-semibold text-neutral-800">{cancellation.cancelledUniqueOrders}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-50">
              <span className="text-xs text-neutral-500">Cancellation Rate</span>
              <span className="text-sm font-semibold text-error">{cancellation.cancellationRate}%</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-50">
              <span className="text-xs text-neutral-500">Cancelled Revenue</span>
              <span className="text-sm font-medium text-neutral-700">{formatCurrency(cancellation.cancelledRevenue)}</span>
            </div>
          </div>
        </Card>

        {/* 12. Business Trends (Year-over-Year) */}
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-800">Business Trends</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Year-over-year operational volume and revenue shift.
            </p>
          </div>

          <div className="space-y-3">
            {yearlyTrends.map((yt) => (
              <div key={yt.year} className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-25/50 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-neutral-800">{yt.year}</span>
                  <span className="text-xs font-medium text-neutral-500">
                    {yt.orders.toLocaleString('en-GB')} orders
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Gross Revenue:</span>
                  <span className="font-semibold text-neutral-900">{formatCurrency(yt.revenue)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Estimated Profit:</span>
                  <span className="font-medium text-neutral-700">{formatCurrency(yt.profit)}</span>
                </div>
                {yt.revenueGrowth !== undefined && (
                  <div className="pt-1.5 border-t border-neutral-100 flex justify-between text-xs">
                    <span className="text-neutral-400">YoY Revenue Change:</span>
                    <span className={`font-semibold ${yt.revenueGrowth >= 0 ? 'text-success' : 'text-error'}`}>
                      {yt.revenueGrowth >= 0 ? `+${yt.revenueGrowth}%` : `${yt.revenueGrowth}%`}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 13. Key Insights */}
      <section className="space-y-3">
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-800">Key Insights</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Analytical observations derived strictly from full dataset calculations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-25/50 space-y-1">
                <span className="text-xs font-semibold text-accent">Insight #{idx + 1}</span>
                <p className="text-xs text-neutral-600 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* 14. Data Quality Audit */}
      <section className="space-y-3">
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-800">Data Quality Audit</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Integrity analysis for warehouse and mining readiness.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center sm:text-left">
            <div className="p-3 rounded-lg bg-neutral-50">
              <span className="text-xs text-neutral-400">Total Rows</span>
              <p className="text-sm font-semibold text-neutral-800 mt-1">{dataQuality.totalRecords.toLocaleString('en-GB')}</p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50">
              <span className="text-xs text-neutral-400">Columns</span>
              <p className="text-sm font-semibold text-neutral-800 mt-1">{dataQuality.totalColumns}</p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50">
              <span className="text-xs text-neutral-400">Missing Cells</span>
              <p className="text-sm font-semibold text-emerald-700 mt-1">{dataQuality.missingValues}</p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50">
              <span className="text-xs text-neutral-400">Duplicate Rows</span>
              <p className="text-sm font-semibold text-emerald-700 mt-1">{dataQuality.duplicateRows}</p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50">
              <span className="text-xs text-neutral-400">Cancelled Rows</span>
              <p className="text-sm font-semibold text-neutral-800 mt-1">{dataQuality.cancelledRows}</p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50">
              <span className="text-xs text-neutral-400">Date Lifespan</span>
              <p className="text-xs font-semibold text-neutral-800 mt-1 truncate">{dataQuality.dateRangeStr}</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
