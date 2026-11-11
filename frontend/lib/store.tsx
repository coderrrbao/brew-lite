'use client';

import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { getCurrentUser } from './api/auth';
import { getMyOrders } from './api/orders';

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
  discount?: number;
  voucherCode?: string;
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
  | { type: 'SET_ORDERS'; orders: Order[] }
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
    case 'SET_ORDERS':
<<<<<<< HEAD
      return {
        ...state,
        orders: action.orders,
      };
=======
      return { ...state, orders: action.orders };
>>>>>>> 9226601 (feat: product view dùng api thật, thêm các loading, error view)
    case 'SET_USER':
      return { ...state, user: action.user };
    default:
      return state;
  }
}

<<<<<<< HEAD

=======
>>>>>>> 9226601 (feat: product view dùng api thật, thêm các loading, error view)
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
    orders: [],
    user: null,
  });

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const user = await getCurrentUser();

        if (!active) return;

        dispatch({ type: 'SET_USER', user });

        if (!user) {
          dispatch({ type: 'SET_ORDERS', orders: [] });
          return;
        }

        // Lấy access token từ localStorage
        const token = localStorage.getItem('brewlite_access_token');

        if (!token) {
          console.error('Không tìm thấy access token');
          return;
        }

        // Lấy lịch sử đơn hàng từ API
        const orders = await getMyOrders(token);

        if (active && orders !== null) {
          dispatch({
            type: 'SET_ORDERS',
            orders,
          });
        }
      } catch (error) {
        console.error('Không thể tải lịch sử đơn hàng:', error);
      }
    }

    loadData();

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
