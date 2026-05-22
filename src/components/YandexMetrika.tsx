/**
 * Яндекс.Метрика — SPA-обёртка для React Router.
 *
 * Базовый скрипт счётчика загружается в index.html и считает только первый hit.
 * Этот компонент отправляет дополнительные `hit` при каждой смене маршрута,
 * чтобы Метрика корректно считала просмотры внутри SPA.
 *
 * Счётчик ID: 109378044
 * Включено: webvisor, clickmap, ecommerce (dataLayer), accurateTrackBounce, trackLinks
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const COUNTER_ID = 109378044;

declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: unknown[]) => void;
  }
}

export default function YandexMetrika() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Пропускаем самый первый рендер — его уже посчитал inline-скрипт в index.html
    if (typeof window === "undefined") return;
    if (typeof window.ym !== "function") return;

    window.ym(COUNTER_ID, "hit", pathname + search, {
      referer: document.referrer,
      title: document.title,
    });
  }, [pathname, search]);

  return null;
}
