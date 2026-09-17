import { useState, useEffect, useCallback } from 'react';
import type { OperationalProduct } from '../types/operational';

export interface CartItem {
  product: OperationalProduct;
  quantity: number;
  notes?: string;
}

const CART_STORAGE_KEY = 'rms_customer_cart';
const TABLE_ID_KEY = 'rms_customer_table_id';
const TABLE_NUM_KEY = 'rms_customer_table_number';
const CART_EVENT = 'rms_cart_update';

function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_EVENT));
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => getStoredCart());
  const [tableId, setTableIdState] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(TABLE_ID_KEY) : null;
  });
  const [tableNumber, setTableNumberState] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(TABLE_NUM_KEY);
    return raw ? parseInt(raw, 10) : null;
  });

  const refresh = useCallback(() => {
    setItems(getStoredCart());
    if (typeof window !== 'undefined') {
      setTableIdState(localStorage.getItem(TABLE_ID_KEY));
      const rawNum = localStorage.getItem(TABLE_NUM_KEY);
      setTableNumberState(rawNum ? parseInt(rawNum, 10) : null);
    }
  }, []);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(CART_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(CART_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, [refresh]);

  const setTable = useCallback((id: string, num: number) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TABLE_ID_KEY, id);
      localStorage.setItem(TABLE_NUM_KEY, num.toString());
      setTableIdState(id);
      setTableNumberState(num);
      window.dispatchEvent(new CustomEvent(CART_EVENT));
    }
  }, []);

  const addItem = useCallback((product: OperationalProduct, quantity = 1, notes?: string) => {
    const current = getStoredCart();
    const existingIndex = current.findIndex((it) => it.product.id === product.id);

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = current.map((it, idx) =>
        idx === existingIndex
          ? {
              ...it,
              quantity: it.quantity + quantity,
              notes: notes !== undefined ? notes : it.notes,
            }
          : it
      );
    } else {
      updated = [...current, { product, quantity, notes }];
    }

    saveCartToStorage(updated);
    setItems(updated);
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    const current = getStoredCart();
    const updated = current
      .map((it) => {
        if (it.product.id === productId) {
          const newQty = it.quantity + delta;
          return newQty > 0 ? { ...it, quantity: newQty } : null;
        }
        return it;
      })
      .filter((it): it is CartItem => it !== null);

    saveCartToStorage(updated);
    setItems(updated);
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const current = getStoredCart();
    let updated: CartItem[];
    if (quantity <= 0) {
      updated = current.filter((it) => it.product.id !== productId);
    } else {
      updated = current.map((it) =>
        it.product.id === productId ? { ...it, quantity } : it
      );
    }

    saveCartToStorage(updated);
    setItems(updated);
  }, []);

  const updateNotes = useCallback((productId: string, notes: string) => {
    const current = getStoredCart();
    const updated = current.map((it) =>
      it.product.id === productId ? { ...it, notes: notes.trim() } : it
    );
    saveCartToStorage(updated);
    setItems(updated);
  }, []);

  const removeItem = useCallback((productId: string) => {
    const current = getStoredCart();
    const updated = current.filter((it) => it.product.id !== productId);
    saveCartToStorage(updated);
    setItems(updated);
  }, []);

  const clearCart = useCallback(() => {
    saveCartToStorage([]);
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = Math.round(
    items.reduce((sum, it) => sum + it.quantity * it.product.price, 0) * 100
  ) / 100;
  const total = subtotal;

  return {
    items,
    tableId,
    tableNumber,
    setTable,
    addItem,
    updateQuantity,
    setQuantity,
    updateNotes,
    removeItem,
    clearCart,
    itemCount,
    subtotal,
    total,
  };
}
