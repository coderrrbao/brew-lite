'use client';

import React, { createContext, useContext, useReducer, useState } from 'react';
import { formatPrice } from './data';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  imageId: string;
  size: 'S' | 'M' | 'L';
  toppings: string[];
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'PENDING' | 'PAID' | 'PAYMENT_FAILED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: string;
  createdAt: Date;
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
            i.id === existing.id ? { ...i, qty: i.qty + action.item.qty } : i
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
          i.id === action.id ? { ...i, qty: action.qty } : i
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
    items: [
      {
        id: 'hist-1',
        productId: 'latte',
        name: 'Caffe Latte',
        imageId: '1541167760496-1628856ab772',
        size: 'M',
        toppings: ['cream-foam'],
        qty: 2,
        unitPrice: 61000,
      },
    ],
    total: 122000,
    status: 'COMPLETED',
    paymentMethod: 'MoMo',
    createdAt: new Date('2026-09-20T10:30:00'),
  },
  {
    id: 'BL-20260922-003',
    items: [
      {
        id: 'hist-2',
        productId: 'cold-brew',
        name: 'Cold Brew',
        imageId: '1461023058943-07fcbe16d735',
        size: 'L',
        toppings: [],
        qty: 1,
        unitPrice: 70000,
      },
    ],
    total: 70000,
    status: 'READY',
    paymentMethod: 'Thẻ nội địa',
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

  const cartTotal = state.cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
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
