import type {
  RestaurantTable,
  OperationalProduct,
  OperationalOrder,
  OperationalOrderItem,
  CreateOrderInput,
  OrderStatus,
  PaymentMethod,
  CustomerServiceRequest,
  CreateServiceRequestInput,
} from '../../types/operational';
import { appendOrderToDataset, updateOrderInDataset } from '../tarriDataService';

const TABLES_STORAGE_KEY = 'rms_operational_tables';
const ORDERS_STORAGE_KEY = 'rms_operational_orders';
const PRODUCTS_STORAGE_KEY = 'rms_operational_products';
const EVENT_NAME = 'rms_operational_update';

// Real menu items extracted directly from tarri_data.csv
export const OPERATIONAL_PRODUCTS: OperationalProduct[] = [
  // APETISERS
  { id: 'p_01', name: 'Chicken Suya', category: 'APETISERS', price: 3.5, available: true },
  { id: 'p_02', name: 'Beef Suya', category: 'APETISERS', price: 4.0, available: true },
  { id: 'p_03', name: 'Meat Pie', category: 'APETISERS', price: 2.5, available: true },
  { id: 'p_04', name: 'Fish Pie', category: 'APETISERS', price: 2.8, available: true },
  { id: 'p_05', name: 'Puff Puff (5 pcs)', category: 'APETISERS', price: 2.5, available: true },
  { id: 'p_06', name: 'Moi Moi - Beans Pudding', category: 'APETISERS', price: 3.0, available: true },
  { id: 'p_07', name: 'Peppered Gizzard', category: 'APETISERS', price: 4.5, available: true },
  { id: 'p_08', name: 'Peppered Snail', category: 'APETISERS', price: 7.0, available: false }, // Marked unavailable for UI testing

  // MAIN COURSES
  { id: 'p_10', name: 'Jolof', category: 'MAIN COURSES', price: 8.5, available: true },
  { id: 'p_11', name: 'Jolof with Chicken', category: 'MAIN COURSES', price: 10.5, available: true },
  { id: 'p_12', name: 'Jolof with Beef', category: 'MAIN COURSES', price: 11.0, available: true },
  { id: 'p_13', name: 'Fried Rice', category: 'MAIN COURSES', price: 7.5, available: true },
  { id: 'p_14', name: 'Fried Rice with Chicken', category: 'MAIN COURSES', price: 10.0, available: true },
  { id: 'p_15', name: 'Boiled Rice with Designer Stew - Ayamase', category: 'MAIN COURSES', price: 12.0, available: true },
  { id: 'p_16', name: 'Ofada Rice with Sauce', category: 'MAIN COURSES', price: 11.5, available: true },
  { id: 'p_17', name: 'Efo Riro with Assorted Meat', category: 'MAIN COURSES', price: 12.5, available: true },
  { id: 'p_18', name: 'Egusi Soup with Pounded Yam', category: 'MAIN COURSES', price: 12.0, available: true },
  { id: 'p_19', name: 'Fish with Chips', category: 'MAIN COURSES', price: 9.5, available: true },

  // SOUPS
  { id: 'p_30', name: 'Goat Meat Pepper Soup', category: 'SOUPS', price: 8.5, available: true },
  { id: 'p_31', name: 'Catfish Pepper Soup', category: 'SOUPS', price: 9.5, available: true },
  { id: 'p_32', name: 'Assorted Meat Pepper Soup', category: 'SOUPS', price: 8.0, available: true },
  { id: 'p_33', name: 'Ogbono Soup with Fish', category: 'SOUPS', price: 11.0, available: true },

  // EXTRAS
  { id: 'p_40', name: 'Fried Plantain (Dodo)', category: 'EXTRAS', price: 3.0, available: true },
  { id: 'p_41', name: 'Pounded Yam portion', category: 'EXTRAS', price: 2.5, available: true },
  { id: 'p_42', name: 'Coleslaw', category: 'EXTRAS', price: 2.0, available: true },
  { id: 'p_43', name: 'Fried Yam Chips', category: 'EXTRAS', price: 3.5, available: true },

  // DRINKS
  { id: 'p_50', name: 'Chapman Cocktail', category: 'DRINKS', price: 3.5, available: true },
  { id: 'p_51', name: 'Coca-Cola (330ml)', category: 'DRINKS', price: 2.0, available: true },
  { id: 'p_52', name: 'Fanta Orange (330ml)', category: 'DRINKS', price: 2.0, available: true },
  { id: 'p_53', name: 'Sprite (330ml)', category: 'DRINKS', price: 2.0, available: true },
  { id: 'p_54', name: 'Malta Guinness', category: 'DRINKS', price: 2.8, available: true },
  { id: 'p_55', name: 'Still Mineral Water (500ml)', category: 'DRINKS', price: 1.5, available: true },
  { id: 'p_56', name: 'Fresh Hibiscus Drink (Zobo)', category: 'DRINKS', price: 3.0, available: true },
  { id: 'p_57', name: 'Palm Wine (Fresh)', category: 'DRINKS', price: 4.5, available: false }, // Marked unavailable for UI testing
];

