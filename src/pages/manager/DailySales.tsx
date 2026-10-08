import { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  Utensils,
  Clock,
  CreditCard,
  Download,
  Search,
  Sparkles,
  Flame,
  RefreshCw,
} from 'lucide-react';
import { useTarriData } from '../../hooks/useTarriData';
import { Card } from '../../components/ui/Card';
import {
  getAvailableDates,
  getDailySalesAnalysis,
  isoToDateStr,
  dateStrToIso,
  type DailySalesAnalysis,
} from '../../services/managerDailySalesService';
import { recordsToCSV } from '../../services/tarriDataService';

export function ManagerDailySales() {
  const { records, isLoading, reload } = useTarriData();

  // Find today's date formatted as DD/MM/YYYY
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  // Available unique dates from dataset
  const availableDates = useMemo(() => getAvailableDates(records), [records]);

  // Selected date state: defaults to today if present, or newest available date
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [searchTableQuery, setSearchTableQuery] = useState('');

  // If today isn't yet selected and dates load, set to today
  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates.includes(todayDateStr) ? todayDateStr : availableDates[0]);
    }
  }, [availableDates, todayDateStr, selectedDate]);

  // Compute comprehensive analysis for the selected day
  const analysis: DailySalesAnalysis | null = useMemo(() => {
    if (!selectedDate || records.length === 0) return null;
    return getDailySalesAnalysis(records, selectedDate);
  }, [records, selectedDate]);

  // Filter table records by search query
  const filteredRecords = useMemo(() => {
    if (!analysis) return [];
    if (!searchTableQuery.trim()) return analysis.records;
    const q = searchTableQuery.toLowerCase();
    return analysis.records.filter(
      (r) =>
        r.lineItemName.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.payment.toLowerCase().includes(q)
    );
  }, [analysis, searchTableQuery]);

  // Handle Export CSV for this single day
  const handleExportDayCSV = () => {
    if (!analysis || analysis.records.length === 0) return;
    const csv = recordsToCSV(analysis.records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${selectedDate.replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isToday = selectedDate === todayDateStr;

  return (
    <div className="w-full space-y-6 pb-12 min-w-0">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
              Daily Sales & Performance Explorer
            </h1>
            {isToday && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Today
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Deep performance audit, historical benchmark comparison, and dish leaderboard for any specific day.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Date Selector Pills */}
          <div className="inline-flex items-center bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs font-medium">
            <button
              onClick={() => setSelectedDate(todayDateStr)}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                isToday ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Today
            </button>
            {availableDates.length > 1 && (
              <button
                onClick={() => {
                  const yesterday = availableDates.find((d) => d !== todayDateStr);
                  if (yesterday) setSelectedDate(yesterday);
                }}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedDate === availableDates.find((d) => d !== todayDateStr)
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Previous Day
              </button>
            )}
          </div>

          {/* Native HTML5 Date Picker */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={dateStrToIso(selectedDate)}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(isoToDateStr(e.target.value));
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-xs"
            />
          </div>

          {/* Quick Historical Dropdown */}
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-xs max-w-[140px]"
          >
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {d === todayDateStr ? `Today (${d})` : d}
              </option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportDayCSV}
            disabled={!analysis || analysis.records.length === 0}
            className="px-3.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export Day CSV
          </button>

          {/* Reload Button */}
          <button
            onClick={() => reload()}
            title="Refresh dataset from disk"
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Executive Narrative Brief */}
      {analysis && (
        <Card className="p-5 border border-neutral-200 bg-linear-to-r from-neutral-900 to-neutral-800 text-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-white/10 text-amber-300">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Executive Sales Brief • {analysis.dayOfWeek}, {analysis.dateStr}
              </span>
            </div>

            {/* Performance Grade Badge */}
            <div>
              {analysis.performanceGrade === 'EXCELLENT' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ★ Outstanding Performance (+{analysis.revenueVsDayAvgPct}%)
                </span>
              )}
              {analysis.performanceGrade === 'ABOVE_AVERAGE' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  ▲ Above {analysis.dayOfWeek} Average (+{analysis.revenueVsDayAvgPct}%)
                </span>
              )}
              {analysis.performanceGrade === 'AVERAGE' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-700 text-neutral-300 border border-neutral-600">
                  ■ Normal Operating Volume ({analysis.revenueVsDayAvgPct}%)
                </span>
              )}
              {analysis.performanceGrade === 'BELOW_AVERAGE' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  ▼ Slower Than Usual ({analysis.revenueVsDayAvgPct}%)
                </span>
              )}
            </div>
          </div>

          <p className="mt-3 text-xs sm:text-sm text-neutral-200 leading-relaxed font-normal">
            {analysis.narrativeSummary}
          </p>
        </Card>
      )}

      {/* 3. Four Core Metrics with Benchmark Badges */}
      {analysis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <Card className="p-5 border border-neutral-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Gross Sales
              </span>
              <div className="h-8 w-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 tracking-tight">
              £{analysis.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs">
              {analysis.revenueVsDayAvgPct >= 0 ? (
                <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  <TrendingUp className="h-3 w-3" />
                  +{analysis.revenueVsDayAvgPct}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                  <TrendingDown className="h-3 w-3" />
                  {analysis.revenueVsDayAvgPct}%
                </span>
              )}
              <span className="text-neutral-400 text-[11px]">
                vs {analysis.dayOfWeek} Avg (£{analysis.dayOfWeekAvgRevenue.toFixed(2)})
              </span>
            </div>
          </Card>

          {/* Total Orders */}
          <Card className="p-5 border border-neutral-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Orders Fulfilled
              </span>
              <div className="h-8 w-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 tracking-tight">
              {analysis.orderCount}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs">
              {analysis.ordersVsDayAvgPct >= 0 ? (
                <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  <TrendingUp className="h-3 w-3" />
                  +{analysis.ordersVsDayAvgPct}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                  <TrendingDown className="h-3 w-3" />
                  {analysis.ordersVsDayAvgPct}%
                </span>
              )}
              <span className="text-neutral-400 text-[11px]">
                vs {analysis.dayOfWeek} Avg ({analysis.dayOfWeekAvgOrders} orders)
              </span>
            </div>
          </Card>

          {/* Average Order Value (AOV) */}
          <Card className="p-5 border border-neutral-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Avg. Ticket (AOV)
              </span>
              <div className="h-8 w-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center">
                <Utensils className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 tracking-tight">
              £{analysis.avgOrderValue.toFixed(2)}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-neutral-500">
              <span className="text-[11px] text-neutral-400">
                Historical {analysis.dayOfWeek} benchmark: £{analysis.dayOfWeekAvgAOV.toFixed(2)}
              </span>
            </div>
          </Card>

          {/* Profit & Margin */}
          <Card className="p-5 border border-neutral-200 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Est. Gross Profit
              </span>
              <div className="h-8 w-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 tracking-tight">
              £{analysis.totalProfit.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-xs">
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                {analysis.profitMargin}% Profit Margin
              </span>
              <span className="text-neutral-400 text-[11px]">{analysis.itemCount} portions sold</span>
            </div>
          </Card>
        </div>
      )}

      {/* 4. Dish Performance Leaderboard ("What was sold highest" & "What was good") */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: What Was Sold Highest (Volume Leaderboard) */}
          <Card className="p-5 border border-neutral-200 bg-white shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    Highest Sold Dishes (By Volume)
                  </h3>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Dishes ordered most frequently by guests on this day.
                </p>
              </div>
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                Top 5
              </span>
            </div>

            {analysis.topSellersByVolume.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center">No dishes sold on this date.</p>
            ) : (
              <div className="space-y-3">
                {analysis.topSellersByVolume.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-800">{item.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] uppercase font-semibold text-neutral-400">
                            {item.category}
                          </span>
                          {item.velocityRatio >= 1.5 && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded">
                              🔥 {item.velocityRatio}x Usual Volume
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-neutral-900">{item.quantity} sold</div>
                      <div className="text-[11px] text-neutral-500 font-medium">£{item.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Right: What Was Good (Top Revenue Drivers) */}
          <Card className="p-5 border border-neutral-200 bg-white shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    Top Revenue Contributors
                  </h3>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Menu items generating the largest monetary intake.
                </p>
              </div>
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                Top 5
              </span>
            </div>

            {analysis.topSellersByRevenue.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center">No revenue recorded on this date.</p>
            ) : (
              <div className="space-y-3">
                {analysis.topSellersByRevenue.map((item, idx) => (
                  <div
                    key={item.name}
                    className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-400">#{idx + 1}</span>
                        <span className="text-xs font-bold text-neutral-800">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600">
                        £{item.revenue.toFixed(2)}
                      </span>
                    </div>

                    {/* Progress bar representing share of total day revenue */}
                    <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{
                          width: `${analysis.totalRevenue > 0 ? (item.revenue / analysis.totalRevenue) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-neutral-400 font-medium">
                      <span>{item.quantity} portions ordered</span>
                      <span>
                        {analysis.totalRevenue > 0
                          ? Math.round((item.revenue / analysis.totalRevenue) * 100)
                          : 0}
                        % of day sales
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 5. Category Breakdown & Peak Hour Service */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <Card className="p-5 border border-neutral-200 bg-white shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Category Distribution</h3>
            <p className="text-[11px] text-neutral-400 mb-4">Gross sales contribution by menu section.</p>

            <div className="space-y-3">
              {analysis.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-700">{cat.category}</span>
                    <span className="font-bold text-neutral-900">
                      £{cat.revenue.toFixed(2)}{' '}
                      <span className="text-neutral-400 font-normal">({cat.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-neutral-800 h-1.5 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Peak Service Hour */}
          <Card className="p-5 border border-neutral-200 bg-white shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Peak Service Hour</h3>
            <p className="text-[11px] text-neutral-400 mb-4">When guests placed the highest order volume.</p>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-center mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Busiest Window
              </span>
              <div className="text-xl font-extrabold text-amber-950 mt-1">{analysis.peakHour}</div>
              <p className="text-[11px] text-amber-800 mt-1 font-medium">
                Highest turnover period of the day.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                Hourly Timeline
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                {analysis.hourlyBreakdown.map((h) => (
                  <div
                    key={h.hour}
                    className="flex items-center justify-between py-1 border-b border-neutral-100"
                  >
                    <span className="text-neutral-600 font-medium">{h.hour}</span>
                    <span className="font-semibold text-neutral-800">
                      £{h.revenue.toFixed(2)}{' '}
                      <span className="text-neutral-400 font-normal text-[10px]">
                        ({h.orderCount} orders)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Payment Method Split */}
          <Card className="p-5 border border-neutral-200 bg-white shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Payment Methods</h3>
            <p className="text-[11px] text-neutral-400 mb-4">Payment types utilized on this date.</p>

            <div className="space-y-3">
              {analysis.paymentBreakdown.map((p) => (
                <div
                  key={p.method}
                  className="p-3 rounded-lg border border-neutral-100 bg-neutral-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-white border border-neutral-200 flex items-center justify-center text-neutral-700">
                      <CreditCard className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-800">{p.method}</div>
                      <div className="text-[10px] text-neutral-400">{p.count} transactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-neutral-900">£{p.revenue.toFixed(2)}</div>
                    <div className="text-[10px] text-neutral-500 font-medium">{p.percentage}% share</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 6. Searchable Transaction Item Log for Selected Date */}
      {analysis && (
        <Card className="border border-neutral-200 bg-white shadow-xs overflow-hidden">
          <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Fulfilled Dish Transactions ({analysis.records.length} items)
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Item-level order details for {analysis.dayOfWeek}, {analysis.dateStr}.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search dish, order ID, category..."
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Time</th>
                  <th className="py-2.5 px-4 font-semibold">Order ID</th>
                  <th className="py-2.5 px-4 font-semibold">Menu Dish</th>
                  <th className="py-2.5 px-4 font-semibold">Category</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Qty</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Unit Price</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Gross Sales</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Payment</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-neutral-400">
                      No order line items match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, i) => (
                    <tr key={`${r.orderId}-${i}`} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-2.5 px-4 text-neutral-500 font-mono">{r.time}</td>
                      <td className="py-2.5 px-4 font-semibold text-neutral-900 font-mono">{r.orderId}</td>
                      <td className="py-2.5 px-4 font-medium text-neutral-800">{r.lineItemName}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                          {r.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-neutral-800">{r.quantity}</td>
                      <td className="py-2.5 px-4 text-right text-neutral-500 font-mono">
                        £{r.pricePerItem.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-neutral-900 font-mono">
                        £{r.grossSales.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-neutral-100 text-neutral-600">
                          {r.payment || 'Card'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center text-neutral-500 text-[11px]">
                        {r.orderType}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
