import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, Button } from '../../../components/ui';
import { loadDataset } from '../../../services/tarriDataService';
import { executeOLAPQuery } from '../../../services/warehouse/olapService';
import type { TarriRecord } from '../../../types/dataset';
import type {
  OLAPCubeQuery,
  OLAPQueryResult,
  OLAPDimensionKey,
  OLAPMeasureKey,
  OLAPAggregation,
  OLAPFilter,
} from '../../../types/dataset';

const DIMENSIONS: { key: OLAPDimensionKey; label: string; desc: string }[] = [
  { key: 'Category', label: 'Category', desc: 'Menu section (e.g. Main Courses, Drinks)' },
  { key: 'Product', label: 'Product (Dish Name)', desc: 'Individual menu dishes' },
  { key: 'OrderType', label: 'Order Type', desc: 'Delivery vs. Collection fulfillment channel' },
  { key: 'Payment', label: 'Payment Method', desc: 'Settlement type utilized' },
  { key: 'DayOfWeek', label: 'Day of Week', desc: 'Weekly operational day' },
  { key: 'Year', label: 'Year', desc: 'Annual partition (2023, 2024, 2025)' },
  { key: 'Month', label: 'Month', desc: 'Monthly chronological period' },
  { key: 'Date', label: 'Date', desc: 'Specific transaction calendar date' },
];

const MEASURES: { key: OLAPMeasureKey; label: string }[] = [
  { key: 'Gross Sales', label: 'Gross Sales (£)' },
  { key: 'Est. Profit', label: 'Est. Profit (£)' },
  { key: 'Est. Cost', label: 'Est. Cost (£)' },
  { key: 'Quantity', label: 'Quantity (Portion Units)' },
  { key: 'Orders', label: 'Unique Orders (OrderID Count)' },
];

