// Глобальный стор корзины: Context + reducer + localStorage-персист.
// Паттерн повторяет useAuth/useFavorites (проект на Context, zustand НЕ используется).
// Подключается в App.tsx как <CartProvider> внутри <BrowserRouter>.
import {
  createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode,
} from "react";
import { loadCart, saveCart } from "@/lib/cart-storage";
import type { CartLine, CartState } from "@/types/cart";

type Action =
  | { type: "add"; line: Omit<CartLine, "qty">; qty?: number }
  | { type: "setQty"; productId: string; qty: number }
  | { type: "remove"; productId: string }
  | { type: "clear" }
  | { type: "hydrate"; state: CartState };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "add": {
      const qty = Math.max(1, action.qty ?? 1);
      const existing = state.lines.find((l) => l.productId === action.line.productId);
      const lines = existing
        ? state.lines.map((l) =>
            l.productId === action.line.productId ? { ...l, qty: l.qty + qty } : l)
        : [...state.lines, { ...action.line, qty }];
      return { ...state, lines };
    }
    case "setQty": {
      const qty = Math.max(1, Math.floor(action.qty));
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.productId === action.productId ? { ...l, qty } : l),
      };
    }
    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.productId !== action.productId) };
    case "clear":
      return { v: 1, lines: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as CartState, loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { saveCart(state); }, [state]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "dsom-cart-v1") dispatch({ type: "hydrate", state: loadCart() });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.lines.reduce((s, l) => s + l.qty, 0);
    const subtotal = state.lines.reduce((s, l) => s + l.price * l.qty, 0);
    return {
      lines: state.lines,
      count,
      subtotal,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add: (line, qty) => { dispatch({ type: "add", line, qty }); setIsOpen(true); },
      setQty: (productId, qty) => dispatch({ type: "setQty", productId, qty }),
      remove: (productId) => dispatch({ type: "remove", productId }),
      clear: () => dispatch({ type: "clear" }),
      has: (productId) => state.lines.some((l) => l.productId === productId),
    };
  }, [state, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
