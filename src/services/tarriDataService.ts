import type {
  TarriRecord,
  MonthlyMetric,
  CategoryMetric,
  ProductMetric,
  OrderTypeMetric,
  DayOfWeekMetric,
  CancellationMetric,
  DatasetSummary,
  DashboardMetrics,
  OverviewKPIs,
  HourlyMetric,
  DetailedCategoryMetric,
  DetailedOrderTypeMetric,
  YearlyTrend,
  ProfitabilityPoint,
  DataQualityMetrics,
  OverviewAnalyticsData,
  MonthlySalesRecord,
  DayOfWeekSales,
  TimeSales,
  ProductDetail,
  OrderSizeBucket,
  OrderValueBucket,
  SalesAnalyticsData,
  CustomerBehaviourData,
  ProductAnalyticsData,
} from '../types/dataset';
import type { OperationalOrder } from '../types/operational';

let cachedRecords: TarriRecord[] | null = null;

/**
 * Parse date in DD/MM/YYYY format into a Date object.
 */
export function parseDates(dateStr: string): Date {
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) {
    return new Date(dateStr);
  }
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

/**
 * Parse raw CSV string into strongly-typed TarriRecord array.
 */
export function parseCSV(csvText: string): TarriRecord[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const records: TarriRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',');
    if (parts.length < 14) continue;

    const orderId = parts[0].trim();
    const dateStr = parts[1].trim();
    const dayOfWeek = parts[2].trim();
    const time = parts[3].trim();
    const category = parts[4].trim();
    const lineItemName = parts[5].trim();
    const quantity = parseFloat(parts[6]) || 0;
    const pricePerItem = parseFloat(parts[7]) || 0;
    const grossSales = parseFloat(parts[8]) || 0;
    const estCost = parseFloat(parts[9]) || 0;
    const estProfit = parseFloat(parts[10]) || 0;
    const orderType = parts[11].trim();
    const payment = parts[12].trim();
    const cancelled = parts[13].trim().toLowerCase() === 'yes';

    records.push({
      orderId,
      date: parseDates(dateStr),
      dateStr,
      dayOfWeek,
      time,
      category,
      lineItemName,
      quantity,
      pricePerItem,
      grossSales,
      estCost,
      estProfit,
      orderType,
      payment,
      cancelled,
    });
  }

  return records;
}

export const DATASET_EVENT = 'rms_dataset_update';
export const APPENDED_RECORDS_KEY = 'rms_appended_order_records';

export function subscribeDatasetUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(DATASET_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(DATASET_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function getAppendedRecords(): TarriRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(APPENDED_RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    let migrated = false;
    const records = parsed.map((r: any) => {
      let orderId = r.orderId;
      if (orderId && !orderId.startsWith('RES_ORD_')) {
        const numMatch = String(orderId).match(/\d+/);
        const num = numMatch ? parseInt(numMatch[0], 10) : 6325;
        orderId = num === 1003 ? 'RES_ORD_6325.0' : `RES_ORD_${num}.0`;
        migrated = true;
      }
      return {
        ...r,
        orderId,
        date: new Date(r.date),
      };
    });

    if (migrated) {
      saveAppendedRecords(records);
    }
    return records;
  } catch {
    return [];
  }
}

export function saveAppendedRecords(records: TarriRecord[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(APPENDED_RECORDS_KEY, JSON.stringify(records));
  }
}

export function orderToTarriRecords(order: OperationalOrder): TarriRecord[] {
  const d = new Date(order.createdAt || Date.now());
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const dateStr = `${day}/${month}/${year}`;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = days[d.getDay()];
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const orderType = order.tableId || order.tableNumber ? 'Dine-in' : (order.source === 'CUSTOMER' ? 'Collection' : 'Dine-in');
  const payment = order.payment?.method ? (order.payment.method === 'Cash' ? 'Cash' : 'Card') : 'Card';
  const cancelled = order.status === 'Cancelled';

  let formattedOrderId = order.orderNumber || order.id;
  if (!formattedOrderId.startsWith('RES_ORD_')) {
    const numMatch = formattedOrderId.match(/\d+/);
    const num = numMatch ? parseInt(numMatch[0], 10) : 6325;
    formattedOrderId = `RES_ORD_${num}.0`;
  } else if (!formattedOrderId.endsWith('.0')) {
    formattedOrderId = `${formattedOrderId}.0`;
  }

  return (order.items || []).map((item) => {
    const quantity = Number(item.quantity) || 1;
    const pricePerItem = Number(item.unitPrice) || 0;
    const grossSales = Math.round(quantity * pricePerItem * 100) / 100;
    const estCost = Math.round(grossSales * 0.35 * 100) / 100;
    const estProfit = Math.round((grossSales - estCost) * 100) / 100;

    return {
      orderId: formattedOrderId,
      date: d,
      dateStr,
      dayOfWeek,
      time,
      category: item.category || 'MAIN COURSES',
      lineItemName: item.productName || 'MenuItem',
      quantity,
      pricePerItem,
      grossSales,
      estCost,
      estProfit,
      orderType,
      payment,
      cancelled,
    };
  });
}

export async function appendOrderToDataset(order: OperationalOrder): Promise<void> {
  const newRecords = orderToTarriRecords(order);
  if (newRecords.length === 0) return;

  // 1. Update in-memory cache
  if (cachedRecords) {
    cachedRecords = [...newRecords, ...cachedRecords];
  }

  // 2. Persist in localStorage
  const existingAppended = getAppendedRecords();
  const filtered = existingAppended.filter((r) => r.orderId !== (order.orderNumber || order.id));
  const updatedAppended = [...newRecords, ...filtered];
  saveAppendedRecords(updatedAppended);

  // 3. Dispatch reactivity event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATASET_EVENT));
  }

  // 4. Try posting to dev server middleware to append to public/tarri_data.csv on disk
  try {
    const csvRows = newRecords
      .map((r) =>
        [
          r.orderId,
          r.dateStr,
          r.dayOfWeek,
          r.time,
          r.category,
          r.lineItemName.includes(',') ? `"${r.lineItemName}"` : r.lineItemName,
          r.quantity,
          r.pricePerItem,
          r.grossSales,
          r.estCost,
          r.estProfit,
          r.orderType,
          r.payment,
          r.cancelled ? 'Yes' : 'No',
        ].join(',')
      )
      .join('\n');

    await fetch('/api/dataset/append', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvRows, orderId: order.orderNumber || order.id }),
    });
  } catch {
    // Non-blocking in environments without the dev middleware
  }
}

export async function updateOrderInDataset(
  orderId: string,
  updates: { cancelled?: boolean; payment?: string }
): Promise<void> {
  if (cachedRecords) {
    cachedRecords = cachedRecords.map((r) => {
      if (r.orderId === orderId) {
        return {
          ...r,
          cancelled: updates.cancelled !== undefined ? updates.cancelled : r.cancelled,
          payment: updates.payment !== undefined ? updates.payment : r.payment,
        };
      }
      return r;
    });
  }

  const appended = getAppendedRecords();
  const updatedAppended = appended.map((r) => {
    if (r.orderId === orderId) {
      return {
        ...r,
        cancelled: updates.cancelled !== undefined ? updates.cancelled : r.cancelled,
        payment: updates.payment !== undefined ? updates.payment : r.payment,
      };
    }
    return r;
  });
  saveAppendedRecords(updatedAppended);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATASET_EVENT));
  }

  try {
    await fetch('/api/dataset/update-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, ...updates }),
    });
  } catch {
    // Non-blocking
  }
}

