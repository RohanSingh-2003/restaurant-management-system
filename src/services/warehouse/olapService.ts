import type { TarriRecord } from '../../types/dataset';
import type {
  OLAPCubeQuery,
  OLAPQueryResult,
  OLAPResultRow,
  OLAPDimensionKey,
} from '../../types/dataset';
import { getValidTransactions } from '../tarriDataService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Extracts the dimension value key from a single transaction record.
 */
export function getRecordDimensionValue(r: TarriRecord, dim: OLAPDimensionKey): string {
  switch (dim) {
    case 'Category':
      return r.category || 'Unknown';
    case 'Product':
      return r.lineItemName || 'Unknown';
    case 'OrderType':
      return r.orderType || 'Unknown';
    case 'Payment':
      return r.payment || 'Unknown';
    case 'DayOfWeek':
      return r.dayOfWeek || 'Unknown';
    case 'Year':
      return r.date.getFullYear().toString();
    case 'Month': {
      const yr = r.date.getFullYear();
      const mth = MONTH_NAMES[r.date.getMonth()];
      return `${mth} ${yr}`;
    }
    case 'Date':
      return r.dateStr;
    default:
      return 'Other';
  }
}

/**
 * Executes an OLAP Cube Query supporting Slice, Dice, Drill-down, and Roll-up operations.
 */
export function executeOLAPQuery(
  records: TarriRecord[],
  query: OLAPCubeQuery
): OLAPQueryResult {
  // Always work with valid operational transactions (cancelled transactions excluded from standard OLAP revenue)
  let filtered = getValidTransactions(records);

  // Apply Slicing & Dicing filters
  const activeFilters = query.filters || [];
  for (const f of activeFilters) {
    if (!f.value || (Array.isArray(f.value) && f.value.length === 0)) continue;

    filtered = filtered.filter((r) => {
      const dimVal = getRecordDimensionValue(r, f.dimension);
      if (Array.isArray(f.value)) {
        return f.value.includes(dimVal);
      }
      return dimVal.toLowerCase() === f.value.toLowerCase();
    });
  }

  // Determine active aggregation dimension (drill-down level takes precedence if set)
  const activeDim: OLAPDimensionKey = query.drillDownLevel || query.dimension;

  // Group records by dimension
  const groupMap = new Map<
    string,
    {
      label: string;
      sumGrossSales: number;
      sumProfit: number;
      sumCost: number;
      sumQuantity: number;
      orderIds: Set<string>;
      itemCount: number;
    }
  >();

  for (const r of filtered) {
    const key = getRecordDimensionValue(r, activeDim);
    let g = groupMap.get(key);
    if (!g) {
      g = {
        label: key,
        sumGrossSales: 0,
        sumProfit: 0,
        sumCost: 0,
        sumQuantity: 0,
        orderIds: new Set<string>(),
        itemCount: 0,
      };
      groupMap.set(key, g);
    }

    g.sumGrossSales += r.grossSales;
    g.sumProfit += r.estProfit;
    g.sumCost += r.estCost;
    g.sumQuantity += r.quantity;
    g.orderIds.add(r.orderId);
    g.itemCount++;
  }

  // Overall unique orders in filtered dataset
  const globalUniqueOrders = new Set(filtered.map((r) => r.orderId)).size;

  // Calculate measure aggregates per cell
  const rows: OLAPResultRow[] = [];
  let aggregateTotal = 0;

  for (const [key, g] of groupMap.entries()) {
    let rawVal = 0;
    const orderCount = g.orderIds.size;

    switch (query.measure) {
      case 'Gross Sales':
        rawVal = query.aggregation === 'AVG' && orderCount > 0 ? g.sumGrossSales / orderCount : g.sumGrossSales;
        break;
      case 'Est. Profit':
        rawVal = query.aggregation === 'AVG' && orderCount > 0 ? g.sumProfit / orderCount : g.sumProfit;
        break;
      case 'Est. Cost':
        rawVal = query.aggregation === 'AVG' && orderCount > 0 ? g.sumCost / orderCount : g.sumCost;
        break;
      case 'Quantity':
        rawVal = query.aggregation === 'AVG' && orderCount > 0 ? g.sumQuantity / orderCount : g.sumQuantity;
        break;
      case 'Orders':
        rawVal = orderCount;
        break;
    }

    aggregateTotal += rawVal;
    rows.push({
      key,
      label: g.label,
      value: Math.round(rawVal * 100) / 100,
      formattedValue:
        query.measure === 'Orders'
          ? rawVal.toLocaleString('en-GB')
          : query.measure === 'Quantity'
          ? `${rawVal.toLocaleString('en-GB')} units`
          : `£${rawVal.toFixed(2)}`,
      percentage: 0,
      orderCount,
      itemCount: g.itemCount,
    });
  }

  // Calculate percentages
  for (const row of rows) {
    row.percentage = aggregateTotal > 0 ? Math.round((row.value / aggregateTotal) * 1000) / 10 : 0;
  }

  // Sorting
  const dir = query.sortDirection === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    if (query.sortBy === 'label') {
      return a.label.localeCompare(b.label) * dir;
    }
    return (a.value - b.value) * dir;
  });

  // Determine OLAP operation classification
  let operationType: 'Slice' | 'Dice' | 'Drill-down' | 'Roll-up' | 'Standard Cube' = 'Standard Cube';
  if (query.drillDownLevel) {
    if (
      (query.dimension === 'Year' && query.drillDownLevel === 'Month') ||
      (query.dimension === 'Month' && query.drillDownLevel === 'Date') ||
      (query.dimension === 'Category' && query.drillDownLevel === 'Product')
    ) {
      operationType = 'Drill-down';
    } else {
      operationType = 'Roll-up';
    }
  } else if (activeFilters.length === 1) {
    operationType = 'Slice';
  } else if (activeFilters.length > 1) {
    operationType = 'Dice';
  }

  const filterSummary =
    activeFilters.length > 0
      ? activeFilters.map((f) => `${f.dimension} = ${Array.isArray(f.value) ? f.value.join(', ') : f.value}`).join(' AND ')
      : 'None (Unfiltered)';

  const summary = `${operationType} query on Dimension '${activeDim}' measuring '${query.aggregation}(${query.measure})'. Filter: [${filterSummary}]. Processed ${filtered.length.toLocaleString('en-GB')} line items across ${globalUniqueOrders.toLocaleString('en-GB')} orders, producing ${rows.length} aggregated cube cells.`;

  return {
    query,
    operationType,
    totalFilteredRecords: filtered.length,
    totalUniqueOrders: globalUniqueOrders,
    aggregateTotal: Math.round(aggregateTotal * 100) / 100,
    rows,
    summary,
  };
}