// Initial 12 tables
function createInitialTables(): RestaurantTable[] {
  return Array.from({ length: 12 }, (_, i) => {
    const num = i + 1;
    const capacity = num <= 4 ? 2 : num <= 8 ? 4 : 6;
    return {
      id: `T${num}`,
      number: num,
      capacity,
      status: num === 5 || num === 6 ? 'Occupied' : 'Available',
      currentOrderId: num === 5 ? 'RES_ORD_6322.0' : num === 6 ? 'RES_ORD_6323.0' : undefined,
    };
  });
}

// Initial seed orders
function createInitialOrders(): OperationalOrder[] {
  const now = new Date();
  const t10MinsAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const t25MinsAgo = new Date(now.getTime() - 25 * 60 * 1000).toISOString();
  const t1HourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'RES_ORD_6322.0',
      orderNumber: 'RES_ORD_6322.0',
      tableId: 'T5',
      tableNumber: 5,
      source: 'WAITER',
      waiterId: 'usr_002',
      waiterName: 'Alex Morgan',
      status: 'Preparing',
      items: [
        {
          id: 'item_101',
          productId: 'p_10',
          productName: 'Jolof',
          category: 'MAIN COURSES',
          quantity: 2,
          unitPrice: 8.5,
          notes: 'Medium spice level',
        },
        {
          id: 'item_102',
          productId: 'p_01',
          productName: 'Chicken Suya',
          category: 'APETISERS',
          quantity: 1,
          unitPrice: 3.5,
          notes: 'Extra pepper sauce on the side',
        },
      ],
      subtotal: 20.5,
      totalAmount: 20.5,
      createdAt: t10MinsAgo,
      updatedAt: t10MinsAgo,
      specialInstructions: 'Customer requested fast service if possible.',
    },
    {
      id: 'RES_ORD_6323.0',
      orderNumber: 'RES_ORD_6323.0',
      tableId: 'T6',
      tableNumber: 6,
      source: 'WAITER',
      waiterId: 'usr_002',
      waiterName: 'Alex Morgan',
      status: 'Ready',
      items: [
        {
          id: 'item_103',
          productId: 'p_13',
          productName: 'Fried Rice',
          category: 'MAIN COURSES',
          quantity: 2,
          unitPrice: 7.5,
        },
        {
          id: 'item_104',
          productId: 'p_50',
          productName: 'Chapman Cocktail',
          category: 'DRINKS',
          quantity: 2,
          unitPrice: 3.5,
          notes: 'Extra ice and cucumber slice',
        },
      ],
      subtotal: 22.0,
      totalAmount: 22.0,
      createdAt: t25MinsAgo,
      updatedAt: t25MinsAgo,
      specialInstructions: 'VIP Table guests.',
    },
    {
      id: 'RES_ORD_6320.0',
      orderNumber: 'RES_ORD_6320.0',
      tableId: 'T2',
      tableNumber: 2,
      source: 'WAITER',
      waiterId: 'usr_002',
      waiterName: 'Alex Morgan',
      status: 'Completed',
      items: [
        {
          id: 'item_105',
          productId: 'p_15',
          productName: 'Boiled Rice with Designer Stew - Ayamase',
          category: 'MAIN COURSES',
          quantity: 1,
          unitPrice: 12.0,
        },
        {
          id: 'item_106',
          productId: 'p_51',
          productName: 'Coca-Cola (330ml)',
          category: 'DRINKS',
          quantity: 1,
          unitPrice: 2.0,
        },
      ],
      subtotal: 14.0,
      totalAmount: 14.0,
      createdAt: t1HourAgo,
      updatedAt: t1HourAgo,
      payment: {
        method: 'Card',
        status: 'Paid',
        amount: 14.0,
        paidAt: t1HourAgo,
      },
    },
  ];
}

// -------------------------------------------------------------
// STORE ENGINE
// -------------------------------------------------------------