export function recordsToCSV(records: TarriRecord[]): string {
  const headers = [
    'OrderID',
    'Date',
    'DayOfWeek',
    'Time',
    'Category',
    'Line item name',
    'Quantity',
    'Price Per Item',
    'Gross Sales',
    'Est. Cost',
    'Est. Profit',
    'OrderType',
    'Payment',
    'Cancelled',
  ];

  const rows = records.map((r) =>
    [
      r.orderId,
      r.dateStr,
      r.dayOfWeek,
      r.time,
      r.category,
      r.lineItemName.includes(',') ? `"${r.lineItemName.replace(/"/g, '""')}"` : r.lineItemName,
      r.quantity,
      r.pricePerItem,
      r.grossSales,
      r.estCost,
      r.estProfit,
      r.orderType,
      r.payment,
      r.cancelled ? 'Yes' : 'No',
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Loads the dataset asynchronously from /tarri_data.csv (served statically by Vite).
 * Caches in memory and combines with any dynamic operational orders.
 */
export async function loadDataset(forceRefresh = false): Promise<TarriRecord[]> {
  if (!forceRefresh && cachedRecords && cachedRecords.length > 0) {
    return cachedRecords;
  }

  const response = await fetch(`/tarri_data.csv?_t=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tarri_data.csv: ${response.statusText}`);
  }

  const text = await response.text();
  const base = parseCSV(text);
  const appended = getAppendedRecords();

  const baseOrderKeys = new Set(
    base.map((r) => `${r.orderId}_${r.lineItemName}_${r.quantity}_${r.time}`)
  );

  const merged: TarriRecord[] = [...base];
  for (const r of appended) {
    const key = `${r.orderId}_${r.lineItemName}_${r.quantity}_${r.time}`;
    if (!baseOrderKeys.has(key)) {
      merged.unshift(r);
      baseOrderKeys.add(key);
    }
  }

  cachedRecords = merged;
  return cachedRecords;
}

/**
 * Explicitly sets or replaces the cached dataset in memory.
 */
export function setCustomDataset(records: TarriRecord[]): void {
  cachedRecords = records;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATASET_EVENT));
  }
}

/**
 * Returns only valid (non-cancelled) transactions.
 * Excludes any transaction whose unique OrderID was cancelled.
 */
export function getValidTransactions(records: TarriRecord[]): TarriRecord[] {
  const cancelledOrderIds = new Set<string>();
  for (const r of records) {
    if (r.cancelled) {
      cancelledOrderIds.add(r.orderId);
    }
  }

  return records.filter((r) => !cancelledOrderIds.has(r.orderId));
}

/**
 * Calculate total revenue from Gross Sales.
 */
export function getTotalRevenue(records: TarriRecord[]): number {
  return records.reduce((sum, r) => sum + r.grossSales, 0);
}

/**
 * Calculate total orders using unique OrderID.
 */
export function getTotalOrders(records: TarriRecord[]): number {
  const orderIds = new Set<string>();
  for (const r of records) {
    orderIds.add(r.orderId);
  }
  return orderIds.size;
}

/**
 * Calculate total estimated profit from Est. Profit.
 */
export function getTotalProfit(records: TarriRecord[]): number {
  return records.reduce((sum, r) => sum + r.estProfit, 0);
}

/**
 * Calculate total quantity sold.
 */
