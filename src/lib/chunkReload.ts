// Обработка устаревших чанков после выкладки: общая для main.tsx (vite:preloadError) и ErrorBoundary.

const RELOAD_KEY = "dsom:chunk-reload-at";
/** Не перезагружать чаще, чем раз в это окно — защита от бесконечного цикла. */
const RELOAD_WINDOW_MS = 30_000;

/** Похоже на ошибку загрузки динамического импорта (устаревший чанк после выкладки)? */
export function isChunkLoadError(error: unknown): boolean {
  const msg = String((error as { message?: string } | null)?.message ?? error ?? "");
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|ChunkLoadError/i.test(
    msg,
  );
}

/**
 * Однократная перезагрузка страницы при устаревшем чанке.
 * Возвращает true, если reload запущен; false — если недавно уже перезагружались
 * (тогда ошибку показывает ErrorBoundary).
 */
export function reloadOnceForStaleChunk(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY) || 0);
    if (last && Date.now() - last < RELOAD_WINDOW_MS) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // sessionStorage недоступен (приватный режим/запрет) — без флага не рискуем зациклиться.
    return false;
  }
  window.location.reload();
  return true;
}
