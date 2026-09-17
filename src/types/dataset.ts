export interface TarriRecord {
  orderId: string;
  date: Date;
  dateStr: string;
  dayOfWeek: string;
  time: string;
  category: string;
  lineItemName: string;
  quantity: number;
  pricePerItem: number;
  grossSales: number;
  estCost: number;
  estProfit: number;
  orderType: string;
  payment: string;
  cancelled: boolean;
}



export interface MonthlyMetric {
  key: string;       // e.g. "2023-01"
  label: string;     // e.g. "Jan 2023"
  year: number;
  month: number;
  grossSales: number;
  estProfit: number;
  orders: number;
}

export interface CategoryMetric {
  category: string;
  grossSales: number;
  estProfit: number;
  quantity: number;
  percentage: number;
}

export interface ProductMetric {
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface OrderTypeMetric {
  type: string;
  uniqueOrders: number;
  revenue: number;
  profit: number;
  orderShare: number;
  revenueShare: number;
}

export interface DayOfWeekMetric {
  day: string;
  grossSales: number;
  estProfit: number;
  uniqueOrders: number;
}

export interface CancellationMetric {
  totalUniqueOrders: number;
  cancelledUniqueOrders: number;
  validUniqueOrders: number;
  cancellationRate: number;
  cancelledRevenue: number;
}

export interface DatasetSummary {
  filename: string;
  totalRecords: number;
  totalColumns: number;
  uniqueOrders: number;
  dateRangeStr: string;
  minDate: Date | null;
  maxDate: Date | null;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalProfit: number;
  totalQuantity: number;
  profitMargin: number;
  monthlyData: MonthlyMetric[];
  categoryData: CategoryMetric[];
  topProducts: ProductMetric[];
  orderTypeData: OrderTypeMetric[];
  dayOfWeekData: DayOfWeekMetric[];
  cancellation: CancellationMetric;
  summary: DatasetSummary;
  insights: string[];
}

export interface OverviewKPIs {
  totalRevenue: number;
  totalOrders: number;
  totalProfit: number;
  totalCost: number;
  profitMargin: number;
  averageOrderValue: number;
  totalQuantity: number;
  averageItemsPerOrder: number;
}

export interface HourlyMetric {
  hour: number;
  label: string;
  orders: number;
  grossSales: number;
  quantity: number;
  revenueShare: number;
}

export interface DetailedCategoryMetric extends CategoryMetric {
  orders: number;
  profitMargin: number;
}

export interface DetailedOrderTypeMetric extends OrderTypeMetric {
  averageOrderValue: number;
}

export interface YearlyTrend {
  year: number;
  orders: number;
  revenue: number;
  profit: number;
  revenueGrowth?: number;
  orderGrowth?: number;
}

export interface ProfitabilityPoint {
  key: string;
  label: string;
  grossSales: number;
  estCost: number;
  estProfit: number;
}

export interface DataQualityMetrics {
  totalRecords: number;
  totalColumns: number;
  missingValues: number;
  duplicateRows: number;
  uniqueOrders: number;
  cancelledRows: number;
  cancelledUniqueOrders: number;
  dateRangeStr: string;
}

export interface OverviewAnalyticsData {
  kpis: OverviewKPIs;
  monthlyRevenue: MonthlyMetric[];
  revenueSummary: {
    highestMonth: MonthlyMetric;
    lowestMonth: MonthlyMetric;
    averageMonthlyRevenue: number;
    totalRevenue: number;
  };
  profitabilityTrend: ProfitabilityPoint[];
  orderMetrics: {
    uniqueOrders: number;
    averageItemsPerOrder: number;
    averageOrderValue: number;
    cancelledOrders: number;
    cancellationRate: number;
  };
  orderTypes: DetailedOrderTypeMetric[];
  dayOfWeek: DayOfWeekMetric[];
  hourlyActivity: HourlyMetric[];
  categoryPerformance: DetailedCategoryMetric[];
  cancellation: CancellationMetric;
  yearlyTrends: YearlyTrend[];
  insights: string[];
  dataQuality: DataQualityMetrics;
}

export interface MonthlySalesRecord {
  key: string;
  label: string;
  year: number;
  month: number;
  orders: number;
  revenue: number;
  profit: number;
  cost: number;
  quantity: number;
  averageOrderValue: number;
  profitMargin: number;
}

export interface DayOfWeekSales {
  day: string;
  orders: number;
  revenue: number;
  profit: number;
  quantity: number;
  averageOrderValue: number;
  averageItemsPerOrder: number;
}

export interface TimeSales {
  hour: number;
  label: string;
  orders: number;
  revenue: number;
  quantity: number;
  averageOrderValue: number;
  revenueShare: number;
}

export interface ProductDetail {
  rank?: number;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  avgPrice: number;
}

export interface OrderSizeBucket {
  range: string;
  orders: number;
  percentage: number;
}

export interface OrderValueBucket {
  range: string;
  orders: number;
  percentage: number;
}

export interface SalesAnalyticsData {
  kpis: OverviewKPIs;
  revenueTrend: MonthlySalesRecord[];
  revenueSummary: {
    highestMonth: MonthlySalesRecord;
    lowestMonth: MonthlySalesRecord;
    averageMonthlyRevenue: number;
    totalRevenue: number;
  };
  monthlySales: MonthlySalesRecord[];
  categories: DetailedCategoryMetric[];
  orderTypes: (DetailedOrderTypeMetric & { quantity: number })[];
  dayOfWeek: DayOfWeekSales[];
  timeOfDay: TimeSales[];
  profitability: ProfitabilityPoint[];
  topProducts: ProductDetail[];
  insights: string[];
}

export interface CustomerBehaviourData {
  kpis: {
    totalOrders: number;
    averageOrderValue: number;
    averageItemsPerOrder: number;
    averageRevenuePerLine: number;
    deliveryOrders: number;
    collectionOrders: number;
  };
  channels: (DetailedOrderTypeMetric & { averageItemsPerOrder: number })[];
  sizeDistribution: OrderSizeBucket[];
  valueDistribution: OrderValueBucket[];
  dayOfWeek: DayOfWeekSales[];
  timeOfDay: TimeSales[];
  insights: string[];
}

export interface ProductAnalyticsData {
  kpis: {
    totalMenuItems: number;
    totalCategories: number;
    totalQuantitySold: number;
    topRevenueItem: ProductDetail;
    topSellingItem: ProductDetail;
    mostProfitableItem: ProductDetail;
  };
  allProducts: ProductDetail[];
  topSellingByQuantity: ProductDetail[];
  topRevenueItems: ProductDetail[];
  mostProfitableItems: ProductDetail[];
  categories: {
    category: string;
    productCount: number;
    quantity: number;
    revenue: number;
    profit: number;
    profitMargin: number;
    revenueShare: number;
  }[];
  priceAnalysis: {
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    priceRanges: { range: string; count: number; percentage: number }[];
  };
  insights: string[];
}

// ==========================================
// DATA WAREHOUSE: DATASET INSPECTION TYPES
// ==========================================

export interface ColumnSchema {
  name: string;
  dataType: string;
  description: string;
  missingCount: number;
  uniqueCount: number;
  sampleValues: string[];
}

export interface DataQualityReport {
  totalRows: number;
  missingValues: number;
  duplicateRows: number;
  invalidNumericValues: number;
  invalidDates: number;
  cancelledRecords: number;
  completenessScore: number;
  accuracyScore: number;
}

// ==========================================
// DATA WAREHOUSE: ETL PIPELINE TYPES
// ==========================================

export interface ETLStageLog {
  timestamp: string;
  stage: 'Extract' | 'Transform' | 'Load';
  operation: string;
  recordCount: number;
  status: 'Completed' | 'In Progress' | 'Warning';
  details?: string;
}

export interface LogicalStarSchema {
  factTable: {
    name: string;
    description: string;
    measures: string[];
    recordCount: number;
  };
  dimensionTables: {
    name: string;
    key: string;
    attributes: string[];
    cardinality: number;
  }[];
}

export interface ETLExecutionResult {
  executionTime: string;
  durationMs: number;
  status: 'Success' | 'Failed';
  extractedRows: number;
  transformedRows: number;
  loadedRows: number;
  rowsModified: number;
  rowsRemoved: number;
  logs: ETLStageLog[];
  schema: LogicalStarSchema;
  qualityBefore: DataQualityReport;
  qualityAfter: DataQualityReport;
}

// ==========================================
// DATA WAREHOUSE: OLAP EXPLORER TYPES
// ==========================================

export type OLAPDimensionKey =
  | 'Category'
  | 'Product'
  | 'OrderType'
  | 'Payment'
  | 'DayOfWeek'
  | 'Year'
  | 'Month'
  | 'Date';

export type OLAPMeasureKey =
  | 'Gross Sales'
  | 'Est. Profit'
  | 'Est. Cost'
  | 'Quantity'
  | 'Orders';

export type OLAPAggregation = 'SUM' | 'AVG';

export interface OLAPFilter {
  dimension: OLAPDimensionKey;
  operator: 'equals' | 'in';
  value: string | string[];
}

export interface OLAPCubeQuery {
  dimension: OLAPDimensionKey;
  measure: OLAPMeasureKey;
  aggregation: OLAPAggregation;
  filters: OLAPFilter[];
  drillDownLevel?: OLAPDimensionKey;
  sortBy?: 'value' | 'label';
  sortDirection?: 'asc' | 'desc';
}

export interface OLAPResultRow {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
  percentage: number;
  orderCount: number;
  itemCount: number;
}

export interface OLAPQueryResult {
  query: OLAPCubeQuery;
  operationType: 'Slice' | 'Dice' | 'Drill-down' | 'Roll-up' | 'Standard Cube';
  totalFilteredRecords: number;
  totalUniqueOrders: number;
  aggregateTotal: number;
  rows: OLAPResultRow[];
  summary: string;
}

// ==========================================
// REPORTING TYPES
// ==========================================

export type ReportType =
  | 'executive-summary'
  | 'sales-performance'
  | 'product-performance'
  | 'data-mining';

export interface GeneratedReport {
  id: string;
  title: string;
  type: ReportType;
  generatedAt: string;
  dateRange: string;
  dataset: string;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalProfit: number;
    profitMargin: number;
    quantitySold: number;
    averageOrderValue: number;
  };
  keyFindings: string[];
  tables: {
    title: string;
    headers: string[];
    rows: (string | number)[][];
  }[];
  notes?: string;
}

export interface ReportHistoryItem {
  id: string;
  title: string;
  type: ReportType;
  generatedAt: string;
  recordCount: number;
  status: 'Ready';
}

// ==========================================
// SETTINGS TYPES
// ==========================================

export interface ManagerSettings {
  currencySymbol: '£' | '$' | '€';
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  numberFormat: 'standard' | 'compact';
  showQualityWarnings: boolean;
  compactCharts: boolean;
  defaultTimeframe: string;
  lastRefreshed?: string;
}