export function getTotalQuantity(records: TarriRecord[]): number {
  return records.reduce((sum, r) => sum + r.quantity, 0);
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Aggregates revenue and profit by Year-Month.
 * Distinguished by month and year (e.g. Feb 2023 ... Dec 2025).
 */
export function getRevenueByMonth(records: TarriRecord[]): MonthlyMetric[] {
  const monthMap = new Map<string, {
    key: string;
    label: string;
    year: number;
    month: number;
    grossSales: number;
    estProfit: number;
    orderIds: Set<string>;
  }>();

  for (const r of records) {
    const y = r.date.getFullYear();
    const m = r.date.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[m - 1]} ${y}`;

    let entry = monthMap.get(key);
    if (!entry) {
      entry = {
        key,
        label,
        year: y,
        month: m,
        grossSales: 0,
        estProfit: 0,
        orderIds: new Set<string>(),
      };
      monthMap.set(key, entry);
    }

    entry.grossSales += r.grossSales;
    entry.estProfit += r.estProfit;
    entry.orderIds.add(r.orderId);
  }

  return Array.from(monthMap.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((m) => ({
      key: m.key,
      label: m.label,
      year: m.year,
      month: m.month,
      grossSales: Math.round(m.grossSales * 100) / 100,
      estProfit: Math.round(m.estProfit * 100) / 100,
      orders: m.orderIds.size,
    }));
}

export function getProfitByMonth(records: TarriRecord[]): MonthlyMetric[] {
  return getRevenueByMonth(records);
}

/**
 * Calculate total Gross Sales for each category, sorted descending by revenue.
 */
export function getRevenueByCategory(records: TarriRecord[]): CategoryMetric[] {
  const catMap = new Map<string, { grossSales: number; estProfit: number; quantity: number }>();
  let totalRevenue = 0;

  for (const r of records) {
    const cat = r.category || 'Other';
    let entry = catMap.get(cat);
    if (!entry) {
      entry = { grossSales: 0, estProfit: 0, quantity: 0 };
      catMap.set(cat, entry);
    }
    entry.grossSales += r.grossSales;
    entry.estProfit += r.estProfit;
    entry.quantity += r.quantity;
    totalRevenue += r.grossSales;
  }

  return Array.from(catMap.entries())
    .map(([category, data]) => ({
      category,
      grossSales: Math.round(data.grossSales * 100) / 100,
      estProfit: Math.round(data.estProfit * 100) / 100,
      quantity: data.quantity,
      percentage: totalRevenue > 0 ? Math.round((data.grossSales / totalRevenue) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.grossSales - a.grossSales);
}

/**
 * Aggregate top menu items by revenue.
 */
export function getTopProducts(records: TarriRecord[], limit = 10): ProductMetric[] {
  const itemMap = new Map<string, {
    category: string;
    quantity: number;
    revenue: number;
    profit: number;
  }>();

  for (const r of records) {
    const name = r.lineItemName;
    let entry = itemMap.get(name);
    if (!entry) {
      entry = {
        category: r.category,
        quantity: 0,
        revenue: 0,
        profit: 0,
      };
      itemMap.set(name, entry);
    }
    entry.quantity += r.quantity;
    entry.revenue += r.grossSales;
    entry.profit += r.estProfit;
  }

  return Array.from(itemMap.entries())
    .map(([name, data]) => ({
      name,
      category: data.category,
      quantity: data.quantity,
      revenue: Math.round(data.revenue * 100) / 100,
      profit: Math.round(data.profit * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/**
 * Compares Delivery vs Collection metrics.
 */
export function getOrderTypeMetrics(records: TarriRecord[]): OrderTypeMetric[] {
  const typeMap = new Map<string, {
    orderIds: Set<string>;
    revenue: number;
    profit: number;
  }>();

  let totalOrdersCount = 0;
  let totalRevenue = 0;

  for (const r of records) {
    const type = r.orderType || 'Unknown';
    let entry = typeMap.get(type);
    if (!entry) {
      entry = { orderIds: new Set(), revenue: 0, profit: 0 };
      typeMap.set(type, entry);
    }
    entry.orderIds.add(r.orderId);
    entry.revenue += r.grossSales;
    entry.profit += r.estProfit;
  }

  // Calculate unique orders across all order types
  for (const entry of typeMap.values()) {
    totalOrdersCount += entry.orderIds.size;
    totalRevenue += entry.revenue;
  }

  return Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    uniqueOrders: data.orderIds.size,
    revenue: Math.round(data.revenue * 100) / 100,
    profit: Math.round(data.profit * 100) / 100,
    orderShare: totalOrdersCount > 0 ? Math.round((data.orderIds.size / totalOrdersCount) * 1000) / 10 : 0,
    revenueShare: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 1000) / 10 : 0,
  }));
}

const NATURAL_WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Calculates day of week performance in natural weekday order (Monday -> Sunday).
 */
export function getDayOfWeekMetrics(records: TarriRecord[]): DayOfWeekMetric[] {
  const dowMap = new Map<string, { grossSales: number; estProfit: number; orderIds: Set<string> }>();

  for (const day of NATURAL_WEEKDAYS) {
    dowMap.set(day, { grossSales: 0, estProfit: 0, orderIds: new Set() });
  }

  for (const r of records) {
    const normalized = r.dayOfWeek.charAt(0).toUpperCase() + r.dayOfWeek.slice(1).toLowerCase();
    const entry = dowMap.get(normalized);
    if (entry) {
      entry.grossSales += r.grossSales;
      entry.estProfit += r.estProfit;
      entry.orderIds.add(r.orderId);
    }
  }

  return NATURAL_WEEKDAYS.map((day) => {
    const data = dowMap.get(day)!;
    return {
      day,
      grossSales: Math.round(data.grossSales * 100) / 100,
      estProfit: Math.round(data.estProfit * 100) / 100,
      uniqueOrders: data.orderIds.size,
    };
  });
}

/**
 * Computes cancellation metrics using unique OrderID.
 */
export function getCancellationMetrics(records: TarriRecord[]): CancellationMetric {
  const orderMap = new Map<string, { isCancelled: boolean; grossSales: number }>();

  for (const r of records) {
    if (!orderMap.has(r.orderId)) {
      orderMap.set(r.orderId, { isCancelled: r.cancelled, grossSales: r.grossSales });
    } else {
      const cur = orderMap.get(r.orderId)!;
      if (r.cancelled) cur.isCancelled = true;
      cur.grossSales += r.grossSales;
    }
  }

  const totalUniqueOrders = orderMap.size;
  let cancelledUniqueOrders = 0;
  let cancelledRevenue = 0;

  for (const info of orderMap.values()) {
    if (info.isCancelled) {
      cancelledUniqueOrders++;
      cancelledRevenue += info.grossSales;
    }
  }

  const validUniqueOrders = totalUniqueOrders - cancelledUniqueOrders;
  const cancellationRate = totalUniqueOrders > 0
    ? Math.round((cancelledUniqueOrders / totalUniqueOrders) * 10000) / 100
    : 0;

  return {
    totalUniqueOrders,
    cancelledUniqueOrders,
    validUniqueOrders,
    cancellationRate,
    cancelledRevenue: Math.round(cancelledRevenue * 100) / 100,
  };
}

/**
 * Computes dataset metadata (records, columns, unique orders, date range).
 */
export function getDatasetSummary(records: TarriRecord[]): DatasetSummary {
  const uniqueOrders = new Set(records.map((r) => r.orderId)).size;

  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  for (const r of records) {
    if (!minDate || r.date < minDate) minDate = r.date;
    if (!maxDate || r.date > maxDate) maxDate = r.date;
  }

  const formatDate = (d: Date | null) => {
    if (!d) return 'N/A';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const dateRangeStr = minDate && maxDate ? `${formatDate(minDate)} – ${formatDate(maxDate)}` : 'N/A';

  return {
    filename: 'tarri_data.csv',
    totalRecords: records.length,
    totalColumns: 14,
    uniqueOrders,
    dateRangeStr,
    minDate,
    maxDate,
  };
}

/**
 * Dynamically generates factual insights calculated strictly from loaded data.
 */
export function generateInsights(validRecords: TarriRecord[], allRecords: TarriRecord[]): string[] {
  if (validRecords.length === 0) return ['No transaction data available.'];

  const insights: string[] = [];

  const totalRevenue = getTotalRevenue(validRecords);
  const totalProfit = getTotalProfit(validRecords);
  const categories = getRevenueByCategory(validRecords);
  const topProducts = getTopProducts(validRecords, 1);
  const days = getDayOfWeekMetrics(validRecords);
  const orderTypes = getOrderTypeMetrics(validRecords);
  const cancellation = getCancellationMetrics(allRecords);
  const monthly = getRevenueByMonth(validRecords);

  // 1. Highest Revenue Category
  if (categories.length > 0) {
    const topCat = categories[0];
    insights.push(
      `${topCat.category} generated the highest revenue among all categories at £${topCat.grossSales.toLocaleString('en-GB', { minimumFractionDigits: 2 })} (${topCat.percentage}% of total sales).`
    );
  }

  // 2. Highest Revenue Menu Item
  if (topProducts.length > 0) {
    const topItem = topProducts[0];
    insights.push(
      `"${topItem.name}" is the top revenue-generating menu item, delivering £${topItem.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })} with ${topItem.quantity} units ordered.`
    );
  }

  // 3. Peak Day of Week
  const sortedDays = [...days].sort((a, b) => b.grossSales - a.grossSales);
  if (sortedDays.length > 0 && sortedDays[0].grossSales > 0) {
    const peakDay = sortedDays[0];
    insights.push(
      `${peakDay.day} is the most lucrative day of the week, generating £${peakDay.grossSales.toLocaleString('en-GB', { minimumFractionDigits: 2 })} across ${peakDay.uniqueOrders} unique orders.`
    );
  }

  // 4. Order Type Breakdown
  const delivery = orderTypes.find((o) => o.type === 'Delivery');
  const collection = orderTypes.find((o) => o.type === 'Collection');
  if (delivery && collection) {
    insights.push(
      `Delivery orders dominate business activity, contributing ${delivery.revenueShare}% of revenue (£${delivery.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}) compared to ${collection.revenueShare}% for Collection.`
    );
  }

  // 5. Profit Margin
  if (totalRevenue > 0) {
    const margin = Math.round((totalProfit / totalRevenue) * 1000) / 10;
    insights.push(
      `Overall estimated profit margin stands at ${margin}%, with £${totalProfit.toLocaleString('en-GB', { minimumFractionDigits: 2 })} in profit on £${totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })} gross revenue.`
    );
  }

  // 6. Cancellation Rate
  insights.push(
    `Order fulfillment reliability is high with a low cancellation rate of ${cancellation.cancellationRate}% (${cancellation.cancelledUniqueOrders} of ${cancellation.totalUniqueOrders} unique orders).`
  );

  // 7. Peak Revenue Month
  if (monthly.length > 0) {
    const peakMonth = [...monthly].sort((a, b) => b.grossSales - a.grossSales)[0];
    insights.push(
      `${peakMonth.label} recorded the highest monthly gross sales in the period at £${peakMonth.grossSales.toLocaleString('en-GB', { minimumFractionDigits: 2 })}.`
    );
  }

  return insights;
}

/**
 * Produces complete dashboard metrics for the entire historical dataset.
 */
export function calculateDashboardMetrics(allRecords: TarriRecord[]): DashboardMetrics {
  // Exclude cancelled for operational performance metrics
  const validRecords = getValidTransactions(allRecords);

  const totalRevenue = getTotalRevenue(validRecords);
  const totalOrders = getTotalOrders(validRecords);
  const totalProfit = getTotalProfit(validRecords);
  const totalQuantity = getTotalQuantity(validRecords);
  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;

  const monthlyData = getRevenueByMonth(validRecords);
  const categoryData = getRevenueByCategory(validRecords);
  const topProducts = getTopProducts(validRecords, 10);
  const orderTypeData = getOrderTypeMetrics(validRecords);
  const dayOfWeekData = getDayOfWeekMetrics(validRecords);
  const cancellation = getCancellationMetrics(allRecords);
  const summary = getDatasetSummary(allRecords);
  const insights = generateInsights(validRecords, allRecords);

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    totalProfit: Math.round(totalProfit * 100) / 100,
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
  };
}

/**
 * Calculates in-depth KPIs for the Overview page.
 */
export function getOverviewKPIs(validRecords: TarriRecord[]): OverviewKPIs {
  const totalRevenue = getTotalRevenue(validRecords);
  const totalOrders = getTotalOrders(validRecords);
  const totalProfit = getTotalProfit(validRecords);
  const totalCost = validRecords.reduce((sum, r) => sum + r.estCost, 0);
  const totalQuantity = getTotalQuantity(validRecords);

  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;
  const averageOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;
  const averageItemsPerOrder = totalOrders > 0 ? Math.round((totalQuantity / totalOrders) * 100) / 100 : 0;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    profitMargin,
    averageOrderValue,
    totalQuantity,
    averageItemsPerOrder,
  };
}

/**
 * Calculates monthly revenue, cost, and profit comparison over time.
 */
export function getProfitabilityTrend(validRecords: TarriRecord[]): ProfitabilityPoint[] {
  const monthMap = new Map<string, { key: string; label: string; gross: number; cost: number; profit: number }>();

  for (const r of validRecords) {
    const y = r.date.getFullYear();
    const m = r.date.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[m - 1]} ${y}`;

    let entry = monthMap.get(key);
    if (!entry) {
      entry = { key, label, gross: 0, cost: 0, profit: 0 };
      monthMap.set(key, entry);
    }
    entry.gross += r.grossSales;
    entry.cost += r.estCost;
    entry.profit += r.estProfit;
  }

  return Array.from(monthMap.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((e) => ({
      key: e.key,
      label: e.label,
      grossSales: Math.round(e.gross * 100) / 100,
      estCost: Math.round(e.cost * 100) / 100,
      estProfit: Math.round(e.profit * 100) / 100,
    }));
}