function notifyListeners() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export function getStoredTables(): RestaurantTable[] {
  if (typeof window === 'undefined') return createInitialTables();
  try {
    const raw = localStorage.getItem(TABLES_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialTables();
      localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as RestaurantTable[];
  } catch {
    return createInitialTables();
  }
}

export function saveTables(tables: RestaurantTable[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(tables));
    notifyListeners();
  }
}

export function addTable(data: { number: number; capacity: number }): RestaurantTable {
  const tables = getStoredTables();
  if (tables.some((t) => t.number === data.number)) {
    throw new Error(`Table ${data.number} already exists.`);
  }
  const newTable: RestaurantTable = {
    id: `T${data.number}`,
    number: data.number,
    capacity: data.capacity,
    status: 'Available',
  };
  tables.push(newTable);
  tables.sort((a, b) => a.number - b.number);
  saveTables(tables);
  return newTable;
}

export function updateTable(id: string, updates: Partial<RestaurantTable>): RestaurantTable {
  const tables = getStoredTables();
  const idx = tables.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error(`Table ${id} not found.`);
  const updated = { ...tables[idx], ...updates };
  tables[idx] = updated;
  saveTables(tables);
  return updated;
}

export function toggleTableStatus(id: string): RestaurantTable {
  const tables = getStoredTables();
  const idx = tables.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error(`Table ${id} not found.`);
  const cur = tables[idx];
  const nextStatus = cur.status === 'Available' ? 'Occupied' : 'Available';
  const updated: RestaurantTable = { ...cur, status: nextStatus };
  tables[idx] = updated;
  saveTables(tables);
  return updated;
}

export function getStoredProducts(): OperationalProduct[] {
  if (typeof window === 'undefined') return OPERATIONAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(OPERATIONAL_PRODUCTS));
      return OPERATIONAL_PRODUCTS;
    }
    return JSON.parse(raw) as OperationalProduct[];
  } catch {
    return OPERATIONAL_PRODUCTS;
  }
}

export function saveProducts(products: OperationalProduct[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    notifyListeners();
  }
}

export function addProduct(data: Omit<OperationalProduct, 'id'>): OperationalProduct {
  const products = getStoredProducts();
  const nextId = `p_${Date.now().toString(36)}`;
  const newProduct: OperationalProduct = {
    ...data,
    id: nextId,
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<OperationalProduct>): OperationalProduct {
  const products = getStoredProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Product ${id} not found.`);
  const updated = { ...products[idx], ...updates };
  products[idx] = updated;
  saveProducts(products);
  return updated;
}

export function toggleProductAvailability(id: string): OperationalProduct {
  const products = getStoredProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Product ${id} not found.`);
  const updated = { ...products[idx], available: !products[idx].available };
  products[idx] = updated;
  saveProducts(products);
  return updated;
}

export function getStoredOrders(): OperationalOrder[] {
  if (typeof window === 'undefined') return createInitialOrders();
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialOrders();
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as OperationalOrder[];
  } catch {
    return createInitialOrders();
  }
}

export function saveOrders(orders: OperationalOrder[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    notifyListeners();
  }
}

// -------------------------------------------------------------
// ORDER OPERATIONS
// -------------------------------------------------------------

