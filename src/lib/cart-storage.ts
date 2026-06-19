// Персист корзины в localStorage. Совпадает с конвенцией dsom-* ключей
// (dsom-lang, dsom-cookie-consent, dsom-session). Версия в ключе — безопасная миграция схемы.
import type { CartState } from "@/types/cart";

const KEY = "dsom-cart-v1";
const EMPTY: CartState = { v: 1, lines: [] };

export function loadCart(): CartState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as CartState;
    if (parsed?.v !== 1 || !Array.isArray(parsed.lines)) return EMPTY;
    parsed.lines = parsed.lines
      .filter((l) => l && typeof l.productId === "string" && typeof l.slug === "string")
      .map((l) => ({
        ...l,
        qty: Math.max(1, Math.floor(Number(l.qty) || 1)),
        price: Number(l.price) || 0,
      }));
    return parsed;
  } catch {
    return EMPTY;
  }
}

export function saveCart(state: CartState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // quota / private mode — корзина живёт только в памяти на эту сессию
  }
}
