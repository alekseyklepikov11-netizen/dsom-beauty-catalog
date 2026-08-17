/**
 * Яндекс.Метрика — SPA-обёртка для React Router.
 *
 * Счётчик инициализируется ТОЛЬКО после согласия в cookie-баннере
 * (src/lib/metrika.ts, гейт 152-ФЗ; безусловный inline-скрипт из index.html
 * удалён 17.08.2026). Первый hit текущей страницы отправляет initMetrika();
 * этот компонент шлёт дополнительные `hit` при каждой смене маршрута,
 * чтобы Метрика корректно считала просмотры внутри SPA. Первый рендер
 * пропускаем — иначе просмотр стартовой страницы задвоится.
 *
 * Счётчик ID: VITE_YANDEX_METRIKA_ID (109378044 на проде).
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ymHit } from "@/lib/metrika";

export default function YandexMetrika() {
  const { pathname, search } = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return; // стартовую страницу уже посчитал initMetrika()
    }
    ymHit(pathname + search);
  }, [pathname, search]);

  return null;
}