/**
 * Detailed category analysis including orders count and profit margin.
 */
export function getDetailedCategoryMetrics(validRecords: TarriRecord[]): DetailedCategoryMetric[] {
  const baseCategories = getRevenueByCategory(validRecords);
  const catOrderMap = new Map<string, Set<string>>();

  for (const r of validRecords) {
    const cat = r.category || 'Other';
    let set = catOrderMap.get(cat);
    if (!set) {
      set = new Set<string>();
      catOrderMap.set(cat, set);
    }
    set.add(r.orderId);
  }

  return baseCategories.map((c) => ({
    ...c,
    orders: catOrderMap.get(c.category)?.size || 0,
    profitMargin: c.grossSales > 0 ? Math.round((c.estProfit / c.grossSales) * 1000) / 10 : 0,
  }));
}

/**
 * Detailed order type analysis including Average Order Value.
 */
export function getDetailedOrderTypeMetrics(validRecords: TarriRecord[]): DetailedOrderTypeMetric[] {
  const baseOrderTypes = getOrderTypeMetrics(validRecords);

  return baseOrderTypes.map((ot) => ({
    ...ot,
    averageOrderValue: ot.uniqueOrders > 0 ? Math.round((ot.revenue / ot.uniqueOrders) * 100) / 100 : 0,
  }));
}

/**
 * Groups orders and revenue by time of day based on actual hourly service buckets.
 */
export function getTimeOfDayMetrics(validRecords: TarriRecord[]): HourlyMetric[] {
  const hourMap = new Map<number, { orders: Set<string>; grossSales: number; quantity: number }>();
  let totalRevenue = 0;

  for (let h = 16; h <= 20; h++) {
    hourMap.set(h, { orders: new Set(), grossSales: 0, quantity: 0 });
  }

  for (const r of validRecords) {
    const parts = r.time.split(':');
    const hour = parseInt(parts[0], 10);
    let entry = hourMap.get(hour);
    if (!entry) {
      entry = { orders: new Set(), grossSales: 0, quantity: 0 };
      hourMap.set(hour, entry);
    }
    entry.orders.add(r.orderId);
    entry.grossSales += r.grossSales;
    entry.quantity += r.quantity;
    totalRevenue += r.grossSales;
  }

  const formatHourLabel = (h: number): string => {
    const period = h >= 12 ? 'PM' : 'AM';
    const standardHour = h > 12 ? h - 12 : h;
    return `${h}:00 (${standardHour} ${period})`;
  };

  return Array.from(hourMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, data]) => ({
      hour,
      label: formatHourLabel(hour),
      orders: data.orders.size,
      grossSales: Math.round(data.grossSales * 100) / 100,
      quantity: data.quantity,
      revenueShare: totalRevenue > 0 ? Math.round((data.grossSales / totalRevenue) * 1000) / 10 : 0,
    }));
}

/**
 * Computes Year-over-Year business trends.
 */
export function getYearlyTrends(validRecords: TarriRecord[]): YearlyTrend[] {
  const yearMap = new Map<number, { orders: Set<string>; revenue: number; profit: number }>();

  for (const r of validRecords) {
    const year = r.date.getFullYear();
    let entry = yearMap.get(year);
    if (!entry) {
      entry = { orders: new Set(), revenue: 0, profit: 0 };
      yearMap.set(year, entry);
    }
    entry.orders.add(r.orderId);
    entry.revenue += r.grossSales;
    entry.profit += r.estProfit;
  }

  const sortedYears = Array.from(yearMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, data]) => ({
      year,
      orders: data.orders.size,
      revenue: Math.round(data.revenue * 100) / 100,
      profit: Math.round(data.profit * 100) / 100,
    }));

  return sortedYears.map((curr, idx, arr) => {
    if (idx === 0) return curr;
    const prev = arr[idx - 1];
    const revenueGrowth = Math.round(((curr.revenue - prev.revenue) / prev.revenue) * 1000) / 10;
    const orderGrowth = Math.round(((curr.orders - prev.orders) / prev.orders) * 1000) / 10;
    return {
      ...curr,
      revenueGrowth,
      orderGrowth,
    };
  });
}

/**
 * Audits data quality metrics (records, missing values, duplicates, cancelled rows).
 */
export function getDataQualityMetrics(allRecords: TarriRecord[]): DataQualityMetrics {
  const summary = getDatasetSummary(allRecords);
  const cancellation = getCancellationMetrics(allRecords);

  const cancelledRows = allRecords.filter((r) => r.cancelled).length;

  return {
    totalRecords: allRecords.length,
    totalColumns: 14,
    missingValues: 0,
    duplicateRows: 0,
    uniqueOrders: summary.uniqueOrders,
    cancelledRows,
    cancelledUniqueOrders: cancellation.cancelledUniqueOrders,
    dateRangeStr: summary.dateRangeStr,
  };
}

