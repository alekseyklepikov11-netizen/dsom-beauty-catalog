import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_KEY = "dsom-cookie-consent";

const CookieBanner = () => {
  const { i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const lang = i18n.language;

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) {
      // Show after 1.2s so it doesn't fight with hero animation
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const set = (val: "accepted" | "rejected") => {
    localStorage.setItem(COOKIE_KEY, val);
    localStorage.setItem(`${COOKIE_KEY}-at`, new Date().toISOString());
    setVisible(false);
    // Fire a custom event so other components can react (e.g. start tracking)
    window.dispatchEvent(new CustomEvent("dsom:cookie-consent", { detail: val }));
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={lang === "en" ? "Cookie consent" : "Согласие на cookie"}
      className="fixed bottom-4 inset-x-4 md:left-auto md:right-6 md:bottom-6 z-[90] max-w-md md:w-[420px] bg-background border border-border rounded-2xl shadow-soft p-5 md:p-6 animate-fade-up"
    >
      <button
        onClick={() => set("rejected")}
        aria-label="Close"
        className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <p className="text-[10px] tracking-luxe uppercase text-accent mb-2">
        {lang === "en" ? "— Cookies" : "— Cookie-файлы"}
      </p>
      <h3 className="font-display text-2xl leading-tight mb-3">
        {lang === "en" ? "We respect your privacy" : "Мы уважаем вашу приватность"}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        {lang === "en"
          ? "We use cookies to analyse traffic and improve the site. You can accept or decline."
          : "Мы используем cookie-файлы для анализа посещений и улучшения сайта. Вы можете принять или отказаться."}{" "}
        <Link to="/page/privacy" className="underline underline-offset-4 hover:text-foreground">
          {lang === "en" ? "Privacy policy" : "Политика конфиденциальности"}
        </Link>
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => set("accepted")}
          className="flex-1 bg-foreground text-background rounded-full py-2.5 text-[11px] tracking-luxe uppercase hover:bg-accent transition-colors"
        >
          {lang === "en" ? "Accept" : "Принять"}
        </button>
        <button
          onClick={() => set("rejected")}
          className="flex-1 border border-border rounded-full py-2.5 text-[11px] tracking-luxe uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
        >
          {lang === "en" ? "Decline" : "Отказаться"}
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
