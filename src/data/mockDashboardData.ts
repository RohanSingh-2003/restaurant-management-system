import type { KpiData, RevenueDataPoint, CategoryPerformance, AnalysisRecord, Insight } from '../types';

export const kpiData: KpiData[] = [
  {
    label: 'Total Revenue',
    value: '₹1,24,500',
    change: '+8.4%',
    changeType: 'positive',
    icon: 'indian-rupee',
  },
  {
    label: 'Total Orders',
    value: '1,842',
    change: '+12.1%',
    changeType: 'positive',
    icon: 'shopping-bag',
  },
  {
    label: 'Customers',
    value: '968',
    change: '+5.3%',
    changeType: 'positive',
    icon: 'users',
  },
  {
    label: 'Avg. Order Value',
    value: '₹676',
    change: '-2.1%',
    changeType: 'negative',
    icon: 'receipt',
  },
];

export const revenueData: RevenueDataPoint[] = [
  { period: 'Week 1', revenue: 28400, orders: 412 },
  { period: 'Week 2', revenue: 31200, orders: 445 },
  { period: 'Week 3', revenue: 27800, orders: 398 },
  { period: 'Week 4', revenue: 34600, orders: 476 },
  { period: 'Week 5', revenue: 29100, orders: 421 },
  { period: 'Week 6', revenue: 32800, orders: 458 },
  { period: 'Week 7', revenue: 35200, orders: 489 },
  { period: 'Week 8', revenue: 30900, orders: 438 },
  { period: 'Week 9', revenue: 33500, orders: 462 },
  { period: 'Week 10', revenue: 36100, orders: 501 },
  { period: 'Week 11', revenue: 31700, orders: 447 },
  { period: 'Week 12', revenue: 38200, orders: 522 },
];

export const categoryData: CategoryPerformance[] = [
  { name: 'Main Course', orders: 684, revenue: 52460, percentage: 42 },
  { name: 'Beverages', orders: 512, revenue: 28340, percentage: 23 },
  { name: 'Desserts', orders: 346, revenue: 24180, percentage: 19 },
  { name: 'Starters', orders: 300, revenue: 19520, percentage: 16 },
];

export const recentAnalyses: AnalysisRecord[] = [
  {
    id: 'a1',
    name: 'Multiple Linear Regression',
    type: 'Regression',
    dataset: 'Revenue Prediction',
    date: '2026-09-14',
    status: 'completed',
  },
  {
    id: 'a2',
    name: 'Customer Clustering',
    type: 'Clustering',
    dataset: 'Customer Segmentation',
    date: '2026-09-13',
    status: 'completed',
  },
  {
    id: 'a4',
    name: 'Sales Forecasting',
    type: 'Regression',
    dataset: 'Monthly Sales Data',
    date: '2026-09-11',
    status: 'completed',
  },
];

export const insights: Insight[] = [
  {
    id: 'i1',
    text: 'Weekend revenue is 34% higher than weekday revenue on average.',
    category: 'revenue',
  },
  {
    id: 'i2',
    text: 'Main Course contributes the largest share (42%) of total restaurant revenue.',
    category: 'product',
  },
  {
    id: 'i3',
    text: 'Returning customers have a 28% higher average order value than new customers.',
    category: 'customer',
  },
];
