export type Role = 'manager' | 'waiter' | 'cook' | 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  status?: 'Active' | 'Inactive';
  phone?: string;
  joinedAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface KpiData {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  subtext?: string;
}

export interface RevenueDataPoint {
  period: string;
  revenue: number;
  orders: number;
}

export interface CategoryPerformance {
  name: string;
  orders: number;
  revenue: number;
  percentage: number;
}

export interface AnalysisRecord {
  id: string;
  name: string;
  type: string;
  dataset: string;
  date: string;
  status: 'completed' | 'running' | 'failed' | 'pending';
}

export interface Insight {
  id: string;
  text: string;
  category: 'revenue' | 'customer' | 'product' | 'operations';
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  children?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}
