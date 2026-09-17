import { useState, useEffect, useCallback } from 'react';
import {
  getStoredTables,
  getStoredOrders,
  getStoredProducts,
  getStoredRequests,
  subscribeOperationalUpdates,
  createOrder as storeCreateOrder,
  updateOrderStatus as storeUpdateOrderStatus,
  payAndCompleteOrder as storePayAndCompleteOrder,
  addProduct as storeAddProduct,
  updateProduct as storeUpdateProduct,
  toggleProductAvailability as storeToggleProductAvailability,
  addTable as storeAddTable,
  updateTable as storeUpdateTable,
  toggleTableStatus as storeToggleTableStatus,
  markTableAvailable as storeMarkTableAvailable,
  modifyOrder as storeModifyOrder,
  createServiceRequest as storeCreateServiceRequest,
  acknowledgeServiceRequest as storeAcknowledgeServiceRequest,
  completeServiceRequest as storeCompleteServiceRequest,
} from '../services/operational/operationalStore';
import type {
  RestaurantTable,
  OperationalOrder,
  OperationalOrderItem,
  OperationalProduct,
  CreateOrderInput,
  OrderStatus,
  PaymentMethod,
  CustomerServiceRequest,
  CreateServiceRequestInput,
} from '../types/operational';

export function useOperationalData() {
  const [tables, setTables] = useState<RestaurantTable[]>(() => getStoredTables());
  const [orders, setOrders] = useState<OperationalOrder[]>(() => getStoredOrders());
  const [products, setProducts] = useState<OperationalProduct[]>(() => getStoredProducts());
  const [requests, setRequests] = useState<CustomerServiceRequest[]>(() => getStoredRequests());

  const refresh = useCallback(() => {
    setTables(getStoredTables());
    setOrders(getStoredOrders());
    setProducts(getStoredProducts());
    setRequests(getStoredRequests());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeOperationalUpdates(() => {
      refresh();
    });
    return unsubscribe;
  }, [refresh]);

  const createOrder = useCallback(
    (input: CreateOrderInput) => {
      const order = storeCreateOrder(input);
      refresh();
      return order;
    },
    [refresh]
  );

  const updateStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      const order = storeUpdateOrderStatus(orderId, status);
      refresh();
      return order;
    },
    [refresh]
  );

  const payOrder = useCallback(
    (orderId: string, method: PaymentMethod) => {
      const res = storePayAndCompleteOrder(orderId, method);
      refresh();
      return res;
    },
    [refresh]
  );

  const addProduct = useCallback(
    (data: Omit<OperationalProduct, 'id'>) => {
      const p = storeAddProduct(data);
      refresh();
      return p;
    },
    [refresh]
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<OperationalProduct>) => {
      const p = storeUpdateProduct(id, updates);
      refresh();
      return p;
    },
    [refresh]
  );

  const toggleProductAvailability = useCallback(
    (id: string) => {
      const p = storeToggleProductAvailability(id);
      refresh();
      return p;
    },
    [refresh]
  );

  const addTable = useCallback(
    (data: { number: number; capacity: number }) => {
      const t = storeAddTable(data);
      refresh();
      return t;
    },
    [refresh]
  );

  const updateTable = useCallback(
    (id: string, updates: Partial<RestaurantTable>) => {
      const t = storeUpdateTable(id, updates);
      refresh();
      return t;
    },
    [refresh]
  );

  const toggleTableStatus = useCallback(
    (id: string) => {
      const t = storeToggleTableStatus(id);
      refresh();
      return t;
    },
    [refresh]
  );

  const markTableAvailable = useCallback(
    (tableId: string) => {
      const t = storeMarkTableAvailable(tableId);
      refresh();
      return t;
    },
    [refresh]
  );

  const modifyOrder = useCallback(
    (
      orderId: string,
      updates: {
        items?: OperationalOrderItem[];
        specialInstructions?: string;
      }
    ) => {
      const o = storeModifyOrder(orderId, updates);
      refresh();
      return o;
    },
    [refresh]
  );

  const confirmOrder = useCallback(
    (orderId: string) => {
      const o = storeUpdateOrderStatus(orderId, 'Confirmed');
      refresh();
      return o;
    },
    [refresh]
  );

  const sendToKitchen = useCallback(
    (orderId: string) => {
      // Moves to Confirmed if still Pending
      const current = getStoredOrders().find((o) => o.id === orderId);
      if (current && current.status === 'Pending') {
        const o = storeUpdateOrderStatus(orderId, 'Confirmed');
        refresh();
        return o;
      }
      return current;
    },
    [refresh]
  );

  const createRequest = useCallback(
    (input: CreateServiceRequestInput) => {
      const req = storeCreateServiceRequest(input);
      refresh();
      return req;
    },
    [refresh]
  );

  const acknowledgeRequest = useCallback(
    (id: string) => {
      const req = storeAcknowledgeServiceRequest(id);
      refresh();
      return req;
    },
    [refresh]
  );

  const completeRequest = useCallback(
    (id: string) => {
      const req = storeCompleteServiceRequest(id);
      refresh();
      return req;
    },
    [refresh]
  );

  return {
    tables,
    orders,
    products,
    requests,
    refresh,
    createOrder,
    updateStatus,
    payOrder,
    addProduct,
    updateProduct,
    toggleProductAvailability,
    addTable,
    updateTable,
    toggleTableStatus,
    markTableAvailable,
    modifyOrder,
    confirmOrder,
    sendToKitchen,
    createRequest,
    acknowledgeRequest,
    completeRequest,
  };
}

