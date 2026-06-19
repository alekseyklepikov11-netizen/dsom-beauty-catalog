/**
 * Централизованная конфигурация старта продаж и промо-фаз.
 *
 * При сдвиге даты — поменять ЗДЕСЬ и в /root/.dsom/launch_config.json на VPS
 * (или запустить helper: `python dsom-tools/shift-launch.py 2026-07-15`).
 *
 * Используется в: PromoGate, Index, Catalog, email-шаблонах, sitemap.
 */
export const LAUNCH_CONFIG = {
  /** Дата старта продаж на Ozon */
  launchDate: "2026-07-01",

  /** До этой даты бот выдаёт 10% (включительно) */
  phase1EndDate: "2026-07-31",

  /** Публичный label старта для ВСЕХ текстов (резильентный, не протухает; правило владельца 18.06.2026: «лето 2026»).
   *  Точная launchDate выше — ТОЛЬКО для счётчиков/фаз промо, в публичный текст не выводить. */
  launchLabelRu: "лето 2026",
  launchLabelEn: "summer 2026",

  /** Ozon-промокод фазы 1 (launch) */
  launchCode: "DSOM10",
  launchDiscountPercent: 10,

  /** Ozon-промокод фазы 2 (welcome, бессрочно) */
  welcomeCode: "DSOM5",
  welcomeDiscountPercent: 5,

  /** Ссылка на Ozon магазин с UTM */
  ozonSellerUrl: "https://www.ozon.ru/seller/dsom?utm_source=site&utm_medium=promo",

  /** Telegram канал бренда */
  telegramChannel: "https://t.me/dsom_official",
  telegramChannelUsername: "@dsom_official",

  /** Telegram бот для выдачи промокода */
  telegramBotUrl: "https://t.me/dsom_promo_bot?start=promo5",

  /** ФИЧА-ФЛАГ D2C-корзины. false = корзина/чекаут скрыты на всём сайте (кнопки, иконка, /checkout → редирект).
   *  Включать ТОЛЬКО когда подключены оплата/доставка и пройдено ревью. */
  cartEnabled: true,
  /** Блок выбора нашей доставки/ПВЗ в чекауте. false = скрыт даже при включённой корзине
   *  (правило владельца 19.06: иметь возможность скрывать пункты выдачи). */
  cartDeliveryEnabled: false,
} as const;

/** Сегодняшняя фаза: 'launch' (10%) или 'welcome' (5%). */
export function currentPhase(today = new Date()): "launch" | "welcome" {
  const phase1End = new Date(LAUNCH_CONFIG.phase1EndDate + "T23:59:59");
  return today <= phase1End ? "launch" : "welcome";
}

/** Дата старта в человеко-читаемом виде. */
export function launchDateRu(): string {
  const d = new Date(LAUNCH_CONFIG.launchDate);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}
export function launchDateEn(): string {
  const d = new Date(LAUNCH_CONFIG.launchDate);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

/** Корзина/чекаут включены? (фича-флаг) */
export const isCartEnabled = (): boolean => LAUNCH_CONFIG.cartEnabled;
/** Блок нашей доставки/ПВЗ в чекауте включён? (требует и cartEnabled). */
export const isCartDeliveryEnabled = (): boolean =>
  LAUNCH_CONFIG.cartEnabled && LAUNCH_CONFIG.cartDeliveryEnabled;
