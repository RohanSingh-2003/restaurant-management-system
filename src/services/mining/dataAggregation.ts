import type { TarriRecord } from '../../types/dataset';
import type { OrderAggregatedRecord, DatasetMeta } from '../../types/mining';

/**
 * Aggregates line items into order-level records for clustering and order-level analytics.
 * Note: OrderID is stored for identification, but is NEVER to be used as a numerical ML feature.
 */
export function getOrderAggregatedDataset(records: TarriRecord[], excludeCancelled = false): OrderAggregatedRecord[] {
  const filtered = excludeCancelled ? records.filter((r) => !r.cancelled) : records;
  const orderMap = new Map<string, {
    orderId: string;
    totalQuantity: number;
    totalGrossSales: number;
    totalEstCost: number;
    totalEstProfit: number;
    prices: number[];
    lineItemCount: number;
    orderType: string;
    payment: string;
    dayOfWeek: string;
    cancelled: boolean;
  }>();

  for (const r of filtered) {
    let entry = orderMap.get(r.orderId);
    if (!entry) {
      entry = {
        orderId: r.orderId,
        totalQuantity: 0,
        totalGrossSales: 0,
        totalEstCost: 0,
        totalEstProfit: 0,
        prices: [],
        lineItemCount: 0,
        orderType: r.orderType || 'Delivery',
        payment: r.payment || 'Card',
        dayOfWeek: r.dayOfWeek,
        cancelled: r.cancelled,
      };
      orderMap.set(r.orderId, entry);
    }

    entry.totalQuantity += r.quantity;
    entry.totalGrossSales += r.grossSales;
    entry.totalEstCost += r.estCost;
    entry.totalEstProfit += r.estProfit;
    entry.prices.push(r.pricePerItem);
    entry.lineItemCount += 1;
    if (r.cancelled) entry.cancelled = true;
  }

  return Array.from(orderMap.values()).map((e) => {
    const avgPrice = e.prices.length > 0 ? e.prices.reduce((a, b) => a + b, 0) / e.prices.length : 0;
    return {
      orderId: e.orderId,
      totalQuantity: e.totalQuantity,
      totalGrossSales: Math.round(e.totalGrossSales * 100) / 100,
      totalEstCost: Math.round(e.totalEstCost * 100) / 100,
      totalEstProfit: Math.round(e.totalEstProfit * 100) / 100,
      avgPricePerItem: Math.round(avgPrice * 100) / 100,
      lineItemCount: e.lineItemCount,
      orderType: e.orderType,
      payment: e.payment,
      dayOfWeek: e.dayOfWeek,
      cancelled: e.cancelled,
    };
  });
}

/**
 * Returns dataset metadata dynamically computed from real records.
 */
export function getDatasetMeta(records: TarriRecord[]): DatasetMeta {
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  let cancelledRows = 0;

  for (const r of records) {
    if (r.cancelled) cancelledRows++;
    if (!minDate || r.date < minDate) minDate = r.date;
    if (!maxDate || r.date > maxDate) maxDate = r.date;
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  let dateRange = 'February 2023 – December 2025';
  if (minDate && maxDate) {
    dateRange = `${monthNames[minDate.getMonth()]} ${minDate.getFullYear()} – ${monthNames[maxDate.getMonth()]} ${maxDate.getFullYear()}`;
  }

  return {
    filename: 'tarri_data.csv',
    totalRows: records.length,
    totalColumns: 14,
    dateRange,
    cancelledRows,
  };
}
