'use client';

import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { formatPrice } from './data';
import { getCurrentUser } from './api/auth';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  imageUrl: string;
  size: 'S' | 'M' | 'L';
  toppings: string[];
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderItem extends Omit<CartItem, 'unitPrice'> {
  orderId: string;
}

export interface Payment {
  id: string;
  orderId: string;
  idempotencyKey: string;
  amount: number;
  method: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'PENDING' | 'PAID' | 'PAYMENT_FAILED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  payment?: Payment;
}

export interface User {
  id: string;
  email: string;
  name: string;
  loyaltyPoints: number;
}

interface State {
  cart: CartItem[];
  orders: Order[];
  user: User | null;
}

type Action =
  | { type: 'ADD_TO_CART'; item: CartItem }
  | { type: 'REMOVE_FROM_CART'; id: string }
  | { type: 'UPDATE_QTY'; id: string; qty: number }
  | { type: 'CLEAR_CART' }
  | { type: 'PLACE_ORDER'; order: Order }
  | { type: 'SET_USER'; user: User | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existing = state.cart.find(
        (i) =>
          i.productId === action.item.productId &&
          i.size === action.item.size &&
          JSON.stringify(i.toppings.slice().sort()) ===
            JSON.stringify(action.item.toppings.slice().sort())
      );
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((i) =>
            i.id === existing.id
              ? {
                  ...i,
                  qty: i.qty + action.item.qty,
                  lineTotal: i.unitPrice * (i.qty + action.item.qty),
                }
              : i
          ),
        };
      }
      return { ...state, cart: [...state.cart, action.item] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter((i) => i.id !== action.id) };
    case 'UPDATE_QTY':
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.id === action.id
            ? { ...i, qty: action.qty, lineTotal: i.unitPrice * action.qty }
            : i
        ),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'PLACE_ORDER':
      return { ...state, orders: [action.order, ...state.orders], cart: [] };
    case 'SET_USER':
      return { ...state, user: action.user };
    default:
      return state;
  }
}

const sampleOrders: Order[] = [
  {
    id: 'BL-20260920-001',
    userId: 'u_1',
    items: [
      {
        id: 'hist-1',
        orderId: 'BL-20260920-001',
        productId: 'latte',
        name: 'Caffe Latte',
        imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?fit=crop&auto=format',
        size: 'M',
        toppings: ['cream-foam'],
        qty: 2,
        lineTotal: 122000,
      },
    ],
    total: 122000,
    status: 'COMPLETED',
    payment: {
      id: 'payment-001',
      orderId: 'BL-20260920-001',
      idempotencyKey: 'mock-pay-001',
      amount: 122000,
      method: 'Ví MoMo',
    },
    createdAt: new Date('2026-09-20T10:30:00'),
  },
  {
    id: 'BL-20260922-003',
    userId: 'u_1',
    items: [
      {
        id: 'hist-2',
        orderId: 'BL-20260922-003',
        productId: 'cold-brew',
        name: 'Cold Brew',
        imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?fit=crop&auto=format',
        size: 'L',
        toppings: [],
        qty: 1,
        lineTotal: 70000,
      },
    ],
    total: 70000,
    status: 'READY',
    payment: {
      id: 'payment-002',
      orderId: 'BL-20260922-003',
      idempotencyKey: 'mock-pay-002',
      amount: 70000,
      method: 'Thẻ nội địa',
    },
    createdAt: new Date('2026-09-22T14:15:00'),
  },
];

interface StoreCtx {
  state: State;
  dispatch: React.Dispatch<Action>;
  cartTotal: number;
  cartCount: number;
}

const StoreContext = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    cart: [],
    orders: sampleOrders,
    user: null,
  });

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((user) => {
        if (active && user) dispatch({ type: 'SET_USER', user });
      })
      .catch((error: unknown) => {
        console.error('Không thể khôi phục phiên đăng nhập:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  const cartTotal = state.cart.reduce((sum, i) => sum + i.lineTotal, 0);
  const cartCount = state.cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <StoreContext.Provider value={{ state, dispatch, cartTotal, cartCount }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}
