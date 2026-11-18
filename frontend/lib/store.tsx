"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { getCurrentUser } from "./api/auth";
import {
  getSizes,
  getToppings,
  type SizeOption,
  type Topping,
} from "./api/products";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  imageUrl: string;
  size: string;
  toppings: string[];
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderItem extends Omit<CartItem, "unitPrice"> {
  orderId: string;
}

export interface Payment {
  id: string;
  orderId: string;
  idempotencyKey: string;
  amount: number;
  method: string;
  status?: "PAID" | "FAILED";
}

export interface Order {
  id: string;
  items: OrderItem[];
  subTotal?: number;
  discountAmount?: number;
  total: number;
  status:
    | "PENDING"
    | "PAID"
    | "PREPARING"
    | "READY"
    | "COMPLETED"
    | "PAYMENT_FAILED"
    | "CANCELLED";
  promotionCode?: string | null;
  pointsSpent?: number;
  createdAt: Date;
  payment?: {
    id: string;
    method: string;
    amount: number;
    status?: "PAID" | "FAILED";
  };
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
  | { type: "ADD_TO_CART"; item: CartItem }
  | { type: "REMOVE_FROM_CART"; id: string }
  | { type: "UPDATE_QTY"; id: string; qty: number }
  | { type: "CLEAR_CART" }
  | { type: "SET_CART"; cart: CartItem[] }
  | { type: "PLACE_ORDER"; order: Order }
  | { type: "SET_ORDERS"; orders: Order[] }
  | { type: "SET_USER"; user: User | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existing = state.cart.find(
        (i) =>
          i.productId === action.item.productId &&
          i.size === action.item.size &&
          JSON.stringify(i.toppings.slice().sort()) ===
            JSON.stringify(action.item.toppings.slice().sort()),
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
              : i,
          ),
        };
      }
      return { ...state, cart: [...state.cart, action.item] };
    }
    case "REMOVE_FROM_CART":
      return { ...state, cart: state.cart.filter((i) => i.id !== action.id) };
    case "UPDATE_QTY":
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.id === action.id
            ? { ...i, qty: action.qty, lineTotal: i.unitPrice * action.qty }
            : i,
        ),
      };
    case "CLEAR_CART":
      return { ...state, cart: [] };
    case "SET_CART":
      return { ...state, cart: action.cart };
    case "PLACE_ORDER":
      return { ...state, orders: [action.order, ...state.orders], cart: [] };
    case "SET_ORDERS":
      return {
        ...state,
        orders: action.orders,
      };
    case "SET_USER":
      return { ...state, user: action.user };
    default:
      return state;
  }
}

interface StoreCtx {
  state: State;
  dispatch: React.Dispatch<Action>;
  cartTotal: number;
  cartCount: number;
  sizes: SizeOption[];
  toppings: Topping[];
  loadingOptions: boolean;
}

const StoreContext = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cartHydrated, setCartHydrated] = useState(false);
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [state, dispatch] = useReducer(reducer, {
    cart: [],
    orders: [],
    user: null,
  });

  useEffect(() => {
    const storedCart = localStorage.getItem("brewlite_cart");

    if (storedCart) {
      try {
        const parsedCart: unknown = JSON.parse(storedCart);
        if (Array.isArray(parsedCart)) {
          dispatch({ type: "SET_CART", cart: parsedCart as CartItem[] });
        }
      } catch (error) {
        console.error("Không thể khôi phục giỏ hàng:", error);
      }
    }

    setCartHydrated(true);
  }, []);

  useEffect(() => {
    if (cartHydrated) {
      localStorage.setItem("brewlite_cart", JSON.stringify(state.cart));
    }
  }, [cartHydrated, state.cart]);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const [sizeList, toppingList] = await Promise.all([
          getSizes(),
          getToppings(),
        ]);
        if (!active) return;
        setSizes(sizeList);
        setToppings(toppingList);
      } catch (error) {
        console.error("Không thể tải kích cỡ và topping:", error);
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const user = await getCurrentUser();

        if (!active) return;

        dispatch({ type: "SET_USER", user });

        if (!user) {
          dispatch({ type: "SET_ORDERS", orders: [] });
        }
      } catch (error) {
        console.error("Không thể khôi phục đăng nhập:", error);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const cartTotal = state.cart.reduce((sum, i) => sum + i.lineTotal, 0);
  const cartCount = state.cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <StoreContext.Provider
      value={{
        state,
        dispatch,
        cartTotal,
        cartCount,
        sizes,
        toppings,
        loadingOptions,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}