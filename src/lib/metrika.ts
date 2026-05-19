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
    // Подождём согласия
    window.addEventListener("dsom:cookie-consent", (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "accepted") initMetrika();
    }, { once: true });
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

  window.ym?.(ID, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    defer: true,
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
