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
