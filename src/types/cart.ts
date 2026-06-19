// Единый контракт корзины и чекаута: фронт ↔ Edge Functions.
// Контракт приведён к УЖЕ ЗАДЕПЛОЕННОЙ функции calc-delivery:
//   - ключ товара = products.slug (в каталоге НЕТ колонки sku);
//   - суммы доставки приходят с бэка в КОПЕЙКАХ (cost_kopecks);
//   - снапшот цены в строке корзины — для UI; источник истины при заказе — БД.

export type DeliveryProvider = "cdek" | "russianpost"; // MVP. Фаза 2: "ozon" | "yandex".
export type DeliveryMode = "pvz" | "courier";
export type PaymentMethod = "sbp" | "card"; // Фаза 2: "tpay" | "installment".

/** Строка корзины. Снапшот товара на момент добавления. price — РУБЛИ (для UI). */
export interface CartLine {
  productId: string;
  slug: string; // == ключ для calc-delivery (sku)
  name: string;
  nameEn: string | null;
  price: number; // ₽, снимок. Не доверять при заказе — бэк пересчитает из products.price.
  image: string | null;
  volume: string | null;
  qty: number;
}

export interface CartState {
  v: 1;
  lines: CartLine[];
}

export interface PvzPoint {
  id: string;            // pvz_code в системе ТК / ApiShip
  provider: DeliveryProvider;
  name: string;
  address: string;
  city: string;
  meta?: Record<string, unknown>;
}

export interface DeliveryOption {
  provider: DeliveryProvider; // "cdek" | "russianpost"
  tariff: string;
  name: string;
  costKopecks: number;        // КОПЕЙКИ
  daysMin: number;
  daysMax: number;
  pickup: boolean;
}

/** Сырой ответ Edge Function calc-delivery (как отдаёт бэк). */
export interface CalcDeliveryRaw {
  ok: boolean;
  error?: string;
  weight_g?: number;
  mock?: boolean;
  options?: {
    provider: string;
    tariff: string;
    name: string;
    cost_kopecks: number;
    days_min: number;
    days_max: number;
    pickup: boolean;
  }[];
}

export interface CheckoutContact {
  name: string;
  phone: string;
  email: string; // обязателен для оплачиваемого заказа (электронный чек 54-ФЗ)
}

/** Тело запроса create-order (фронт шлёт только id+qty — цены берёт бэк). */
export interface OrderDraft {
  idempotencyKey: string;
  lines: { productId: string; qty: number }[];
  contact: CheckoutContact;
  provider: DeliveryProvider;
  mode: DeliveryMode;
  tariff: string;
  pvz: PvzPoint | null;
  comment?: string;
  payment: PaymentMethod;
  consentPd: boolean;
}

export type OrderPublicStatus =
  | "created"
  | "awaiting_payment"
  | "paid"
  | "fiscalized"
  | "shipment_created"
  | "in_transit"
  | "ready_for_pickup"
  | "delivered"
  | "canceled"
  | "refunded"
  | "payment_failed";

/** Публичный ответ get-order (без PII). Суммы — копейки. */
export interface OrderStatusResponse {
  token: string;
  orderNumber: string;
  status: OrderPublicStatus;
  amountTotal: number;   // копейки
  deliveryTotal: number; // копейки
  carrier: DeliveryProvider | null;
  trackingNumber: string | null;
  createdAt: string;
}

export const kopToRub = (k: number): number => k / 100;
export const fmtRub = (k: number, lang: string): string =>
  kopToRub(k).toLocaleString(lang === "en" ? "en-US" : "ru-RU") + " ₽";