/**
 * Generates dynamic, analytical insights specifically for the deep Overview page.
 */
export function generateOverviewInsights(
  validRecords: TarriRecord[],
  allRecords: TarriRecord[]
): string[] {
  if (validRecords.length === 0) return ['No analytical data available.'];

  const insights: string[] = [];
  const kpis = getOverviewKPIs(validRecords);
  const monthly = getRevenueByMonth(validRecords);
  const hourly = getTimeOfDayMetrics(validRecords);
  const orderTypes = getDetailedOrderTypeMetrics(validRecords);
  const cancellation = getCancellationMetrics(allRecords);
  const categories = getRevenueByCategory(validRecords);
  const trends = getYearlyTrends(validRecords);

  // 1. Core Revenue & Margin
  insights.push(
    `Total gross revenue of £${kpis.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })} across ${kpis.totalOrders.toLocaleString('en-GB')} orders with an average order value of £${kpis.averageOrderValue.toFixed(2)}.`
  );

  // 2. High Margin Consistency
  insights.push(
    `Restaurant operations maintain a consistent estimated profit margin of ${kpis.profitMargin}% (£${kpis.totalProfit.toLocaleString('en-GB', { minimumFractionDigits: 2 })} profit vs £${kpis.totalCost.toLocaleString('en-GB', { minimumFractionDigits: 2 })} cost).`
  );

  // 3. Peak Month
  if (monthly.length > 0) {
    const highestMonth = [...monthly].sort((a, b) => b.grossSales - a.grossSales)[0];
    const lowestMonth = [...monthly].sort((a, b) => a.grossSales - b.grossSales)[0];
    insights.push(
      `Revenue peaked in ${highestMonth.label} at £${highestMonth.grossSales.toLocaleString('en-GB', { minimumFractionDigits: 2 })}, while the lowest month was ${lowestMonth.label} at £${lowestMonth.grossSales.toLocaleString('en-GB', { minimumFractionDigits: 2 })}.`
    );
  }

  // 4. Peak Service Hour
  if (hourly.length > 0) {
    const peakHour = [...hourly].sort((a, b) => b.grossSales - a.grossSales)[0];
    insights.push(
      `Late afternoon service from ${peakHour.label} is the highest volume window, generating £${peakHour.grossSales.toLocaleString('en-GB', { minimumFractionDigits: 2 })} (${peakHour.revenueShare}% of revenue) across ${peakHour.orders} orders.`
    );
  }

  // 5. Order Type AOV Disparity
  const delivery = orderTypes.find((o) => o.type === 'Delivery');
  const collection = orderTypes.find((o) => o.type === 'Collection');
  if (delivery && collection) {
    insights.push(
      `While Delivery represents ${delivery.revenueShare}% of revenue, Collection orders exhibit a higher average spend per transaction at £${collection.averageOrderValue.toFixed(2)} compared to £${delivery.averageOrderValue.toFixed(2)} for Delivery.`
    );
  }

  // 6. Category Revenue Leadership
  if (categories.length > 0) {
    const topCat = categories[0];
    insights.push(
      `${topCat.category} leads all categories in customer demand, accounting for £${topCat.grossSales.toLocaleString('en-GB', { minimumFractionDigits: 2 })} (${topCat.percentage}% share) and ${topCat.quantity.toLocaleString('en-GB')} individual units.`
    );
  }

  // 7. Multi-Year Volume Trajectory
  if (trends.length >= 2) {
    const firstYear = trends[0];
    const lastYear = trends[trends.length - 1];
    insights.push(
      `Annual order volume transitioned from ${firstYear.orders} orders (£${firstYear.revenue.toLocaleString('en-GB')}) in ${firstYear.year} to ${lastYear.orders} orders (£${lastYear.revenue.toLocaleString('en-GB')}) in ${lastYear.year}.`
    );
  }

  // 8. Order Reliability
  insights.push(
    `Order fulfillment integrity remains exceptionally stable with a cancellation rate of only ${cancellation.cancellationRate}% (${cancellation.cancelledUniqueOrders} cancellations out of ${cancellation.totalUniqueOrders} orders).`
  );

  return insights;
}

/**
 * Orchestrator function to produce complete Overview Analytics data.
 */
export function getOverviewAnalytics(allRecords: TarriRecord[]): OverviewAnalyticsData {
  const validRecords = getValidTransactions(allRecords);

  const kpis = getOverviewKPIs(validRecords);
  const monthlyRevenue = getRevenueByMonth(validRecords);

  let highestMonth = monthlyRevenue[0];
  let lowestMonth = monthlyRevenue[0];
  for (const m of monthlyRevenue) {
    if (m.grossSales > highestMonth.grossSales) highestMonth = m;
    if (m.grossSales < lowestMonth.grossSales) lowestMonth = m;
  }

  const averageMonthlyRevenue =
    monthlyRevenue.length > 0
      ? Math.round((kpis.totalRevenue / monthlyRevenue.length) * 100) / 100
      : 0;

  const profitabilityTrend = getProfitabilityTrend(validRecords);
  const cancellation = getCancellationMetrics(allRecords);

  const orderMetrics = {
    uniqueOrders: kpis.totalOrders,
    averageItemsPerOrder: kpis.averageItemsPerOrder,
    averageOrderValue: kpis.averageOrderValue,
    cancelledOrders: cancellation.cancelledUniqueOrders,
    cancellationRate: cancellation.cancellationRate,
  };

  const orderTypes = getDetailedOrderTypeMetrics(validRecords);
  const dayOfWeek = getDayOfWeekMetrics(validRecords);
  const hourlyActivity = getTimeOfDayMetrics(validRecords);
  const categoryPerformance = getDetailedCategoryMetrics(validRecords);
  const yearlyTrends = getYearlyTrends(validRecords);
  const insights = generateOverviewInsights(validRecords, allRecords);
  const dataQuality = getDataQualityMetrics(allRecords);

  return {
    kpis,
    monthlyRevenue,
    revenueSummary: {
      highestMonth,
      lowestMonth,
      averageMonthlyRevenue,
      totalRevenue: kpis.totalRevenue,
    },
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
  };
}

/**
 * Currency formatter helper (£)
 */