export function OLAPExplorerPage() {
  const [records, setRecords] = useState<TarriRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // OLAP Query State
  const [selectedDim, setSelectedDim] = useState<OLAPDimensionKey>('Category');
  const [selectedMeasure, setSelectedMeasure] = useState<OLAPMeasureKey>('Gross Sales');
  const [aggregation, setAggregation] = useState<OLAPAggregation>('SUM');

  // Filter States (Slice & Dice)
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');

  // Drill-down level override
  const [drillDownLevel, setDrillDownLevel] = useState<OLAPDimensionKey | undefined>(undefined);

  // Query Result State
  const [queryResult, setQueryResult] = useState<OLAPQueryResult | null>(null);

  useEffect(() => {
    loadDataset()
      .then((data) => {
        setRecords(data);
        setIsLoading(false);
        // Execute initial baseline OLAP query
        const initial = executeOLAPQuery(data, {
          dimension: 'Category',
          measure: 'Gross Sales',
          aggregation: 'SUM',
          filters: [],
        });
        setQueryResult(initial);
      })
      .catch((err) => {
        console.error('Failed to load dataset for OLAP', err);
        setIsLoading(false);
      });
  }, []);

  // Compute unique filter options from dataset
  const filterOptions = useMemo(() => {
    if (records.length === 0) return { categories: [], orderTypes: [], years: [], payments: [] };
    const cats = Array.from(new Set(records.map((r) => r.category))).filter(Boolean).sort();
    const ot = Array.from(new Set(records.map((r) => r.orderType))).filter(Boolean).sort();
    const yrs = Array.from(new Set(records.map((r) => r.date.getFullYear().toString()))).filter(Boolean).sort();
    const pm = Array.from(new Set(records.map((r) => r.payment))).filter(Boolean).sort();
    return { categories: cats, orderTypes: ot, years: yrs, payments: pm };
  }, [records]);

  // Build and execute query
  const handleRunQuery = () => {
    if (records.length === 0) return;

    const filters: OLAPFilter[] = [];
    if (categoryFilter) filters.push({ dimension: 'Category', operator: 'equals', value: categoryFilter });
    if (orderTypeFilter) filters.push({ dimension: 'OrderType', operator: 'equals', value: orderTypeFilter });
    if (yearFilter) filters.push({ dimension: 'Year', operator: 'equals', value: yearFilter });
    if (paymentFilter) filters.push({ dimension: 'Payment', operator: 'equals', value: paymentFilter });

    const q: OLAPCubeQuery = {
      dimension: selectedDim,
      measure: selectedMeasure,
      aggregation,
      filters,
      drillDownLevel,
      sortBy: 'value',
      sortDirection: 'desc',
    };

    const res = executeOLAPQuery(records, q);
    setQueryResult(res);
  };

  // Drill-down action helper
  const handleDrillDown = () => {
    if (selectedDim === 'Year') {
      setSelectedDim('Month');
    } else if (selectedDim === 'Month') {
      setSelectedDim('Date');
    } else if (selectedDim === 'Category') {
      setSelectedDim('Product');
    }
  };

  // Roll-up action helper
  const handleRollUp = () => {
    if (selectedDim === 'Date') {
      setSelectedDim('Month');
    } else if (selectedDim === 'Month') {
      setSelectedDim('Year');
    } else if (selectedDim === 'Product') {
      setSelectedDim('Category');
    }
  };

  // Clear all Slice/Dice filters
  const handleResetFilters = () => {
    setCategoryFilter('');
    setOrderTypeFilter('');
    setYearFilter('');
    setPaymentFilter('');
  };

  const isTimeDimension = ['Year', 'Month', 'Date', 'DayOfWeek'].includes(queryResult?.query.drillDownLevel || selectedDim);

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Header */}
      <div className="border-b border-neutral-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">OLAP Explorer</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Explore restaurant performance across dimensions and measures using Slice, Dice, Drill-down and Roll-up.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-neutral-100 text-neutral-700 px-3 py-1 rounded border border-neutral-200">
            Online Analytical Processing
          </span>
          <span className="text-xs font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded border border-blue-200">
            Multidimensional Cube
          </span>
        </div>
      </div>

      {/* 2. Educational Concept Banner */}
      <Card className="border border-neutral-100 bg-white">
        <div className="mb-2">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Academic Concept
          </span>
          <h3 className="text-sm font-semibold text-neutral-800 mt-0.5">
            How Multidimensional OLAP Operates
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed mt-1">
            OLAP (Online Analytical Processing) allows restaurant data to be analyzed across multiple business dimensions and aggregation granularities. Unlike static reports, OLAP enables dynamic query manipulation:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-neutral-100">
          <div className="p-2.5 rounded bg-neutral-50 border border-neutral-100">
            <span className="font-semibold text-neutral-800 block">1. Slice</span>
            <span className="text-[11px] text-neutral-500">
              Filters the data cube along exactly one dimension (e.g. Category = MAIN COURSES).
            </span>
          </div>
          <div className="p-2.5 rounded bg-neutral-50 border border-neutral-100">
            <span className="font-semibold text-neutral-800 block">2. Dice</span>
            <span className="text-[11px] text-neutral-500">
              Selects a sub-cube by applying conjunction filters across multiple dimensions.
            </span>
          </div>
          <div className="p-2.5 rounded bg-neutral-50 border border-neutral-100">
            <span className="font-semibold text-neutral-800 block">3. Drill-down</span>
            <span className="text-[11px] text-neutral-500">
              Navigates from summary data to detailed data (e.g. Year → Month → Date).
            </span>
          </div>
          <div className="p-2.5 rounded bg-neutral-50 border border-neutral-100">
            <span className="font-semibold text-neutral-800 block">4. Roll-up</span>
            <span className="text-[11px] text-neutral-500">
              Climbs up the dimensional hierarchy to aggregate details into higher-level totals.
            </span>
          </div>
        </div>
      </Card>

      {/* 3. OLAP Query Builder */}
      <Card className="border border-neutral-100 bg-white space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-800">
            OLAP Query Configuration
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            Interactive Cube Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Dimension Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Group-By Dimension
            </label>
            <select
              value={selectedDim}
              onChange={(e) => {
                setSelectedDim(e.target.value as OLAPDimensionKey);
                setDrillDownLevel(undefined);
              }}
              className="w-full px-3 py-2 text-xs rounded-md border border-neutral-200 bg-white text-neutral-800 focus:outline-none focus:border-accent"
            >
              {DIMENSIONS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Measure Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Analytical Measure
            </label>
            <select
              value={selectedMeasure}
              onChange={(e) => setSelectedMeasure(e.target.value as OLAPMeasureKey)}
              className="w-full px-3 py-2 text-xs rounded-md border border-neutral-200 bg-white text-neutral-800 focus:outline-none focus:border-accent"
            >
              {MEASURES.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Aggregation Function */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Aggregation Function
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAggregation('SUM')}
                className={`py-2 text-xs rounded border transition-colors ${
                  aggregation === 'SUM'
                    ? 'border-accent bg-accent/10 font-semibold text-accent'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                SUM (Total)
              </button>
              <button
                type="button"
                onClick={() => setAggregation('AVG')}
                className={`py-2 text-xs rounded border transition-colors ${
                  aggregation === 'AVG'
                    ? 'border-accent bg-accent/10 font-semibold text-accent'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                AVG (Mean / Order)
              </button>
            </div>
          </div>
        </div>

        {/* Slice & Dice Filters Area */}
        <div className="p-3.5 bg-neutral-50/70 rounded-lg border border-neutral-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-700">
              Slice & Dice Dimensional Filters (Sub-cube Constraints)
            </span>
            {(categoryFilter || orderTypeFilter || yearFilter || paymentFilter) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">Slice Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-200 bg-white text-neutral-800"
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">Slice Order Type:</label>
              <select
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-200 bg-white text-neutral-800"
              >
                <option value="">All Fulfillment</option>
                {filterOptions.orderTypes.map((ot) => (
                  <option key={ot} value={ot}>{ot}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">Slice Year:</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-200 bg-white text-neutral-800"
              >
                <option value="">All Years (2023–2025)</option>
                {filterOptions.years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">Slice Payment:</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-200 bg-white text-neutral-800"
              >
                <option value="">All Payment Types</option>
                {filterOptions.payments.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            {/* Hierarchy Drill buttons */}
            {(selectedDim === 'Year' || selectedDim === 'Month' || selectedDim === 'Category') && (
              <button
                type="button"
                onClick={handleDrillDown}
                className="text-xs px-3 py-1.5 rounded border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 font-medium"
              >
                Drill-Down ↓ (
                {selectedDim === 'Year' ? 'to Month' : selectedDim === 'Month' ? 'to Date' : 'to Product'}
                )
              </button>
            )}

            {(selectedDim === 'Date' || selectedDim === 'Month' || selectedDim === 'Product') && (
              <button
                type="button"
                onClick={handleRollUp}
                className="text-xs px-3 py-1.5 rounded border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 font-medium"
              >
                Roll-Up ↑ (
                {selectedDim === 'Date' ? 'to Month' : selectedDim === 'Month' ? 'to Year' : 'to Category'}
                )
              </button>
            )}
          </div>

          <Button
            onClick={handleRunQuery}
            disabled={isLoading}
            className="text-xs bg-accent text-white font-medium hover:bg-accent/90 px-6 py-2"
          >
            Run OLAP Query
          </Button>
        </div>
      </Card>

      {/* 4. Query Summary Card */}
      {queryResult && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 font-mono">
              OPERATION: {queryResult.operationType}
            </span>
            <span className="text-slate-500">·</span>
            <span className="font-semibold text-slate-900">
              Aggregated Total: £{queryResult.aggregateTotal.toFixed(2)}
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed pt-1">
            {queryResult.summary}
          </p>
        </div>
      )}

      {/* 5. Results & Chart Area */}
      {queryResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
          {/* Left: Dynamic Visualization */}
          <div className="lg:col-span-6 space-y-4 min-w-0">
            <Card className="border border-neutral-100 bg-white">
              <div className="mb-4 pb-2 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800">
                    Multidimensional Distribution
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    {queryResult.query.measure} by {queryResult.query.drillDownLevel || selectedDim}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-neutral-500">
                  {queryResult.rows.length} Cells
                </span>
              </div>

              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  {isTimeDimension ? (
                    <LineChart
                      data={queryResult.rows.slice(0, 20)}
                      margin={{ top: 10, right: 20, bottom: 30, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-35}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val: any) => [
                          queryResult.query.measure === 'Orders'
                            ? Number(val).toLocaleString('en-GB')
                            : `£${Number(val).toFixed(2)}`,
                          queryResult.query.measure,
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart
                      data={queryResult.rows.slice(0, 10)}
                      margin={{ top: 10, right: 20, bottom: 40, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-35}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val: any) => [
                          queryResult.query.measure === 'Orders'
                            ? Number(val).toLocaleString('en-GB')
                            : `£${Number(val).toFixed(2)}`,
                          queryResult.query.measure,
                        ]}
                      />
                      <Bar
                        dataKey="value"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Right: OLAP Result Table */}
          <div className="lg:col-span-6 space-y-4 min-w-0">
            <Card className="border border-neutral-100 bg-white">
              <div className="mb-3 pb-2 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800">
                    Aggregated Cube Table
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Calculated cell values for active query parameters.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-neutral-500">
                  {queryResult.totalUniqueOrders.toLocaleString('en-GB')} Orders
                </span>
              </div>

              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-neutral-500 font-medium uppercase tracking-wider border-b border-neutral-200 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">
                        {queryResult.query.drillDownLevel || selectedDim}
                      </th>
                      <th className="px-3 py-2 text-right">
                        {queryResult.query.measure}
                      </th>
                      <th className="px-3 py-2 text-right">Share (%)</th>
                      <th className="px-3 py-2 text-right">Unique Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-mono">
                    {queryResult.rows.map((row) => (
                      <tr key={row.key} className="hover:bg-neutral-50/50">
                        <td className="px-3 py-2 font-sans font-medium text-neutral-800 truncate max-w-[150px]">
                          {row.label}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-neutral-900">
                          {row.formattedValue}
                        </td>
                        <td className="px-3 py-2 text-right text-neutral-600">
                          {row.percentage.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-right text-neutral-600">
                          {row.orderCount.toLocaleString('en-GB')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
