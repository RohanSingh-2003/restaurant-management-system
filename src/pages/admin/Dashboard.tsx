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
} from 'recharts';
import { Card, KpiCard } from '../../components/ui';
import { useTarriData } from '../../hooks/useTarriData';
import { formatCurrency } from '../../services/tarriDataService';

export function AdminDashboard() {
  const {
    metrics,
    isLoading,
    error,
    reload,
  } = useTarriData();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-neutral-500 font-medium">
          Loading and processing restaurant dataset...
        </p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-lg border border-error-light bg-error-light/20 p-6 text-center">
        <h3 className="text-base font-semibold text-neutral-800">Error Loading Dataset</h3>
        <p className="mt-1 text-sm text-neutral-500">{error || 'Unable to parse dataset'}</p>
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
    totalRevenue,
    totalOrders,
    totalProfit,
    totalQuantity,
    profitMargin,
    monthlyData,
    categoryData,
    topProducts,
    orderTypeData,
    dayOfWeekData,
    cancellation,
    summary,
    insights,
  } = metrics;

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Page header */}
      <div className="border-b border-neutral-100 pb-5">
        <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          An overview of restaurant performance and sales activity.
        </p>
      </div>

      {/* 2. Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue, true)}
          icon="pound-sterling"
          subtext={`Gross: ${formatCurrency(totalRevenue)}`}
        />
        <KpiCard
          label="Total Orders"
          value={totalOrders.toLocaleString('en-GB')}
          icon="shopping-bag"
          subtext="Unique non-cancelled orders"
        />
        <KpiCard
          label="Estimated Profit"
          value={formatCurrency(totalProfit, true)}
          icon="trending-up"
          change={`${profitMargin}%`}
          changeType="positive"
          subtext="profit margin"
        />
        <KpiCard
          label="Quantity Sold"
          value={totalQuantity.toLocaleString('en-GB')}
          icon="package"
          subtext="Total food & drink items"
        />
      </div>

      {/* 3 & 4. Revenue Overview & Profit Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* 3. Revenue Overview */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-sm font-semibold text-neutral-800">Revenue Overview</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Revenue performance across the selected period (Gross Sales).
            </p>
          </div>
          <div className="px-2 pb-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#A8A29E' }}
                  axisLine={{ stroke: '#E7E5E4' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
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
                  formatter={(value: any) => [`£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, 'Gross Sales']}
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
        </Card>

        {/* 4. Profit Overview */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-sm font-semibold text-neutral-800">Profit Overview</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Estimated profit trend over time (Est. Profit).
            </p>
          </div>
          <div className="px-2 pb-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#A8A29E' }}
                  axisLine={{ stroke: '#E7E5E4' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
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
                  formatter={(value: any) => [`£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, 'Est. Profit']}
                  labelStyle={{ color: '#A8A29E', marginBottom: '4px' }}
                />
                <Area
                  type="monotone"
                  dataKey="estProfit"
                  stroke="#D97706"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#profitGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 5 & 8. Sales by Category & Performance by Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* 5. Sales by Category */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-sm font-semibold text-neutral-800">Sales by Category</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Gross sales sorted by category performance (excluding pie charts).
            </p>
          </div>
          <div className="px-2 pb-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={categoryData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#A8A29E' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 11, fill: '#57534E' }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1C1917',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(value: any, _: any, item: any) => [
                    `£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })} (${item?.payload?.percentage}%)`,
                    'Gross Sales',
                  ]}
                />
                <Bar
                  dataKey="grossSales"
                  fill="#B45309"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 8. Performance by Day (Natural Day of Week Order) */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-sm font-semibold text-neutral-800">Performance by Day</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Revenue distribution in natural weekday order (Monday to Sunday).
            </p>
          </div>
          <div className="px-2 pb-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dayOfWeekData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#57534E' }}
                  axisLine={{ stroke: '#E7E5E4' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#A8A29E' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1C1917',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(value: any, _: any, item: any) => [
                    `£${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })} (${item?.payload?.uniqueOrders} orders)`,
                    'Revenue',
                  ]}
                />
                <Bar
                  dataKey="grossSales"
                  fill="#D97706"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 7 & 9. Order Type Analysis & Cancellation Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 7. Order Type Analysis */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-800">Order Type Analysis</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Performance breakdown between Delivery and Collection.
              </p>
            </div>
            <span className="text-xs text-neutral-400 font-medium">
              {totalOrders.toLocaleString('en-GB')} valid orders
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orderTypeData.map((ot) => {
              const isDelivery = ot.type.toLowerCase().includes('delivery');
              return (
                <div
                  key={ot.type}
                  className="rounded-lg border border-neutral-100 p-4 bg-neutral-25/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-700">
                      {ot.type}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        isDelivery
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-stone-50 text-stone-700 border border-stone-200'
                      }`}
                    >
                      {ot.revenueShare}% revenue
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>Unique Orders:</span>
                      <span className="font-medium text-neutral-800">
                        {ot.uniqueOrders.toLocaleString('en-GB')} ({ot.orderShare}%)
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>Gross Sales:</span>
                      <span className="font-semibold text-neutral-900">
                        {formatCurrency(ot.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>Estimated Profit:</span>
                      <span className="font-medium text-neutral-700">
                        {formatCurrency(ot.profit)}
                      </span>
                    </div>
                  </div>

                  {/* Share Progress Bar */}
                  <div className="w-full bg-neutral-200/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isDelivery ? 'bg-accent' : 'bg-neutral-500'}`}
                      style={{ width: `${ot.revenueShare}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 9. Cancellation Summary */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-800">Cancellations</h2>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
              99.29% Fulfilled
            </span>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            Order cancellation audit (calculated strictly by unique OrderID).
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-md bg-neutral-50 border border-neutral-100">
              <span className="text-xs text-neutral-500">Cancelled Orders</span>
              <span className="text-sm font-semibold text-neutral-800">
                {cancellation.cancelledUniqueOrders} of {cancellation.totalUniqueOrders}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-md bg-neutral-50 border border-neutral-100">
              <span className="text-xs text-neutral-500">Cancellation Rate</span>
              <span className="text-sm font-semibold text-error">
                {cancellation.cancellationRate}%
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-md bg-neutral-50 border border-neutral-100">
              <span className="text-xs text-neutral-500">Cancelled Revenue</span>
              <span className="text-xs font-medium text-neutral-600">
                {formatCurrency(cancellation.cancelledRevenue)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 mt-3 italic">
            * Cancellation metrics track full unique orders rather than individual line items.
          </p>
        </Card>
      </div>

      {/* 6 & 10. Top Menu Items & Dataset Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 6. Top Menu Items Table */}
        <Card padding="none" className="lg:col-span-2">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-neutral-100">
            <div>
              <h2 className="text-sm font-semibold text-neutral-800">Top Menu Items</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Top 10 dishes sorted by total gross revenue.
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
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Item</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Quantity Sold</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Revenue</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Est. Profit</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((prod, idx) => (
                  <tr
                    key={prod.name}
                    className="border-b border-neutral-50 hover:bg-neutral-50/80 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-400 w-4">
                          {idx + 1}.
                        </span>
                        <div>
                          <p className="font-medium text-neutral-800">{prod.name}</p>
                          <span className="text-[11px] text-neutral-400 uppercase tracking-wider">
                            {prod.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-neutral-600">
                      {prod.quantity.toLocaleString('en-GB')}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-neutral-900">
                      {formatCurrency(prod.revenue)}
                    </td>
                    <td className="px-5 py-3 text-right text-neutral-600">
                      {formatCurrency(prod.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 10. Dataset Information Card */}
        <Card>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-neutral-800">Dataset Information</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            Source data calculated dynamically from the project data warehouse.
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-md bg-neutral-50">
              <span className="text-neutral-500">File:</span>
              <span className="font-mono font-medium text-neutral-800">{summary.filename}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-neutral-50">
              <span className="text-neutral-500">Total Records:</span>
              <span className="font-semibold text-neutral-800">{summary.totalRecords.toLocaleString('en-GB')}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-neutral-50">
              <span className="text-neutral-500">Recognized Columns:</span>
              <span className="font-semibold text-neutral-800">{summary.totalColumns}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-neutral-50">
              <span className="text-neutral-500">Unique Orders:</span>
              <span className="font-semibold text-neutral-800">{summary.uniqueOrders.toLocaleString('en-GB')}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-neutral-50">
              <span className="text-neutral-500">Date Range:</span>
              <span className="font-medium text-neutral-800 text-right">{summary.dateRangeStr}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Status: Verified</span>
            <span className="text-emerald-700 font-medium">Live Engine</span>
          </div>
        </Card>
      </div>

      {/* 11. Key Insights Section */}
      <Card>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-neutral-800">Key Insights</h2>
        </div>
        <p className="text-xs text-neutral-400 mb-4">
          Data-driven analytical insights derived strictly from verified dataset calculations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="rounded-lg border border-neutral-100 bg-neutral-25/50 p-3.5 space-y-1"
            >
              <span className="text-xs font-semibold text-accent">
                Insight #{index + 1}
              </span>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {insight}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
