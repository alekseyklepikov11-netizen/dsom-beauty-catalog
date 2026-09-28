/** Ключ решения по cookie в localStorage (то же значение читает src/lib/analytics.ts). */
export const COOKIE_KEY = "dsom-cookie-consent";

/** Решение по cookie уже принято? Безопасно для приватного режима (localStorage может бросать). */
export const hasCookieDecision = (): boolean => {
  try {
    return !!localStorage.getItem(COOKIE_KEY);
  } catch {
    return true; // хранилище недоступно — баннер не показываем, чтобы не висел вечно
  }
};
