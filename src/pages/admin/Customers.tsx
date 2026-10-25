import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, KpiCard } from '../../components/ui';
import { useCustomerAnalytics } from '../../hooks/useCustomerAnalytics';
import { formatCurrency } from '../../services/tarriDataService';

export function CustomerAnalytics() {
  const { data, isLoading, error, reload } = useCustomerAnalytics();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-neutral-500 font-medium">
          Loading customer behaviour analytics...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-error-light bg-error-light/20 p-6 text-center">
        <h3 className="text-base font-semibold text-neutral-800">Error Loading Customer Data</h3>
        <p className="mt-1 text-sm text-neutral-500">{error || 'Unable to parse customer behaviour data'}</p>
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
    channels,
    sizeDistribution,
    valueDistribution,
    dayOfWeek,
    timeOfDay,
    insights,
  } = data;

  return (
    <div className="w-full space-y-8 min-w-0">
      {/* 1. Page Header */}
      <div className="border-b border-neutral-100 pb-5 space-y-2">
        <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
          Customer Analysis
        </h1>
        <p className="text-sm text-neutral-400">
          Understand ordering behaviour using the available transaction data.
        </p>
        <div className="mt-3 p-3 rounded-lg border border-neutral-200/80 bg-neutral-50 text-xs text-neutral-600">
          <span className="font-semibold text-neutral-700">Dataset Architecture Note: </span>
          Customer-level identification is not available in the current dataset. The analysis below focuses on observable order behaviour.
        </div>
      </div>

      {/* 2. Order Behaviour KPIs */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
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
            subtext="Per completed basket"
          />
          <KpiCard
            label="Avg. Items / Order"
            value={kpis.averageItemsPerOrder.toString()}
            icon="package"
            subtext="Portions per basket"
          />
          <KpiCard
            label="Avg. Line Revenue"
            value={`£${kpis.averageRevenuePerLine.toFixed(2)}`}
            icon="pound-sterling"
            subtext="Per transaction line"
          />
          <KpiCard
            label="Delivery Orders"
            value={kpis.deliveryOrders.toLocaleString('en-GB')}
            icon="trending-up"
            subtext={`${((kpis.deliveryOrders / kpis.totalOrders) * 100).toFixed(1)}% of orders`}
          />
          <KpiCard
            label="Collection Orders"
            value={kpis.collectionOrders.toLocaleString('en-GB')}
            icon="box"
            subtext={`${((kpis.collectionOrders / kpis.totalOrders) * 100).toFixed(1)}% of orders`}
          />
        </div>
      </section>

      {/* 3. Customer Ordering Channel */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-800">Customer Ordering Channel</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Behavioural metrics across Delivery and Collection fulfillment channels.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-25/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Channel</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Orders</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Order Share</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Revenue</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Revenue Share</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Avg. Order Value</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Avg. Items / Order</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Est. Profit</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((ch) => (
                  <tr key={ch.type} className="border-b border-neutral-50 hover:bg-neutral-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-neutral-800">{ch.type}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-neutral-700">{ch.uniqueOrders.toLocaleString('en-GB')}</td>
                    <td className="px-5 py-3.5 text-right text-neutral-500">{ch.orderShare}%</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-neutral-900">{formatCurrency(ch.revenue)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-accent">{ch.revenueShare}%</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-neutral-900">£{ch.averageOrderValue.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right text-neutral-700 font-medium">{ch.averageItemsPerOrder} items</td>
                    <td className="px-5 py-3.5 text-right text-neutral-700">{formatCurrency(ch.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* 4 & 5. Order Size Distribution & Order Value Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 4. Order Size Distribution */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-sm font-semibold text-neutral-800">Order Size Distribution</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Item quantity count grouped per unique order basket.
            </p>
          </div>
          <div className="px-2 pb-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sizeDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#57534E' }} axisLine={{ stroke: '#E7E5E4' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1C1917',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(v: any, _: any, item: any) => [
                    `${v} orders (${item?.payload?.percentage}% of baskets)`,
                    'Volume',
                  ]}
                />
                <Bar dataKey="orders" fill="#B45309" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 5. Order Value Distribution */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-sm font-semibold text-neutral-800">Order Value Distribution</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Histogram buckets of total gross sales per unique basket.
            </p>
          </div>
          <div className="px-2 pb-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valueDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#57534E' }} axisLine={{ stroke: '#E7E5E4' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1C1917',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(v: any, _: any, item: any) => [
                    `${v} orders (${item?.payload?.percentage}% of baskets)`,
                    'Baskets',
                  ]}
                />
                <Bar dataKey="orders" fill="#D97706" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 6. Day-of-Week Behaviour */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-800">Ordering Behaviour by Day</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Observable ordering volume, revenue and basket sizes across Monday to Sunday.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-25/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Day</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Orders</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Revenue</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Avg. Order Value</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Avg. Items / Order</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Est. Profit</th>
                </tr>
              </thead>
              <tbody>
                {dayOfWeek.map((d) => (
                  <tr key={d.day} className="border-b border-neutral-50 hover:bg-neutral-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-neutral-800">{d.day}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-neutral-700">{d.orders.toLocaleString('en-GB')}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-neutral-900">{formatCurrency(d.revenue)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-neutral-800">
                      {d.orders > 0 ? `£${d.averageOrderValue.toFixed(2)}` : '£0.00'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-neutral-600">
                      {d.orders > 0 ? `${d.averageItemsPerOrder} items` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-neutral-700">{formatCurrency(d.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* 7. Time-of-Day Behaviour */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-800">Ordering Behaviour by Time</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Factual distribution across operating evening service hours (4 PM – 9 PM).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-25/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Service Period</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Orders</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Revenue</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Avg. Order Value</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">Share of Day</th>
                </tr>
              </thead>
              <tbody>
                {timeOfDay.map((t) => (
                  <tr key={t.hour} className="border-b border-neutral-50 hover:bg-neutral-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-neutral-800">{t.label}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-neutral-700">{t.orders.toLocaleString('en-GB')}</td>
                    <td className="px-5 py-3.5 text-right text-neutral-600">{t.quantity.toLocaleString('en-GB')}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-neutral-900">{formatCurrency(t.revenue)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-neutral-800">£{t.averageOrderValue.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-accent">{t.revenueShare}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* 8. Customer Behaviour Insights */}
      <section className="space-y-3">
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-800">Customer Behaviour Insights</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Empirical insights derived strictly from observable basket and fulfillment transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-25/50 space-y-1">
                <span className="text-xs font-semibold text-accent">Observation #{idx + 1}</span>
                <p className="text-xs text-neutral-600 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* 9. Academic Data Limitation Note */}
      <section className="p-4 rounded-lg border border-neutral-200/60 bg-neutral-50 text-xs text-neutral-500 leading-relaxed">
        <span className="font-semibold text-neutral-700">Academic & Methodological Note: </span>
        Customer-level analytics such as retention, repeat purchases and customer segmentation require a Customer ID or equivalent identifier, which is not present in the current dataset. The calculations above remain mathematically grounded strictly in observable basket aggregations.
      </section>
    </div>
  );
}
