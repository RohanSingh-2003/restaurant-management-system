import type { TarriRecord } from '../types/dataset';

export interface TopSellerItem {
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  profit: number;
  historicalDailyAvgQty: number;
  velocityRatio: number;
}

export interface CategoryShare {
  category: string;
  revenue: number;
  quantity: number;
  percentage: number;
}

export interface HourlyMetric {
  hour: string;
  hourNumber: number;
  revenue: number;
  orderCount: number;
}

export interface PaymentShare {
  method: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface DailySalesAnalysis {
  dateStr: string;
  dayOfWeek: string;
  totalRevenue: number;
  totalProfit: number;
  orderCount: number;
  itemCount: number;
  avgOrderValue: number;
  profitMargin: number;

  // Day-of-Week Benchmarks
  dayOfWeekAvgRevenue: number;
  dayOfWeekAvgOrders: number;
  dayOfWeekAvgAOV: number;
  revenueVsDayAvgPct: number;
  ordersVsDayAvgPct: number;

  // Overall Daily Benchmarks
  overallAvgDailyRevenue: number;
  revenueVsOverallAvgPct: number;

  // Rankings
  topSellersByVolume: TopSellerItem[];
  topSellersByRevenue: TopSellerItem[];

  // Distributions
  categoryBreakdown: CategoryShare[];
  hourlyBreakdown: HourlyMetric[];
  peakHour: string;
  paymentBreakdown: PaymentShare[];

  // Executive Insights
  narrativeSummary: string;
  performanceGrade: 'EXCELLENT' | 'ABOVE_AVERAGE' | 'AVERAGE' | 'BELOW_AVERAGE';

  // Transaction Rows
  records: TarriRecord[];
}

/**
 * Returns all unique dates present in dataset, sorted from newest to oldest.
 */
export function getAvailableDates(records: TarriRecord[]): string[] {
  const datesMap = new Map<string, number>();

  for (const r of records) {
    if (!r.dateStr) continue;
    if (!datesMap.has(r.dateStr)) {
      datesMap.set(r.dateStr, r.date ? r.date.getTime() : 0);
    }
  }

  return Array.from(datesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([dateStr]) => dateStr);
}

/**
 * Converts ISO (YYYY-MM-DD) to DD/MM/YYYY
 */
export function isoToDateStr(iso: string): string {
  if (!iso || !iso.includes('-')) return iso;
  const [y, m, d] = iso.split('-');
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
}

/**
 * Converts DD/MM/YYYY to ISO (YYYY-MM-DD)
 */
export function dateStrToIso(dateStr: string): string {
  if (!dateStr || !dateStr.includes('/')) return dateStr;
  const [d, m, y] = dateStr.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/**
 * Computes deep daily analysis and benchmarks for a target date.
 */
export function getDailySalesAnalysis(
  records: TarriRecord[],
  targetDateStr: string
): DailySalesAnalysis | null {
  if (!records || records.length === 0) return null;

  // 1. Gather all active (non-cancelled) records
  const activeRecords = records.filter((r) => !r.cancelled);

  // 2. Identify target day records
  const dayRecords = activeRecords.filter((r) => r.dateStr === targetDateStr);

  const sampleRecord = records.find((r) => r.dateStr === targetDateStr);
  let dayOfWeek = sampleRecord?.dayOfWeek;
  if (!dayOfWeek) {
    const [d, m, y] = targetDateStr.split('/').map(Number);
    if (d && m && y) {
      const parsed = new Date(y, m - 1, d);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      dayOfWeek = days[parsed.getDay()];
    } else {
      dayOfWeek = 'Thursday';
    }
  }

  // 3. Overall historical daily averages
  const uniqueDates = new Set(activeRecords.map((r) => r.dateStr));
  const totalDaysCount = Math.max(uniqueDates.size, 1);
  const totalHistoricalRevenue = activeRecords.reduce((sum, r) => sum + r.grossSales, 0);
  const overallAvgDailyRevenue = Math.round((totalHistoricalRevenue / totalDaysCount) * 100) / 100;

  // 4. Same Day-of-Week historical benchmarks
  const sameDayRecords = activeRecords.filter((r) => r.dayOfWeek === dayOfWeek);
  const sameDayDates = new Set(sameDayRecords.map((r) => r.dateStr));
  const sameDayCount = Math.max(sameDayDates.size, 1);

  const sameDayTotalRevenue = sameDayRecords.reduce((sum, r) => sum + r.grossSales, 0);
  const sameDayUniqueOrders = new Set(sameDayRecords.map((r) => r.orderId)).size;

  const dayOfWeekAvgRevenue = Math.round((sameDayTotalRevenue / sameDayCount) * 100) / 100;
  const dayOfWeekAvgOrders = Math.round((sameDayUniqueOrders / sameDayCount) * 10) / 10;
  const dayOfWeekAvgAOV =
    dayOfWeekAvgOrders > 0 ? Math.round((dayOfWeekAvgRevenue / dayOfWeekAvgOrders) * 100) / 100 : 0;

  // 5. Historical average quantity per dish on this day of week
  const dishDayQtyMap = new Map<string, number>();
  for (const r of sameDayRecords) {
    dishDayQtyMap.set(r.lineItemName, (dishDayQtyMap.get(r.lineItemName) || 0) + r.quantity);
  }

  // 6. Metrics for target day
  const totalRevenue = Math.round(dayRecords.reduce((sum, r) => sum + r.grossSales, 0) * 100) / 100;
  const totalProfit = Math.round(dayRecords.reduce((sum, r) => sum + r.estProfit, 0) * 100) / 100;
  const uniqueDayOrders = new Set(dayRecords.map((r) => r.orderId));
  const orderCount = uniqueDayOrders.size;
  const itemCount = dayRecords.reduce((sum, r) => sum + r.quantity, 0);
  const avgOrderValue = orderCount > 0 ? Math.round((totalRevenue / orderCount) * 100) / 100 : 0;
  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;

  // 7. Comparison Deltas
  const revenueVsDayAvgPct =
    dayOfWeekAvgRevenue > 0
      ? Math.round(((totalRevenue - dayOfWeekAvgRevenue) / dayOfWeekAvgRevenue) * 1000) / 10
      : 0;
  const ordersVsDayAvgPct =
    dayOfWeekAvgOrders > 0
      ? Math.round(((orderCount - dayOfWeekAvgOrders) / dayOfWeekAvgOrders) * 1000) / 10
      : 0;
  const revenueVsOverallAvgPct =
    overallAvgDailyRevenue > 0
      ? Math.round(((totalRevenue - overallAvgDailyRevenue) / overallAvgDailyRevenue) * 1000) / 10
      : 0;

  // 8. Dish Aggregations for Target Day
  const dishMap = new Map<
    string,
    { name: string; category: string; quantity: number; revenue: number; profit: number }
  >();

  for (const r of dayRecords) {
    const existing = dishMap.get(r.lineItemName);
    if (!existing) {
      dishMap.set(r.lineItemName, {
        name: r.lineItemName,
        category: r.category,
        quantity: r.quantity,
        revenue: r.grossSales,
        profit: r.estProfit,
      });
    } else {
      existing.quantity += r.quantity;
      existing.revenue += r.grossSales;
      existing.profit += r.estProfit;
    }
  }

  const dishList: TopSellerItem[] = Array.from(dishMap.values()).map((d) => {
    const totalHistoricalQty = dishDayQtyMap.get(d.name) || 0;
    const historicalDailyAvgQty =
      Math.round((totalHistoricalQty / sameDayCount) * 10) / 10 || 1;
    const velocityRatio =
      historicalDailyAvgQty > 0
        ? Math.round((d.quantity / historicalDailyAvgQty) * 10) / 10
        : 1;

    return {
      name: d.name,
      category: d.category,
      quantity: d.quantity,
      revenue: Math.round(d.revenue * 100) / 100,
      profit: Math.round(d.profit * 100) / 100,
      historicalDailyAvgQty,
      velocityRatio,
    };
  });

  const topSellersByVolume = [...dishList].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const topSellersByRevenue = [...dishList].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // 9. Category Breakdown
  const catMap = new Map<string, { revenue: number; quantity: number }>();
  for (const r of dayRecords) {
    const cur = catMap.get(r.category) || { revenue: 0, quantity: 0 };
    cur.revenue += r.grossSales;
    cur.quantity += r.quantity;
    catMap.set(r.category, cur);
  }

  const categoryBreakdown: CategoryShare[] = Array.from(catMap.entries())
    .map(([category, val]) => ({
      category,
      revenue: Math.round(val.revenue * 100) / 100,
      quantity: val.quantity,
      percentage: totalRevenue > 0 ? Math.round((val.revenue / totalRevenue) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // 10. Hourly Breakdown
  const hourMap = new Map<number, { revenue: number; orderIds: Set<string> }>();
  for (let h = 0; h < 24; h++) {
    hourMap.set(h, { revenue: 0, orderIds: new Set<string>() });
  }

  for (const r of dayRecords) {
    const h = parseInt(r.time.split(':')[0], 10);
    if (!isNaN(h) && hourMap.has(h)) {
      const entry = hourMap.get(h)!;
      entry.revenue += r.grossSales;
      entry.orderIds.add(r.orderId);
    }
  }

  const hourlyBreakdown: HourlyMetric[] = Array.from(hourMap.entries())
    .map(([hourNumber, val]) => ({
      hour: `${String(hourNumber).padStart(2, '0')}:00`,
      hourNumber,
      revenue: Math.round(val.revenue * 100) / 100,
      orderCount: val.orderIds.size,
    }))
    .filter((h) => h.revenue > 0 || h.orderCount > 0);

  // Identify peak hour
  let peakHour = '19:00';
  let peakRevenue = -1;
  for (const h of hourlyBreakdown) {
    if (h.revenue > peakRevenue) {
      peakRevenue = h.revenue;
      peakHour = `${h.hour} - ${String(h.hourNumber + 1).padStart(2, '0')}:00`;
    }
  }

  // 11. Payment Breakdown
  const payMap = new Map<string, { count: number; revenue: number }>();
  for (const r of dayRecords) {
    const method = r.payment || 'Card';
    const cur = payMap.get(method) || { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += r.grossSales;
    payMap.set(method, cur);
  }

  const paymentBreakdown: PaymentShare[] = Array.from(payMap.entries()).map(([method, val]) => ({
    method,
    count: val.count,
    revenue: Math.round(val.revenue * 100) / 100,
    percentage: totalRevenue > 0 ? Math.round((val.revenue / totalRevenue) * 100) : 0,
  }));

  // 12. Grade & Narrative Takeaway
  let performanceGrade: DailySalesAnalysis['performanceGrade'] = 'AVERAGE';
  if (revenueVsDayAvgPct >= 15) {
    performanceGrade = 'EXCELLENT';
  } else if (revenueVsDayAvgPct >= 0) {
    performanceGrade = 'ABOVE_AVERAGE';
  } else if (revenueVsDayAvgPct >= -15) {
    performanceGrade = 'AVERAGE';
  } else {
    performanceGrade = 'BELOW_AVERAGE';
  }

  const topDish = topSellersByVolume[0];
  const topCat = categoryBreakdown[0];

  const narrativeParts: string[] = [];
  if (dayRecords.length === 0) {
    narrativeParts.push(`No fulfilled orders recorded on ${dayOfWeek}, ${targetDateStr}.`);
  } else {
    narrativeParts.push(
      `On ${dayOfWeek}, ${targetDateStr}, the restaurant generated £${totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })} across ${orderCount} orders (${avgOrderValue > 0 ? `£${avgOrderValue.toFixed(2)} AOV` : ''}).`
    );

    if (revenueVsDayAvgPct >= 0) {
      narrativeParts.push(
        `This represents an above-average performance (+${revenueVsDayAvgPct}% vs historical ${dayOfWeek} average of £${dayOfWeekAvgRevenue.toFixed(2)}).`
      );
    } else {
      narrativeParts.push(
        `Revenue is ${Math.abs(revenueVsDayAvgPct)}% below typical ${dayOfWeek} intake (historical avg: £${dayOfWeekAvgRevenue.toFixed(2)}).`
      );
    }

    if (topDish) {
      narrativeParts.push(
        `The highest-selling item was "${topDish.name}" with ${topDish.quantity} portions sold (£${topDish.revenue.toFixed(2)}).`
      );
    }

    if (topCat) {
      narrativeParts.push(
        `${topCat.category} led category revenue, generating ${topCat.percentage}% of the day's total.`
      );
    }

    narrativeParts.push(`Peak service volume occurred around ${peakHour}.`);
  }

  const narrativeSummary = narrativeParts.join(' ');

  return {
    dateStr: targetDateStr,
    dayOfWeek,
    totalRevenue,
    totalProfit,
    orderCount,
    itemCount,
    avgOrderValue,
    profitMargin,

    dayOfWeekAvgRevenue,
    dayOfWeekAvgOrders,
    dayOfWeekAvgAOV,
    revenueVsDayAvgPct,
    ordersVsDayAvgPct,

    overallAvgDailyRevenue,
    revenueVsOverallAvgPct,

    topSellersByVolume,
    topSellersByRevenue,
    categoryBreakdown,
    hourlyBreakdown,
    peakHour,
    paymentBreakdown,

    narrativeSummary,
    performanceGrade,

    records: dayRecords,
  };
}
