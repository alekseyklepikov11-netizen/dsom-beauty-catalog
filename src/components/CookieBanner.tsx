import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { COOKIE_KEY, hasCookieDecision } from "@/lib/cookieConsent";

const CookieBanner = () => {
  const { t, i18n } = useTranslation();
  const { isOpen: cartOpen } = useCart();
  const [visible, setVisible] = useState(false);
  const lang = i18n.language;

  useEffect(() => {
    if (!hasCookieDecision()) {
      // Show after 1.2s so it doesn't fight with hero animation
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const set = (val: "accepted" | "rejected") => {
    try {
      localStorage.setItem(COOKIE_KEY, val);
      localStorage.setItem(`${COOKIE_KEY}-at`, new Date().toISOString());
    } catch {
      /* приватный режим — решение действует до перезагрузки */
    }
    setVisible(false);
    // Fire a custom event so other components can react (e.g. start tracking)
    window.dispatchEvent(new CustomEvent("dsom:cookie-consent", { detail: val }));
  };

  // Пока открыта корзина — баннер не показываем, чтобы он не закрывал её нижний блок.
  // Остальные окна (меню, поиск, «Сообщить о поступлении») — Radix-порталы z-50: их затемнение ложится поверх баннера (z-40).
  if (!visible || cartOpen) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={lang === "en" ? "Cookie consent" : "Согласие на cookie"}
      className="fixed bottom-3 inset-x-3 md:left-auto md:right-6 md:bottom-6 z-40 max-w-md md:w-[420px] bg-background border border-border rounded-2xl shadow-soft p-4 pr-11 md:p-6 md:pr-6 animate-fade-up"
    >
      <button
        type="button"
        onClick={() => set("rejected")}
        aria-label={t("a11y.cookieClose")}
        className="absolute top-1 right-1 md:top-2 md:right-2 inline-flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* На телефоне — без надзаголовка и заголовка: баннер в 2 строки текста + кнопки */}
      <p className="hidden md:block text-[10px] tracking-luxe uppercase text-accent mb-2">
        {lang === "en" ? "— Cookies" : "— Cookie-файлы"}
      </p>
      <h3 className="hidden md:block font-display text-2xl leading-tight mb-3">
        {lang === "en" ? "We respect your privacy" : "Мы уважаем вашу приватность"}
      </h3>
      <p className="text-xs md:text-sm text-muted-foreground leading-snug md:leading-relaxed mb-3 md:mb-5">
        {lang === "en"
          ? "We use cookies to analyse traffic and improve the site."
          : "Мы используем cookie-файлы для анализа посещений и улучшения сайта."}
        <span className="hidden md:inline">
          {" "}
          {lang === "en" ? "You can accept or decline." : "Вы можете принять или отказаться."}
        </span>{" "}
        <Link to="/page/privacy" className="underline underline-offset-4 hover:text-foreground">
          {lang === "en" ? "Privacy policy" : "Политика конфиденциальности"}
        </Link>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => set("accepted")}
          className="flex-1 min-h-[40px] bg-foreground text-background rounded-full py-2.5 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
        >
          {lang === "en" ? "Accept" : "Принять"}
        </button>
        <button
          type="button"
          onClick={() => set("rejected")}
          className="flex-1 min-h-[40px] border border-border rounded-full py-2.5 text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
        >
          {lang === "en" ? "Decline" : "Отказаться"}
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