export function createOrder(input: CreateOrderInput): OperationalOrder {
  if (!input.items || input.items.length === 0) {
    throw new Error('Please add at least one item.');
  }

  const orders = getStoredOrders();
  const tables = getStoredTables();

  // Find next order number matching dataset sequence (RES_ORD_<number>.0)
  const BASE_MAX_ORDER_ID = 6325;
  const numericIds = orders
    .map((o) => {
      const match = o.orderNumber.match(/RES_ORD_(\d+)/i) || o.orderNumber.match(/\d+/);
      return match ? parseInt(match[1] || match[0], 10) : BASE_MAX_ORDER_ID;
    })
    .filter((n) => !isNaN(n));
  const maxId = numericIds.length > 0 ? Math.max(...numericIds, BASE_MAX_ORDER_ID) : BASE_MAX_ORDER_ID;
  const nextNum = maxId + 1;
  const orderNumber = `RES_ORD_${nextNum}.0`;

  const subtotal = input.items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const nowStr = new Date().toISOString();

  const source = input.source || (input.customerId ? 'CUSTOMER' : 'WAITER');

  const newOrder: OperationalOrder = {
    id: orderNumber,
    orderNumber,
    tableId: input.tableId,
    tableNumber: input.tableNumber,
    source,
    waiterId: input.waiterId,
    waiterName: input.waiterName,
    customerId: input.customerId,
    customerName: input.customerName,
    status: 'Pending', // Sent to kitchen
    items: input.items.map((it, idx) => ({
      id: `it_${nextNum}_${idx + 1}`,
      productId: it.productId,
      productName: it.productName,
      category: it.category,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      notes: it.notes?.trim() || undefined,
    })),
    subtotal: Math.round(subtotal * 100) / 100,
    totalAmount: Math.round(subtotal * 100) / 100,
    createdAt: nowStr,
    updatedAt: nowStr,
    specialInstructions: input.specialInstructions?.trim() || undefined,
  };

  // Save new order
  orders.unshift(newOrder);
  saveOrders(orders);

  // Sync with warehouse dataset (tarri_data.csv & analytics)
  try {
    void appendOrderToDataset(newOrder);
  } catch (err) {
    console.warn('Failed to append order to dataset:', err);
  }

  // Update table to Occupied
  const updatedTables = tables.map((t) =>
    t.id === input.tableId ? { ...t, status: 'Occupied' as const, currentOrderId: orderNumber } : t
  );
  saveTables(updatedTables);

  return newOrder;
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus): OperationalOrder {
  const orders = getStoredOrders();
  const orderIdx = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);

  if (orderIdx === -1) {
    throw new Error(`Order ${orderId} not found.`);
  }

  const current = orders[orderIdx];

  // Validate state transitions
  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    Draft: ['Pending', 'Cancelled'],
    Pending: ['Confirmed', 'Preparing', 'Cancelled'],
    Confirmed: ['Preparing', 'Cancelled'],
    Preparing: ['Ready', 'Cancelled'],
    Ready: ['Served', 'Completed'],
    Served: ['Completed'],
    Completed: [],
    Cancelled: [],
  };

  if (!allowedTransitions[current.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${current.status} to ${newStatus}.`);
  }

  const updated: OperationalOrder = {
    ...current,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  orders[orderIdx] = updated;
  saveOrders(orders);

  // If order was cancelled, sync cancellation flag to dataset
  if (newStatus === 'Cancelled') {
    try {
      void updateOrderInDataset(orderId, { cancelled: true });
    } catch (err) {
      console.warn('Failed to update dataset order status:', err);
    }
  }

  return updated;
}

export function payAndCompleteOrder(
  orderId: string,
  method: PaymentMethod
): { order: OperationalOrder; table?: RestaurantTable } {
  const orders = getStoredOrders();
  const tables = getStoredTables();

  const orderIdx = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
  if (orderIdx === -1) {
    throw new Error(`Order ${orderId} not found.`);
  }

  const cur = orders[orderIdx];
  const nowStr = new Date().toISOString();

  const updatedOrder: OperationalOrder = {
    ...cur,
    status: 'Completed',
    updatedAt: nowStr,
    payment: {
      method,
      status: 'Paid',
      amount: cur.totalAmount,
      paidAt: nowStr,
    },
  };

  orders[orderIdx] = updatedOrder;
  saveOrders(orders);

  // Sync payment method to dataset
  try {
    void updateOrderInDataset(orderId, { payment: method === 'Cash' ? 'Cash' : 'Card' });
  } catch (err) {
    console.warn('Failed to update dataset order payment:', err);
  }

  // Table turnover step: mark table as 'Needs Reset' (not automatically Available)
  let updatedTable: RestaurantTable | undefined;
  const newTables = tables.map((t) => {
    if (t.id === cur.tableId || t.currentOrderId === cur.id) {
      updatedTable = {
        ...t,
        status: 'Needs Reset' as const,
        currentOrderId: undefined,
      };
      return updatedTable;
    }
    return t;
  });

  saveTables(newTables);

  return { order: updatedOrder, table: updatedTable };
}

export function markTableAvailable(tableId: string): RestaurantTable {
  const tables = getStoredTables();
  const idx = tables.findIndex((t) => t.id === tableId || `T${t.number}` === tableId);
  if (idx === -1) throw new Error(`Table ${tableId} not found.`);

  const updated: RestaurantTable = {
    ...tables[idx],
    status: 'Available',
    currentOrderId: undefined,
  };
  tables[idx] = updated;
  saveTables(tables);
  return updated;
}

export function modifyOrder(
  orderId: string,
  updates: {
    items?: OperationalOrderItem[];
    specialInstructions?: string;
  }
): OperationalOrder {
  const orders = getStoredOrders();
  const orderIdx = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
  if (orderIdx === -1) throw new Error(`Order ${orderId} not found.`);

  const current = orders[orderIdx];
  if (current.status !== 'Pending' && current.status !== 'Confirmed') {
    throw new Error(`Cannot modify order ${orderId} because it is already ${current.status}.`);
  }

  let updatedItems = current.items;
  let subtotal = current.subtotal;
  let totalAmount = current.totalAmount;

  if (updates.items) {
    if (updates.items.length === 0) {
      throw new Error('An order must have at least one item.');
    }
    updatedItems = updates.items;
    subtotal = updatedItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    subtotal = Math.round(subtotal * 100) / 100;
    totalAmount = subtotal;
  }

  const updated: OperationalOrder = {
    ...current,
    items: updatedItems,
    subtotal,
    totalAmount,
    specialInstructions:
      updates.specialInstructions !== undefined
        ? updates.specialInstructions.trim() || undefined
        : current.specialInstructions,
    updatedAt: new Date().toISOString(),
  };

  orders[orderIdx] = updated;
  saveOrders(orders);

  // Sync modified items and totals to dataset
  try {
    void appendOrderToDataset(updated);
  } catch (err) {
    console.warn('Failed to update modified order in dataset:', err);
  }

  return updated;
}

// -------------------------------------------------------------
// CUSTOMER SERVICE REQUESTS
// -------------------------------------------------------------

const REQUESTS_STORAGE_KEY = 'rms_customer_requests';

function createInitialRequests(): CustomerServiceRequest[] {
  const now = new Date();
  const t2MinsAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
  const t7MinsAgo = new Date(now.getTime() - 7 * 60 * 1000).toISOString();

  return [
    {
      id: 'REQ-101',
      tableId: 'T5',
      tableNumber: 5,
      type: 'Request Bill',
      details: 'Guest requested bill split if possible',
      status: 'Pending',
      createdAt: t2MinsAgo,
      updatedAt: t2MinsAgo,
      customerId: 'usr_004',
      customerName: 'Customer',
    },
    {
      id: 'REQ-102',
      tableId: 'T6',
      tableNumber: 6,
      type: 'Request Water',
      details: 'Still mineral water for table',
      status: 'Acknowledged',
      createdAt: t7MinsAgo,
      updatedAt: t2MinsAgo,
      acknowledgedAt: t2MinsAgo,
      customerId: 'usr_004',
      customerName: 'Customer',
    },
  ];
}

export function getStoredRequests(): CustomerServiceRequest[] {
  if (typeof window === 'undefined') return createInitialRequests();
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialRequests();
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as CustomerServiceRequest[];
  } catch {
    return createInitialRequests();
  }
}

export function saveRequests(requests: CustomerServiceRequest[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    notifyListeners();
  }
}

export function createServiceRequest(input: CreateServiceRequestInput): CustomerServiceRequest {
  const requests = getStoredRequests();
  const nextNum = requests.length + 101;
  const id = `REQ-${nextNum}`;
  const nowStr = new Date().toISOString();

  const newRequest: CustomerServiceRequest = {
    id,
    tableId: input.tableId,
    tableNumber: input.tableNumber,
    type: input.type,
    details: input.details?.trim() || undefined,
    status: 'Pending',
    createdAt: nowStr,
    updatedAt: nowStr,
    customerId: input.customerId,
    customerName: input.customerName,
  };

  requests.unshift(newRequest);
  saveRequests(requests);
  return newRequest;
}

export function acknowledgeServiceRequest(id: string): CustomerServiceRequest {
  const requests = getStoredRequests();
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`Request ${id} not found.`);

  const nowStr = new Date().toISOString();
  const updated: CustomerServiceRequest = {
    ...requests[idx],
    status: 'Acknowledged',
    acknowledgedAt: nowStr,
    updatedAt: nowStr,
  };

  requests[idx] = updated;
  saveRequests(requests);
  return updated;
}

export function completeServiceRequest(id: string): CustomerServiceRequest {
  const requests = getStoredRequests();
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`Request ${id} not found.`);

  const nowStr = new Date().toISOString();
  const updated: CustomerServiceRequest = {
    ...requests[idx],
    status: 'Completed',
    completedAt: nowStr,
    updatedAt: nowStr,
  };

  requests[idx] = updated;
  saveRequests(requests);
  return updated;
}

// -------------------------------------------------------------
// EVENT SUBSCRIPTION HOOK HELPER
// -------------------------------------------------------------

export function subscribeOperationalUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => callback();
  window.addEventListener(EVENT_NAME, handleUpdate);
  window.addEventListener('storage', handleUpdate);

  return () => {
    window.removeEventListener(EVENT_NAME, handleUpdate);
    window.removeEventListener('storage', handleUpdate);
  };
}
