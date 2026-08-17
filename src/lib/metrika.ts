/**
 * Яндекс.Метрика — обёртка с уважением к cookie-consent (152-ФЗ).
 * ID счётчика берётся из VITE_YANDEX_METRIKA_ID. Если пусто — модуль no-op.
 */
import { hasAnalyticsConsent } from "./analytics";

const ID = import.meta.env.VITE_YANDEX_METRIKA_ID as string | undefined;

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
    Ya?: unknown;
  }
}

let initialized = false;

export function initMetrika() {
  if (typeof window === "undefined" || initialized || !ID) return;
  if (!hasAnalyticsConsent()) {
    // Подождём согласия. НЕ once: событие может сначала прийти с "rejected"
    // (пользователь передумает позже) — слушаем, пока не будет "accepted".
    const onConsent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "accepted") {
        window.removeEventListener("dsom:cookie-consent", onConsent);
        initMetrika();
      }
    };
    window.addEventListener("dsom:cookie-consent", onConsent);
    return;
  }
  initialized = true;

  // Стандартный inline-инициализатор Я.Метрики
  (function (m: any, e: any, t: any, r: any, i: any, k?: any, a?: any) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date().getTime();
    for (let j = 0; j < document.scripts.length; j++) {
      if (document.scripts[j].src === r) return;
    }
    k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r;
    a.parentNode.insertBefore(k, a);
  })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

  // Параметры повторяют прежний inline-init из index.html (удалён 17.08.2026 —
  // гейт согласия). Вебвизор: содержимое полей ввода НЕ записывается — на всех
  // формах с ПДн стоит класс ym-disable-keys, плюс в настройках счётчика
  // запись полей должна быть выключена (проверка — на стороне владельца).
  window.ym?.(ID, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    ecommerce: "dataLayer",
    referrer: document.referrer,
    url: location.href,
    defer: true,
  });

  // defer:true отключает автоматический первый hit — шлём его явно
  // (текущая страница: либо загрузка с сохранённым согласием, либо страница,
  // на которой пользователь только что нажал «Принять»). Дальнейшие hit'ы
  // при SPA-навигации шлёт <YandexMetrika /> (пропускает свой первый рендер).
  window.ym?.(ID, "hit", location.pathname + location.search, {
    referer: document.referrer,
    title: document.title,
  });
}

/** Отправить goal/event в Я.Метрику. Тихо игнорирует если не инициализирована. */
export function ymGoal(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !ID || !window.ym) return;
  try { window.ym(ID, "reachGoal", name, params); } catch { /* silent */ }
}

/** SPA-навигация: сообщить о смене страницы. */
export function ymHit(path: string) {
  if (typeof window === "undefined" || !ID || !window.ym) return;
  try { window.ym(ID, "hit", path); } catch { /* silent */ }
}
