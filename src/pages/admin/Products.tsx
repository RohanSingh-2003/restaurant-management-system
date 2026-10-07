import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { Card, KpiCard } from '../../components/ui';
import { useProductAnalytics } from '../../hooks/useProductAnalytics';
import { formatCurrency } from '../../services/tarriDataService';
import type { ProductDetail } from '../../types/dataset';

type ProductSortKey = 'revenue' | 'quantity' | 'profit' | 'margin';

export function ProductAnalytics() {
  const { data, isLoading, error, reload } = useProductAnalytics();
  const [productSort, setProductSort] = useState<ProductSortKey>('revenue');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const allProducts = data?.allProducts;
  // Filtered and sorted products list
  const processedProducts = useMemo(() => {
    if (!allProducts) return [];
    let list = [...allProducts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'All') {
      list = list.filter((p) => p.category === categoryFilter);
    }

    switch (productSort) {
      case 'quantity':
        return list.sort((a, b) => (sortAsc ? a.quantity - b.quantity : b.quantity - a.quantity));
      case 'profit':
        return list.sort((a, b) => (sortAsc ? a.profit - b.profit : b.profit - a.profit));
      case 'margin':
        return list.sort((a, b) => (sortAsc ? a.profitMargin - b.profitMargin : b.profitMargin - a.profitMargin));
      case 'revenue':
      default:
        return list.sort((a, b) => (sortAsc ? a.revenue - b.revenue : b.revenue - a.revenue));
    }
  }, [allProducts, searchQuery, categoryFilter, productSort, sortAsc]);

  const toggleSort = (key: ProductSortKey) => {
    if (productSort === key) {
      setSortAsc(!sortAsc);
    } else {
      setProductSort(key);
      setSortAsc(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-neutral-500 font-medium">
          Loading menu product analytics...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-error-light bg-error-light/20 p-6 text-center">
        <h3 className="text-base font-semibold text-neutral-800">Error Loading Product Data</h3>
        <p className="mt-1 text-sm text-neutral-500">{error || 'Unable to parse product data'}</p>
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
    topSellingByQuantity,
    topRevenueItems,
    mostProfitableItems,
    categories,
    priceAnalysis,
    insights,
  } = data;

  const uniqueCategories = ['All', ...categories.map((c) => c.category)];

  // Prepare scatter data for Quantity vs Revenue
  const scatterData = (allProducts || []).map((p) => ({
    name: p.name,
    category: p.category,
    quantity: p.quantity,
    revenue: p.revenue,
    profit: p.profit,
  }));

  return (
    <div className="w-full space-y-8 min-w-0">
      {/* 1. Page Header */}
      <div className="border-b border-neutral-100 pb-5">
        <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
          Product Analysis
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Analyze menu item performance, sales volume and profitability.
        </p>
      </div>

      {/* 2. Product KPI Section */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard
            label="Menu Items"
            value={kpis.totalMenuItems.toString()}
            icon="package"
            subtext="Unique dishes tracked"
          />
          <KpiCard
            label="Categories"
            value={kpis.totalCategories.toString()}
            icon="boxes"
            subtext="Menu sections"
          />
          <KpiCard
            label="Quantity Sold"
            value={kpis.totalQuantitySold.toLocaleString('en-GB')}
            icon="shopping-bag"
            subtext="Total portions sold"
          />
          <KpiCard
            label="Top Revenue Item"
            value={kpis.topRevenueItem.name}
            icon="pound-sterling"
            subtext={formatCurrency(kpis.topRevenueItem.revenue)}
          />
          <KpiCard
            label="Top Selling Item"
            value={kpis.topSellingItem.name}
            icon="trending-up"
            subtext={`${kpis.topSellingItem.quantity.toLocaleString('en-GB')} units sold`}
          />
          <KpiCard
            label="Most Profitable"
            value={kpis.mostProfitableItem.name}
            icon="trending-up"
            subtext={formatCurrency(kpis.mostProfitableItem.profit)}
          />
        </div>
      </section>

      {/* 3 & 4. Best-Selling Items & Highest Revenue Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 3. Best-Selling Items by Quantity */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-sm font-semibold text-neutral-800">Best-Selling Items by Quantity</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Top 10 menu items ranked by total units ordered.
            </p>
          </div>
          <div className="px-3 pb-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topSellingByQuantity}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#A8A29E' }} axisLine={{ stroke: '#E7E5E4' }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#57534E' }}
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
                  formatter={(v: any, _: any, item: any) => [
                    `${v} units (${formatCurrency(item?.payload?.revenue)})`,
                    'Quantity Sold',
                  ]}
                />
                <Bar dataKey="quantity" fill="#D97706" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 4. Highest Revenue Items */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-sm font-semibold text-neutral-800">Highest Revenue Items</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Top 10 menu items ranked by gross revenue.
            </p>
          </div>
          <div className="px-3 pb-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topRevenueItems}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#A8A29E' }}
                  axisLine={{ stroke: '#E7E5E4' }}
                  tickLine={false}
                  tickFormatter={(v) => `£${(v / 1000).toFixed(1)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#57534E' }}
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
                  formatter={(v: any, _: any, item: any) => [
                    `${formatCurrency(v)} (${item?.payload?.quantity} units, profit ${formatCurrency(item?.payload?.profit)})`,
                    'Revenue',
                  ]}
                />
                <Bar dataKey="revenue" fill="#B45309" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 5. Complete Top Products Detailed Table */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-800">Top Products</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Complete menu performance rankings across all 62 menu dishes.
              </p>
            </div>

            {/* Controls: Search, Category Filter, and Sort buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search dish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-2.5 py-1 text-xs rounded border border-neutral-200 bg-white text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-accent"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-1 text-xs rounded border border-neutral-200 bg-white text-neutral-700 focus:outline-none focus:border-accent"
              >
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleSort('revenue')}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    productSort === 'revenue'
                      ? 'border-accent bg-accent/5 text-accent font-semibold'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  Revenue {productSort === 'revenue' ? (sortAsc ? '↑' : '↓') : ''}
                </button>
                <button
                  onClick={() => toggleSort('quantity')}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    productSort === 'quantity'
                      ? 'border-accent bg-accent/5 text-accent font-semibold'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  Qty {productSort === 'quantity' ? (sortAsc ? '↑' : '↓') : ''}
                </button>
                <button
                  onClick={() => toggleSort('profit')}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    productSort === 'profit'
                      ? 'border-accent bg-accent/5 text-accent font-semibold'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  Profit {productSort === 'profit' ? (sortAsc ? '↑' : '↓') : ''}
                </button>
                <button
                  onClick={() => toggleSort('margin')}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    productSort === 'margin'
                      ? 'border-accent bg-accent/5 text-accent font-semibold'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  Margin {productSort === 'margin' ? (sortAsc ? '↑' : '↓') : ''}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-50 border-b border-neutral-100 z-10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Rank</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Product</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Category</th>
                  <th
                    onClick={() => toggleSort('quantity')}
                    className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-neutral-700"
                  >
                    Quantity Sold
                  </th>
                  <th
                    onClick={() => toggleSort('revenue')}
                    className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-neutral-700"
                  >
                    Revenue
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Est. Cost
                  </th>
                  <th
                    onClick={() => toggleSort('profit')}
                    className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-neutral-700"
                  >
                    Est. Profit
                  </th>
                  <th
                    onClick={() => toggleSort('margin')}
                    className="px-5 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-neutral-700"
                  >
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedProducts.map((p: ProductDetail, idx) => (
                  <tr key={p.name} className="border-b border-neutral-50 hover:bg-neutral-50/70 transition-colors">
                    <td className="px-5 py-3 text-xs font-semibold text-neutral-400">#{idx + 1}</td>
                    <td className="px-5 py-3 font-semibold text-neutral-800">{p.name}</td>
                    <td className="px-5 py-3 text-neutral-500">{p.category}</td>
                    <td className="px-5 py-3 text-right font-medium text-neutral-700">{p.quantity.toLocaleString('en-GB')}</td>
                    <td className="px-5 py-3 text-right font-semibold text-neutral-900">{formatCurrency(p.revenue)}</td>
                    <td className="px-5 py-3 text-right text-neutral-600">{formatCurrency(p.cost)}</td>
                    <td className="px-5 py-3 text-right text-neutral-700">{formatCurrency(p.profit)}</td>
                    <td className="px-5 py-3 text-right text-emerald-700 font-medium">{p.profitMargin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* 6 & 7. Most Profitable Products & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 6. Most Profitable Items */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-800">Most Profitable Items</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Top 10 dishes delivering highest net contribution margin.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-25/50">
                  <th className="px-4 py-2.5 text-left font-medium text-neutral-400 uppercase">Product</th>
                  <th className="px-4 py-2.5 text-right font-medium text-neutral-400 uppercase">Revenue</th>
                  <th className="px-4 py-2.5 text-right font-medium text-neutral-400 uppercase">Est. Cost</th>
                  <th className="px-4 py-2.5 text-right font-medium text-neutral-400 uppercase">Est. Profit</th>
                  <th className="px-4 py-2.5 text-right font-medium text-neutral-400 uppercase">Margin</th>
                </tr>
              </thead>
              <tbody>
                {mostProfitableItems.map((p) => (
                  <tr key={p.name} className="border-b border-neutral-50 hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-neutral-800">{p.name}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-neutral-700">{formatCurrency(p.revenue)}</td>
                    <td className="px-4 py-2.5 text-right text-neutral-500">{formatCurrency(p.cost)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-accent">{formatCurrency(p.profit)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-emerald-700">{p.profitMargin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 7. Category Performance */}
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-800">Category Performance</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Menu category portfolio summary and profit margin.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-25/50">
                  <th className="px-4 py-2.5 text-left font-medium text-neutral-400 uppercase">Category</th>
                  <th className="px-4 py-2.5 text-right font-medium text-neutral-400 uppercase">Dishes</th>
                  <th className="px-4 py-2.5 text-right font-medium text-neutral-400 uppercase">Quantity</th>
                  <th className="px-4 py-2.5 text-right font-medium text-neutral-400 uppercase">Revenue</th>
                  <th className="px-4 py-2.5 text-right font-medium text-neutral-400 uppercase">Rev Share</th>
                  <th className="px-4 py-2.5 text-right font-medium text-neutral-400 uppercase">Margin</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.category} className="border-b border-neutral-50 hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-neutral-800">{c.category}</td>
                    <td className="px-4 py-2.5 text-right text-neutral-600">{c.productCount}</td>
                    <td className="px-4 py-2.5 text-right text-neutral-700">{c.quantity.toLocaleString('en-GB')}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-neutral-900">{formatCurrency(c.revenue)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-accent">{c.revenueShare}%</td>
                    <td className="px-4 py-2.5 text-right text-emerald-700 font-medium">{c.profitMargin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 8. Price Analysis */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-800">Price Analysis</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Unit price spectrum across all menu line items.
            </p>
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-neutral-50">
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Average Price Per Item</span>
                <p className="mt-1 text-lg font-semibold text-neutral-800">£{priceAnalysis.avgPrice.toFixed(2)}</p>
                <span className="text-[11px] text-neutral-400">Mean unit price</span>
              </div>
              <div className="p-3.5 rounded-lg bg-neutral-50">
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Lowest Price</span>
                <p className="mt-1 text-lg font-semibold text-neutral-800">£{priceAnalysis.minPrice.toFixed(2)}</p>
                <span className="text-[11px] text-neutral-400">Complimentary sauce / addition</span>
              </div>
              <div className="p-3.5 rounded-lg bg-neutral-50">
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Highest Price</span>
                <p className="mt-1 text-lg font-semibold text-neutral-800">£{priceAnalysis.maxPrice.toFixed(2)}</p>
                <span className="text-[11px] text-neutral-400">Family / banquet deal item</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-neutral-500 mb-2">Price Tier Distribution (Transaction Lines)</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {priceAnalysis.priceRanges.map((pr) => (
                  <div key={pr.range} className="p-3 rounded-lg border border-neutral-100 bg-neutral-25/50 text-center sm:text-left">
                    <span className="text-[11px] text-neutral-400">{pr.range}</span>
                    <p className="text-sm font-semibold text-neutral-800 mt-0.5">{pr.count} lines</p>
                    <span className="text-[10px] text-accent font-medium">{pr.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 9. Product Quantity vs Revenue Relationship */}
      <section className="space-y-3">
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-neutral-800">Quantity Sold vs. Revenue Relationship</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Scatter distribution mapping menu dish popularity (Quantity Sold) vs revenue contribution.
            </p>
          </div>

          <div className="p-5">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                  <XAxis
                    type="number"
                    dataKey="quantity"
                    name="Quantity"
                    tick={{ fontSize: 10, fill: '#A8A29E' }}
                    label={{ value: 'Quantity Sold (Portions)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#78716C' }}
                  />
                  <YAxis
                    type="number"
                    dataKey="revenue"
                    name="Revenue"
                    tick={{ fontSize: 10, fill: '#A8A29E' }}
                    tickFormatter={(v) => `£${v}`}
                    label={{ value: 'Revenue (£)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#78716C' }}
                  />
                  <ZAxis range={[60, 60]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      background: '#1C1917',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      name === 'Revenue'
                        ? `£${Number(val || 0).toFixed(2)}`
                        : `${val} portions`,
                      item?.payload?.name || name,
                    ]}
                  />
                  <Scatter name="Dishes" data={scatterData} fill="#B45309" fillOpacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </section>

      {/* 10. Product Insights */}
      <section className="space-y-3">
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-800">Product Insights</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Empirical menu intelligence derived dynamically from line-item transaction records.
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
