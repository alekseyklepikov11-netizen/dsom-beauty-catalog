import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";
import { initMetrika } from "./lib/metrika";
import { reloadOnceForStaleChunk } from "./lib/chunkReload";

// После выкладки старые чанки /assets/* удаляются. Если вкладка была открыта раньше,
// ленивая страница не загрузится → один раз перезагружаем страницу (защита от цикла — в sessionStorage).
// Если перезагрузка уже была только что, ошибку покажет ErrorBoundary с кнопкой «Обновить страницу».
window.addEventListener("vite:preloadError", (event) => {
  if (reloadOnceForStaleChunk()) event.preventDefault();
});

initMetrika();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
