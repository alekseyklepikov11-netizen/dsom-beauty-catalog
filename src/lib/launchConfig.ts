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
  launchDate: "2026-11-30",

  /** До этой даты бот выдаёт 10% (включительно) */
  phase1EndDate: "2026-12-31",

  /** Публичный label старта для ВСЕХ текстов (резильентный, не протухает).
   *  24.09.2026 владелец перенёс старт на «осень 2026» (было «лето 2026», правило 18.06).
   *  Точная launchDate выше — ТОЛЬКО для счётчиков/фаз промо, в публичный текст не выводить.
   *  launchDate = последний день сезона, чтобы фаза 10% не закончилась раньше старта. */
  launchLabelRu: "осень 2026",
  launchLabelEn: "autumn 2026",
  /** Тот же срок в форме «когда?»: «Старт — осенью 2026». */
  launchWhenRu: "осенью 2026",
  launchWhenEn: "in autumn 2026",

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

  /** ГЛАВНЫЙ ФЛАГ ОПЛАТЫ НА САЙТЕ — единственный переключатель покупки на dsom.ru
   *  (схема А блока покупки, решение владельца 14.10.2026).
   *  false — оплаты на сайте нет, и корзина скрыта на всём сайте: кнопки «В корзину» на странице товара,
   *          в каталоге и на главной, иконка корзины в шапке, сама корзина; /checkout уводит на главную.
   *          На странице товара в пути «02 На сайте dsom.ru» вместо кнопки — строка «Заказ на сайте пока не открыт…».
   *  true  — корзина, кнопка «В корзину» и «Оформить заказ» появляются везде сразу.
   *  Включать ТОЛЬКО когда подключены оплата, касса, «Честный знак» в чеке и документы проверены юристом
   *  (разбор 14.10.2026, раздел 5). Отдельного флага корзины больше нет: корзина без оплаты — тупик. */
  checkoutEnabled: false,
  /** Блок выбора нашей доставки/ПВЗ в чекауте. false = скрыт даже при включённой оплате
   *  (правило владельца 19.06: иметь возможность скрывать пункты выдачи). */
  cartDeliveryEnabled: false,
  /** ФИЧА-ФЛАГ чата поддержки. false = виджет чата не рендерится и его код не грузится. */
  chatEnabled: false,
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

/** Корзина видна? Только вместе с оплатой на сайте (флаг checkoutEnabled выше). */
export const isCartEnabled = (): boolean => LAUNCH_CONFIG.checkoutEnabled;
/** Блок нашей доставки/ПВЗ в чекауте включён? (требует и включённой оплаты). */
export const isCartDeliveryEnabled = (): boolean =>
  isCartEnabled() && LAUNCH_CONFIG.cartDeliveryEnabled;
/** Оформление заказа (оплата) включено? Включать вместе с подключением оплаты. */
export const isCheckoutEnabled = (): boolean => LAUNCH_CONFIG.checkoutEnabled;
/** Чат поддержки включён? */
export const isChatEnabled = (): boolean => LAUNCH_CONFIG.chatEnabled;

/** Ссылка на магазин Ozon с UTM-метками; параметры не дублируются. */
export function buildOzonUrl(
  utm: Record<string, string> = {},
  base: string = LAUNCH_CONFIG.ozonSellerUrl,
): string {
  try {
    const url = new URL(base);
    for (const [key, value] of Object.entries(utm)) {
      if (value) url.searchParams.set(key, value);
    }
    return url.toString();
  } catch {
    return base;
  }
}