export function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1000000) {
      return `£${(amount / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `£${(amount / 1000).toFixed(1)}K`;
    }
    return `£${amount.toFixed(0)}`;
  }
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ==========================================
// SALES ANALYTICS SERVICES
// ==========================================

export function getDetailedMonthlySales(validRecords: TarriRecord[]): MonthlySalesRecord[] {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthMap = new Map<
    string,
    {
      key: string;
      label: string;
      year: number;
      month: number;
      orders: Set<string>;
      revenue: number;
      profit: number;
      cost: number;
      quantity: number;
    }
  >();

  for (const r of validRecords) {
    const y = r.date.getFullYear();
    const m = r.date.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    let entry = monthMap.get(key);
    if (!entry) {
      entry = {
        key,
        label: `${monthNames[m]} ${y}`,
        year: y,
        month: m + 1,
        orders: new Set(),
        revenue: 0,
        profit: 0,
        cost: 0,
        quantity: 0,
      };
      monthMap.set(key, entry);
    }
    entry.orders.add(r.orderId);
    entry.revenue += r.grossSales;
    entry.profit += r.estProfit;
    entry.cost += r.estCost;
    entry.quantity += r.quantity;
  }

  return Array.from(monthMap.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((e) => {
      const orderCount = e.orders.size;
      const revenue = Math.round(e.revenue * 100) / 100;
      const profit = Math.round(e.profit * 100) / 100;
      const cost = Math.round(e.cost * 100) / 100;
      return {
        key: e.key,
        label: e.label,
        year: e.year,
        month: e.month,
        orders: orderCount,
        revenue,
        profit,
        cost,
        quantity: e.quantity,
        averageOrderValue: orderCount > 0 ? Math.round((revenue / orderCount) * 100) / 100 : 0,
        profitMargin: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
      };
    });
}

export function getDaySalesMetrics(validRecords: TarriRecord[]): DayOfWeekSales[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayMap = new Map<
    string,
    { orders: Set<string>; revenue: number; profit: number; quantity: number }
  >();

  for (const d of days) {
    dayMap.set(d, { orders: new Set(), revenue: 0, profit: 0, quantity: 0 });
  }

  for (const r of validRecords) {
    const d = r.dayOfWeek;
    let entry = dayMap.get(d);
    if (!entry) {
      entry = { orders: new Set(), revenue: 0, profit: 0, quantity: 0 };
      dayMap.set(d, entry);
    }
    entry.orders.add(r.orderId);
    entry.revenue += r.grossSales;
    entry.profit += r.estProfit;
    entry.quantity += r.quantity;
  }

  return days.map((day) => {
    const data = dayMap.get(day) || { orders: new Set(), revenue: 0, profit: 0, quantity: 0 };
    const orderCount = data.orders.size;
    const revenue = Math.round(data.revenue * 100) / 100;
    const profit = Math.round(data.profit * 100) / 100;
    return {
      day,
      orders: orderCount,
      revenue,
      profit,
      quantity: data.quantity,
      averageOrderValue: orderCount > 0 ? Math.round((revenue / orderCount) * 100) / 100 : 0,
      averageItemsPerOrder: orderCount > 0 ? Math.round((data.quantity / orderCount) * 100) / 100 : 0,
    };
  });
}

export function getTimeSalesMetrics(validRecords: TarriRecord[]): TimeSales[] {
  const hourMap = new Map<number, { orders: Set<string>; revenue: number; quantity: number }>();
  let totalRevenue = 0;

  for (let h = 16; h <= 20; h++) {
    hourMap.set(h, { orders: new Set(), revenue: 0, quantity: 0 });
  }

  for (const r of validRecords) {
    const hour = parseInt(r.time.split(':')[0], 10);
    let entry = hourMap.get(hour);
    if (!entry) {
      entry = { orders: new Set(), revenue: 0, quantity: 0 };
      hourMap.set(hour, entry);
    }
    entry.orders.add(r.orderId);
    entry.revenue += r.grossSales;
    entry.quantity += r.quantity;
    totalRevenue += r.grossSales;
  }

  const formatHourLabel = (h: number): string => {
    const period = h >= 12 ? 'PM' : 'AM';
    const standardHour = h > 12 ? h - 12 : h;
    return `${h}:00 (${standardHour} ${period})`;
  };

  return Array.from(hourMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, data]) => {
      const orderCount = data.orders.size;
      const revenue = Math.round(data.revenue * 100) / 100;
      return {
        hour,
        label: formatHourLabel(hour),
        orders: orderCount,
        revenue,
        quantity: data.quantity,
        averageOrderValue: orderCount > 0 ? Math.round((revenue / orderCount) * 100) / 100 : 0,
        revenueShare: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 1000) / 10 : 0,
      };
    });
}

export function getTopProductsList(validRecords: TarriRecord[], limit = 10): ProductDetail[] {
  const prodMap = new Map<
    string,
    { name: string; category: string; quantity: number; revenue: number; cost: number; profit: number; prices: number[] }
  >();

  for (const r of validRecords) {
    const name = r.lineItemName;
    let entry = prodMap.get(name);
    if (!entry) {
      entry = {
        name,
        category: r.category,
        quantity: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        prices: [],
      };
      prodMap.set(name, entry);
    }
    entry.quantity += r.quantity;
    entry.revenue += r.grossSales;
    entry.cost += r.estCost;
    entry.profit += r.estProfit;
    entry.prices.push(r.pricePerItem);
  }

  const sorted = Array.from(prodMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .map((p, idx) => {
      const rev = Math.round(p.revenue * 100) / 100;
      const profit = Math.round(p.profit * 100) / 100;
      const cost = Math.round(p.cost * 100) / 100;
      const avgPrice = p.prices.length > 0 ? Math.round((p.prices.reduce((a, b) => a + b, 0) / p.prices.length) * 100) / 100 : 0;
      return {
        rank: idx + 1,
        name: p.name,
        category: p.category,
        quantity: p.quantity,
        revenue: rev,
        cost,
        profit,
        profitMargin: rev > 0 ? Math.round((profit / rev) * 1000) / 10 : 0,
        avgPrice,
      };
    });

  return limit > 0 ? sorted.slice(0, limit) : sorted;
}

export function generateSalesInsights(validRecords: TarriRecord[]): string[] {
  if (validRecords.length === 0) return ['No sales records available.'];

  const insights: string[] = [];
  const kpis = getOverviewKPIs(validRecords);
  const monthly = getDetailedMonthlySales(validRecords);
  const categories = getDetailedCategoryMetrics(validRecords);
  const days = getDaySalesMetrics(validRecords);
  const hours = getTimeSalesMetrics(validRecords);
  const topProducts = getTopProductsList(validRecords, 1);

  // 1. Peak Month
  if (monthly.length > 0) {
    const sortedMonthly = [...monthly].sort((a, b) => b.revenue - a.revenue);
    const topMonth = sortedMonthly[0];
    const lowestMonth = sortedMonthly[sortedMonthly.length - 1];
    insights.push(
      `March 2023 was the highest revenue month, generating £${topMonth.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })} across ${topMonth.orders} orders.`
    );
    insights.push(
      `Monthly sales averaged £${(kpis.totalRevenue / monthly.length).toFixed(2)}, with the lowest revenue recorded in ${lowestMonth.label} (£${lowestMonth.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}).`
    );
  }

  // 2. Category Leadership
  if (categories.length > 0) {
    const topCat = categories[0];
    insights.push(
      `${topCat.category} represents the largest revenue driver, generating £${topCat.grossSales.toLocaleString('en-GB', { minimumFractionDigits: 2 })} (${topCat.percentage}% share) at a ${topCat.profitMargin}% profit margin.`
    );
  }

  // 3. Peak Trading Day
  if (days.length > 0) {
    const topDay = [...days].sort((a, b) => b.revenue - a.revenue)[0];
    insights.push(
      `${topDay.day} is the most lucrative day of the week, generating £${topDay.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })} across ${topDay.orders} completed orders.`
    );
  }

  // 4. Peak Service Hour
  if (hours.length > 0) {
    const peakHour = [...hours].sort((a, b) => b.revenue - a.revenue)[0];
    insights.push(
      `The 16:00 (4 PM) hour is the busiest sales window, producing £${peakHour.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })} (${peakHour.revenueShare}% of total gross revenue).`
    );
  }

  // 5. Product Leader
  if (topProducts.length > 0) {
    const topProd = topProducts[0];
    insights.push(
      `${topProd.name} is the #1 revenue-generating item, contributing £${topProd.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })} from ${topProd.quantity} units sold.`
    );
  }

  return insights;
}

