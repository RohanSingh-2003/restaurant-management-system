export type TableStatus = 'Available' | 'Occupied' | 'Reserved' | 'Needs Reset';

export interface RestaurantTable {
  id: string; // e.g. 'T1'
  number: number; // e.g. 1
  capacity: number; // e.g. 4
  status: TableStatus;
  currentOrderId?: string;
}

export interface OperationalProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

export interface OperationalOrderItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export type OrderStatus =
  | 'Draft'
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Served'
  | 'Completed'
  | 'Cancelled';

export type ServiceRequestType =
  | 'Request Waiter'
  | 'Request Water'
  | 'Request Bill'
  | 'Extra Napkins'
  | 'Extra Cutlery'
  | 'Other';

export type ServiceRequestStatus = 'Pending' | 'Acknowledged' | 'Completed';

export interface CustomerServiceRequest {
  id: string;
  tableId: string;
  tableNumber: number;
  type: ServiceRequestType;
  details?: string;
  status: ServiceRequestStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  acknowledgedAt?: string;
  completedAt?: string;
  customerId?: string;
  customerName?: string;
}

export interface CreateServiceRequestInput {
  tableId: string;
  tableNumber: number;
  type: ServiceRequestType;
  details?: string;
  customerId?: string;
  customerName?: string;
}

export type PaymentMethod = 'Cash' | 'Card' | 'UPI';
export type PaymentStatus = 'Pending' | 'Paid';

export interface OperationalPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  paidAt?: string;
}

export type OrderSource = 'CUSTOMER' | 'WAITER';

export interface OperationalOrder {
  id: string; // unique internal id e.g. 'ORD-1001'
  orderNumber: string; // 'ORD-1001'
  tableId: string;
  tableNumber: number;
  source: OrderSource;
  waiterId?: string;
  waiterName?: string;
  customerId?: string;
  customerName?: string;
  status: OrderStatus;
  items: OperationalOrderItem[];
  subtotal: number;
  totalAmount: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  payment?: OperationalPayment;
  specialInstructions?: string;
}

export interface CreateOrderInput {
  tableId: string;
  tableNumber: number;
  source?: OrderSource;
  waiterId?: string;
  waiterName?: string;
  customerId?: string;
  customerName?: string;
  items: {
    productId: string;
    productName: string;
    category: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }[];
  specialInstructions?: string;
}

