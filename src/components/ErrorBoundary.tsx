// ============================================================
// ErrorBoundary.tsx — страховка от белого экрана.
// ============================================================
// Ловит ошибки рендера и неудачную загрузку «ленивого» чанка страницы
// (после выкладки старые файлы /assets/* удаляются, а у человека открыта
// старая вкладка). Для ошибки чанка — один автоматический reload, дальше
// — экран с кнопкой «Обновить страницу». Сбрасывается при смене адреса.
// ============================================================

import { Component, type ErrorInfo, type ReactNode } from "react";
import { isChunkLoadError, reloadOnceForStaleChunk } from "@/lib/chunkReload";

function currentLang(): "ru" | "en" {
  try {
    return document.documentElement.lang === "en" ? "en" : "ru";
  } catch {
    return "ru";
  }
}

interface Props {
  children: ReactNode;
  /** При смене ключа (например, адреса страницы) ошибка сбрасывается. */
  resetKey?: string;
}

interface State {
  error: unknown;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
    if (isChunkLoadError(error)) reloadOnceForStaleChunk();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    const en = currentLang() === "en";
    return (
      <main role="alert" className="min-h-screen grid place-items-center bg-background px-6 py-24">
        <div className="text-center max-w-md">
          <h1 className="font-display text-4xl md:text-5xl">
            {en ? "The page did not load" : "Страница не загрузилась"}
          </h1>
          <p className="text-muted-foreground mt-6 leading-relaxed">
            {en
              ? "The site may have been updated while this tab was open. Reload the page to continue."
              : "Возможно, сайт обновился, пока вкладка была открыта. Обновите страницу, чтобы продолжить."}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-10">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-foreground text-background px-6 py-3 text-[11px] tracking-luxe uppercase hover:bg-foreground/90 transition-colors"
            >
              {en ? "Reload page" : "Обновить страницу"}
            </button>
            <a
              href="/"
              className="border border-foreground text-foreground px-6 py-3 text-[11px] tracking-luxe uppercase hover:bg-foreground hover:text-background transition-colors"
            >
              {en ? "Home" : "На главную"}
            </a>
          </div>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