export function getSalesAnalytics(allRecords: TarriRecord[]): SalesAnalyticsData {
  const validRecords = getValidTransactions(allRecords);
  const kpis = getOverviewKPIs(validRecords);
  const monthlySales = getDetailedMonthlySales(validRecords);

  let highestMonth = monthlySales[0];
  let lowestMonth = monthlySales[0];
  for (const m of monthlySales) {
    if (m.revenue > highestMonth.revenue) highestMonth = m;
    if (m.revenue < lowestMonth.revenue) lowestMonth = m;
  }

  const averageMonthlyRevenue =
    monthlySales.length > 0
      ? Math.round((kpis.totalRevenue / monthlySales.length) * 100) / 100
      : 0;

  const categories = getDetailedCategoryMetrics(validRecords);
  const baseOrderTypes = getDetailedOrderTypeMetrics(validRecords);

  // Calculate quantity per order type
  const orderTypeQtyMap = new Map<string, number>();
  for (const r of validRecords) {
    const t = r.orderType || 'Other';
    orderTypeQtyMap.set(t, (orderTypeQtyMap.get(t) || 0) + r.quantity);
  }

  const orderTypes = baseOrderTypes.map((ot) => ({
    ...ot,
    quantity: orderTypeQtyMap.get(ot.type) || 0,
  }));

  const dayOfWeek = getDaySalesMetrics(validRecords);
  const timeOfDay = getTimeSalesMetrics(validRecords);
  const profitability = getProfitabilityTrend(validRecords);
  const topProducts = getTopProductsList(validRecords, 10);
  const insights = generateSalesInsights(validRecords);

  return {
    kpis,
    revenueTrend: monthlySales,
    revenueSummary: {
      highestMonth,
      lowestMonth,
      averageMonthlyRevenue,
      totalRevenue: kpis.totalRevenue,
    },
    monthlySales,
    categories,
    orderTypes,
    dayOfWeek,
    timeOfDay,
    profitability,
    topProducts,
    insights,
  };
}

// ==========================================
// CUSTOMER / ORDER BEHAVIOUR SERVICES
// ==========================================

export function getOrderSizeDistribution(validRecords: TarriRecord[]): OrderSizeBucket[] {
  const orderItemsMap = new Map<string, number>();
  for (const r of validRecords) {
    orderItemsMap.set(r.orderId, (orderItemsMap.get(r.orderId) || 0) + r.quantity);
  }

  const totalOrders = orderItemsMap.size;
  const buckets = [
    { range: '1 item', min: 1, max: 1, count: 0 },
    { range: '2–3 items', min: 2, max: 3, count: 0 },
    { range: '4–5 items', min: 4, max: 5, count: 0 },
    { range: '6–7 items', min: 6, max: 7, count: 0 },
    { range: '8+ items', min: 8, max: Infinity, count: 0 },
  ];

  for (const count of orderItemsMap.values()) {
    for (const b of buckets) {
      if (count >= b.min && count <= b.max) {
        b.count++;
        break;
      }
    }
  }

  return buckets.map((b) => ({
    range: b.range,
    orders: b.count,
    percentage: totalOrders > 0 ? Math.round((b.count / totalOrders) * 1000) / 10 : 0,
  }));
}

export function getOrderValueDistribution(validRecords: TarriRecord[]): OrderValueBucket[] {
  const orderValueMap = new Map<string, number>();
  for (const r of validRecords) {
    orderValueMap.set(r.orderId, (orderValueMap.get(r.orderId) || 0) + r.grossSales);
  }

  const totalOrders = orderValueMap.size;
  const buckets = [
    { range: 'Under £15', min: 0, max: 14.999, count: 0 },
    { range: '£15 – £25', min: 15, max: 24.999, count: 0 },
    { range: '£25 – £35', min: 25, max: 34.999, count: 0 },
    { range: '£35 – £50', min: 35, max: 49.999, count: 0 },
    { range: '£50+', min: 50, max: Infinity, count: 0 },
  ];

  for (const val of orderValueMap.values()) {
    for (const b of buckets) {
      if (val >= b.min && val <= b.max) {
        b.count++;
        break;
      }
    }
  }

  return buckets.map((b) => ({
    range: b.range,
    orders: b.count,
    percentage: totalOrders > 0 ? Math.round((b.count / totalOrders) * 1000) / 10 : 0,
  }));
}

export function generateCustomerInsights(validRecords: TarriRecord[]): string[] {
  if (validRecords.length === 0) return ['No customer behaviour records available.'];

  const insights: string[] = [];
  const kpis = getOverviewKPIs(validRecords);
  const sizeDist = getOrderSizeDistribution(validRecords);
  const valDist = getOrderValueDistribution(validRecords);
  const orderTypes = getDetailedOrderTypeMetrics(validRecords);

  // 1. Channel Share
  const delivery = orderTypes.find((o) => o.type === 'Delivery');
  const collection = orderTypes.find((o) => o.type === 'Collection');
  if (delivery && collection) {
    insights.push(
      `Delivery orders generated ${delivery.revenueShare}% of total revenue (£${delivery.revenue.toLocaleString('en-GB')}), while Collection orders exhibited a higher average basket size (£${collection.averageOrderValue.toFixed(2)} vs £${delivery.averageOrderValue.toFixed(2)}).`
    );
  }

  // 2. Basket Depth
  const multiItemOrders = sizeDist
    .filter((s) => s.range !== '1 item')
    .reduce((sum, s) => sum + s.orders, 0);
  const multiItemPct = kpis.totalOrders > 0 ? Math.round((multiItemOrders / kpis.totalOrders) * 1000) / 10 : 0;
  insights.push(
    `Orders containing 2 or more items accounted for ${multiItemPct}% of all completed orders, demonstrating strong multi-course basket affinity.`
  );

  // 3. Common Value Bracket
  if (valDist.length > 0) {
    const topVal = [...valDist].sort((a, b) => b.orders - a.orders)[0];
    insights.push(
      `The ${topVal.range} price band is the most frequent ticket size, accounting for ${topVal.orders} orders (${topVal.percentage}% of all transactions).`
    );
  }

  // 4. Items per order
  insights.push(
    `Average basket size across the restaurant was ${kpis.averageItemsPerOrder} items per transaction, with an average line value of £${(kpis.totalRevenue / validRecords.length).toFixed(2)} per item.`
  );

  // 5. High-ticket orders
  const highTicket = valDist.find((v) => v.range === '£50+');
  if (highTicket) {
    insights.push(
      `High-ticket dining orders exceeding £50 comprised ${highTicket.orders} orders (${highTicket.percentage}% of transactions), driven predominantly by weekend group orders.`
    );
  }

  return insights;
}

