// ============================================================
// supabase-errors.ts — typed helpers для распознавания PostgREST/Postgres ошибок.
// ============================================================
// Используется во всех hooks и admin pages, где нужно отличить "временную"
// ошибку (JWT expired, schema mismatch) от "настоящей" (server down, bad request).
//
// ВАЖНО: НЕ ловим подстроку "does not exist" — она появляется в неродственных
// ошибках (foreign key violations, missing relations и т.п.) и приводит к
// silent degraded behaviour. Только known error codes.
// ============================================================

import type { PostgrestError } from "@supabase/supabase-js";

/**
 * PostgreSQL error 42703 = undefined_column.
 * Происходит когда код SELECT-ит колонку которой нет в таблице (миграция не накатана).
 */
export const isMissingColumn = (e: PostgrestError | null | undefined): boolean =>
  e?.code === "42703";

/**
 * PostgREST error PGRST301 = JWT expired.
 * Происходит когда auth-токен на клиенте устарел и нужно перелогиниться.
 */
export const isJwtExpired = (e: PostgrestError | null | undefined): boolean =>
  e?.code === "PGRST301";

/**
 * После DELETE+.select(): если RLS отфильтровала все строки, вернётся пустой массив.
 * Это значит "нет прав" даже при HTTP 200/204. Используется в admin remove() для
 * различения "удалено" vs "RLS не пустила".
 */
export const isRlsBlocked = (rows: unknown[] | null | undefined): boolean =>
  Array.isArray(rows) && rows.length === 0;

/**
 * Human-readable классификация для toast-сообщений в админке.
 */
export function classifyError(e: PostgrestError | null | undefined): {
  kind: "missing_column" | "jwt_expired" | "permission" | "unknown";
  userMessage: string;
} {
  if (!e) return { kind: "unknown", userMessage: "Неизвестная ошибка" };
  if (isMissingColumn(e)) {
    return {
      kind: "missing_column",
      userMessage: "Структура БД устарела — обратись к разработчику для применения миграции",
    };
  }
  if (isJwtExpired(e)) {
    return {
      kind: "jwt_expired",
      userMessage: "Сессия истекла — перелогинься в /admin/login",
    };
  }
  if (e.code === "42501" || e.code === "PGRST201") {
    return {
      kind: "permission",
      userMessage: "Нет прав. Возможно, истекла сессия — перелогинься в /admin/login",
    };
  }
  return { kind: "unknown", userMessage: `Ошибка: ${e.message || "unknown"}` };
}