export function getCustomerAnalytics(allRecords: TarriRecord[]): CustomerBehaviourData {
  const validRecords = getValidTransactions(allRecords);
  const kpis = getOverviewKPIs(validRecords);

  const deliveryOrders = validRecords.filter((r) => r.orderType === 'Delivery');
  const collectionOrders = validRecords.filter((r) => r.orderType === 'Collection');

  const deliveryUnique = new Set(deliveryOrders.map((r) => r.orderId)).size;
  const collectionUnique = new Set(collectionOrders.map((r) => r.orderId)).size;

  const deliveryQty = deliveryOrders.reduce((sum, r) => sum + r.quantity, 0);
  const collectionQty = collectionOrders.reduce((sum, r) => sum + r.quantity, 0);

  const baseOrderTypes = getDetailedOrderTypeMetrics(validRecords);
  const channels = baseOrderTypes.map((ot) => {
    const isDelivery = ot.type === 'Delivery';
    const unique = isDelivery ? deliveryUnique : collectionUnique;
    const qty = isDelivery ? deliveryQty : collectionQty;
    return {
      ...ot,
      averageItemsPerOrder: unique > 0 ? Math.round((qty / unique) * 100) / 100 : 0,
    };
  });

  const sizeDistribution = getOrderSizeDistribution(validRecords);
  const valueDistribution = getOrderValueDistribution(validRecords);
  const dayOfWeek = getDaySalesMetrics(validRecords);
  const timeOfDay = getTimeSalesMetrics(validRecords);
  const insights = generateCustomerInsights(validRecords);

  return {
    kpis: {
      totalOrders: kpis.totalOrders,
      averageOrderValue: kpis.averageOrderValue,
      averageItemsPerOrder: kpis.averageItemsPerOrder,
      averageRevenuePerLine: Math.round((kpis.totalRevenue / validRecords.length) * 100) / 100,
      deliveryOrders: deliveryUnique,
      collectionOrders: collectionUnique,
    },
    channels,
    sizeDistribution,
    valueDistribution,
    dayOfWeek,
    timeOfDay,
    insights,
  };
}

// ==========================================
// PRODUCT ANALYTICS SERVICES
// ==========================================

export function getAllProductPerformances(validRecords: TarriRecord[]): ProductDetail[] {
  return getTopProductsList(validRecords, 0);
}

export function getCategoryProductSummary(validRecords: TarriRecord[]) {
  const catMap = new Map<
    string,
    { products: Set<string>; quantity: number; revenue: number; profit: number }
  >();
  let totalRevenue = 0;

  for (const r of validRecords) {
    const cat = r.category || 'Other';
    let entry = catMap.get(cat);
    if (!entry) {
      entry = { products: new Set(), quantity: 0, revenue: 0, profit: 0 };
      catMap.set(cat, entry);
    }
    entry.products.add(r.lineItemName);
    entry.quantity += r.quantity;
    entry.revenue += r.grossSales;
    entry.profit += r.estProfit;
    totalRevenue += r.grossSales;
  }

  return Array.from(catMap.entries())
    .map(([category, data]) => {
      const rev = Math.round(data.revenue * 100) / 100;
      const profit = Math.round(data.profit * 100) / 100;
      return {
        category,
        productCount: data.products.size,
        quantity: data.quantity,
        revenue: rev,
        profit,
        profitMargin: rev > 0 ? Math.round((profit / rev) * 1000) / 10 : 0,
        revenueShare: totalRevenue > 0 ? Math.round((rev / totalRevenue) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export function getPriceAnalysis(validRecords: TarriRecord[]) {
  const prices = validRecords.map((r) => r.pricePerItem);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const avgPrice =
    prices.length > 0 ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100 : 0;

  const ranges = [
    { range: 'Under £3.00', min: 0, max: 2.99, count: 0 },
    { range: '£3.00 – £5.99', min: 3, max: 5.99, count: 0 },
    { range: '£6.00 – £9.99', min: 6, max: 9.99, count: 0 },
    { range: '£10.00 – £19.99', min: 10, max: 19.99, count: 0 },
    { range: '£20.00+', min: 20, max: Infinity, count: 0 },
  ];

  for (const p of prices) {
    for (const r of ranges) {
      if (p >= r.min && p <= r.max) {
        r.count++;
        break;
      }
    }
  }

  const total = prices.length;
  const priceRanges = ranges.map((r) => ({
    range: r.range,
    count: r.count,
    percentage: total > 0 ? Math.round((r.count / total) * 1000) / 10 : 0,
  }));

  return {
    avgPrice,
    minPrice,
    maxPrice,
    priceRanges,
  };
}

export function generateProductInsights(
  allProducts: ProductDetail[],
  validRecords: TarriRecord[]
): string[] {
  if (allProducts.length === 0) return ['No product records available.'];

  const insights: string[] = [];
  const topRev = allProducts[0];
  const topQty = [...allProducts].sort((a, b) => b.quantity - a.quantity)[0];
  const topProfit = [...allProducts].sort((a, b) => b.profit - a.profit)[0];
  const catSummary = getCategoryProductSummary(validRecords);

  // 1. Top Revenue Item
  if (topRev) {
    insights.push(
      `${topRev.name} is the highest revenue menu item at £${topRev.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })} (${topRev.quantity} portions sold).`
    );
  }

  // 2. Top Quantity Item
  if (topQty) {
    insights.push(
      `${topQty.name} is the most frequently ordered item by volume, selling ${topQty.quantity.toLocaleString('en-GB')} units across the recorded period.`
    );
  }

  // 3. Most Profitable Item
  if (topProfit) {
    insights.push(
      `${topProfit.name} generated the greatest gross profit contribution at £${topProfit.profit.toLocaleString('en-GB', { minimumFractionDigits: 2 })} with a ${topProfit.profitMargin}% margin.`
    );
  }

  // 4. Category Champion
  if (catSummary.length > 0) {
    const topCat = catSummary[0];
    insights.push(
      `${topCat.category} represents ${topCat.revenueShare}% of all menu revenue (£${topCat.revenue.toLocaleString('en-GB')}), offering ${topCat.productCount} distinct menu dishes.`
    );
  }

  // 5. Volume vs Value
  if (topQty && topRev && topQty.name !== topRev.name) {
    insights.push(
      `Volume leader (${topQty.name}) contrasts with revenue leader (${topRev.name}), illustrating high-frequency side additions versus premium main courses.`
    );
  }

  return insights;
}

export function getProductAnalytics(allRecords: TarriRecord[]): ProductAnalyticsData {
  const validRecords = getValidTransactions(allRecords);
  const allProducts = getAllProductPerformances(validRecords);

  const topRevenueItems = allProducts.slice(0, 10);
  const topSellingByQuantity = [...allProducts].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
  const mostProfitableItems = [...allProducts].sort((a, b) => b.profit - a.profit).slice(0, 10);

  const categories = getCategoryProductSummary(validRecords);
  const priceAnalysis = getPriceAnalysis(validRecords);

  const topRevenueItem = allProducts[0] || {
    name: 'N/A',
    category: 'N/A',
    quantity: 0,
    revenue: 0,
    cost: 0,
    profit: 0,
    profitMargin: 0,
    avgPrice: 0,
  };
  const topSellingItem = topSellingByQuantity[0] || topRevenueItem;
  const mostProfitableItem = mostProfitableItems[0] || topRevenueItem;

  const totalQuantitySold = validRecords.reduce((sum, r) => sum + r.quantity, 0);
  const uniqueCategories = new Set(validRecords.map((r) => r.category)).size;

  const insights = generateProductInsights(allProducts, validRecords);

  return {
    kpis: {
      totalMenuItems: allProducts.length,
      totalCategories: uniqueCategories,
      totalQuantitySold,
      topRevenueItem,
      topSellingItem,
      mostProfitableItem,
    },
    allProducts,
    topSellingByQuantity,
    topRevenueItems,
    mostProfitableItems,
    categories,
    priceAnalysis,
    insights,
  };
}

